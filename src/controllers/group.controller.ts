import { Request, Response } from 'express';
import Group from '../models/group.model';
import User from '../models/user.model';
import GroupMessage from '../models/group-message.model';
import Contact from "../models/contact.model";
import { sendTemplateMsg } from '../services/whatsappService';
import { Op } from 'sequelize';

// Create group
export const createGroup = async (req: Request, res: Response) => {
    try {
        const { groupName, description, category, contactIds } = req.body;
        Group.sync({ alter: true });
        const group = await Group.create({ groupName, description, category, contactIds });
        res.status(201).json({ message: 'Group created successfully', group });
    } catch (error: any) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: 'Error creating group', error: error.message });
    }
};

// List groups
export const listGroups = async (_req: Request, res: Response) => {
    try {
        const groups = await Group.findAll({ order: [['createdAt', 'DESC']] });

        // attach user details
        // const result = await Promise.all(groups.map(async (group) => {
        //   let users: any[] = [];
        //   if (group.userIds && Array.isArray(group.userIds)) {
        //     users = await User.findAll({
        //         where: { id: group.userIds },
        //         attributes: ['id', 'username', 'empId', 'mobile']  // only required fields
        //       });
        //   }
        //   return { ...group.toJSON(), users };
        // }));
        res.status(200).json({ groups: groups });
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching groups', error: error.message });
    }
};

// Get single group
export const getGroupById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const group = await Group.findByPk(id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        res.status(200).json({ group });
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching group', error: error.message });
    }
};

// Update group
export const updateGroup = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updated] = await Group.update(req.body, { where: { id } });
        if (!updated) return res.status(404).json({ message: 'Group not found' });
        res.status(200).json({ message: 'Group updated successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating group', error: error.message });
    }
};

// Delete group
export const deleteGroup = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await Group.destroy({ where: { id } });
        if (!deleted) return res.status(404).json({ message: 'Group not found' });
        res.status(200).json({ message: 'Group deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting group', error: error.message });
    }
};

export const sendGroup = async (req: Request, res: Response) => {
  try {
    const { tempName, groupId } = req.body;

    await GroupMessage.sync({ alter: true });
    const group = await GroupMessage.create({
      tempName,
      groupId,
      userId: req.uid,
    });

    const groups = await Group.findAll({
      where: { id: group?.dataValues?.groupId },
    });

    const errors: any[] = []; // collect all errors here

    const result = await Promise.all(
      groups.map(async (group) => {
        let users: any[] = [];
        if (group.contactIds && Array.isArray(group.contactIds)) {
          users = await Contact.findAll({
            where: { id: { [Op.in]: group.contactIds } },
            attributes: ["id", "personName", "phone"],
          });
        }

        if (users.length > 0) {
          for (const user of users) {
            const phone = user?.phone;

            try {
              const rData = await sendTemplateMsg({
                tempName,
                phoneNumber: phone,
              });

              if (rData?.error) {
                errors.push({
                  user: user.id,
                  phone,
                  error: rData.error,
                });
              }
            } catch (err: any) {
              errors.push({
                user: user.id,
                phone,
                error: err.message || err,
              });
            }
          }
        }

        return { ...group.toJSON(), users };
      })
    );

    // ✅ only one response
    res.status(errors.length > 0 ? 207 : 200).json({
      message: errors.length > 0 ? "Some messages failed" : "Messages sent successfully",
      group,
      errors, // return all errors
    });
  } catch (error: any) {
    console.error("Error creating group:", error);
    res.status(500).json({
      message: "Error creating group",
      error: error.message,
    });
  }
};

