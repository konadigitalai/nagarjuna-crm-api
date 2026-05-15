import { Request, Response } from 'express';
import Communication, { CommunicationUser } from '../models/communication.model';
import User from '../models/user.model';
import { Op } from 'sequelize';
import { managerIdWiseUsers } from './users.controller';

export const createCommunication = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Create the communication
        const newCommunication: any = await Communication.create(req.body);

        // If userIds are provided in the request body, associate the communication with users
        if (req.body.userIds && Array.isArray(req.body.userIds)) {
            // Fetch the users by their ids
            const users = await User.findAll({ where: { id: req.body.userIds } });

            // Associate the communication with the fetched users
            await newCommunication.setUsers(users);
        }

        // Fetch the communication again to include associated users
        const communicationWithUsers = await Communication.findByPk(newCommunication.id, {
            include: [{ model: User, as: 'users', attributes: ['id', 'name', 'email'] }]
        });

        return res.status(201).json({ message: 'Communication created successfully', communication: communicationWithUsers });
    } catch (error: any) {
        console.error('Error creating communication:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get all communications
export const getAllCommunications = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { userId } = req.query;
        const currentUser = req.uid;
        const currentRole = req.role;
        
        // Initialize filter object for users
        const userFilter: any = {};
        
        // If a specific userId is provided and it's not null, use it
        if (userId !== undefined && userId !== null && userId !== 'null') {
            userFilter.id = userId;
        } 
        // If user is a manager and no valid userId is provided, filter communications to only show their subordinates' communications
        else if (currentRole === "manager") {
            const usersList = await managerIdWiseUsers(currentUser);
            if (usersList && usersList.length > 0) {
                userFilter.id = { [Op.in]: usersList };
            } else {
                // If manager has no subordinates, return empty array
                return res.status(200).json({ communications: [] });
            }
        }
        // If user is a salesperson and no valid userId is provided, only show their own communications
        else if (currentRole === "salesperson") {
            userFilter.id = currentUser;
        }

        const communications = await Communication.findAll({
            include: [{
                model: User,
                as: 'users',
                where: userFilter, // Apply the user filter here
                attributes: ['id','empId', 'name', 'email'],
                through: { attributes: [] }
            }],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({ communications });
    } catch (error: any) {
        console.error('Error fetching communications:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get communication by ID
export const getCommunicationById = async (req: Request, res: Response): Promise<Response> => {
    const id = parseInt(req.params.id);
    try {
        const communication = await Communication.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'users',
                    attributes: ['id','empId', 'name', 'email'],
                    through: { attributes: [] }
                }
            ]
        });
        if (!communication) {
            return res.status(404).json({ message: 'Communication not found' });
        }
        return res.status(200).json({ communication });
    } catch (error: any) {
        console.error('Error fetching communication by ID:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get communications by user id
export const getCommunicationsByUserId = async (req: Request, res: Response): Promise<Response> => {
    const userId = parseInt(req.params.userId);
    try {
        const communications = await Communication.findAll({
            include: [
                {
                    model: User,
                    as: 'users',
                    where: { id: userId },
                    attributes: ['id', 'empId', 'name', 'email'],
                    through: { attributes: [] }
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({ communications });
    } catch (error: any) {
        console.error('Error fetching communications by dealer ID:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update a communication
export const updateCommunication = async (req: Request, res: Response): Promise<Response> => {
    const id = parseInt(req.params.id);

    try {
        const communication: any = await Communication.findByPk(id);
        if (!communication) {
            return res.status(404).json({ message: 'Communication not found' });
        }

        communication.set(req.body);

        // If userIds are provided in the request body, associate the communication with users
        if (req.body.userIds && Array.isArray(req.body.userIds)) {
            // Fetch the users by their ids
            const userIds = await CommunicationUser.findAll({ where: { id: req.body.userIds } });
            // Associate the lead with the fetched courses
            await communication.setUsers(userIds);
        }

        await communication.save();

        return res.status(200).json({ message: 'Communication updated successfully', communication });
    } catch (error: any) {
        console.error('Error updating communication:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete a communication
export const deleteCommunication = async (req: Request, res: Response): Promise<Response> => {
    const id = parseInt(req.params.id);

    try {
        const communication = await Communication.findByPk(id);
        if (!communication) {
            return res.status(404).json({ message: 'Communication not found' });
        }

        // Delete associated records from the join table
        await CommunicationUser.destroy({
            where: {
                communicationId: id
            }
        });

        // Now, delete the communication itself
        await communication.destroy();

        return res.status(200).json({ message: 'Communication deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting communication:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};