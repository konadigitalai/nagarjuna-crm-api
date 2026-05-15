import { Request, Response } from "express";
import FollowUp from "../models/followUp.model"; // Adjust the import based on your actual model
import Dealer from "../models/contact.model";
import User from "../models/user.model";
import { Op, OrderItem } from "sequelize";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { managerIdWiseUsers } from "./users.controller";

// Create a new FollowUp
const createFollowUp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { dealerId, userId, followUpDate, notes, status } = req.body;

    if (!dealerId || !userId || !followUpDate) {
      return res.status(400).json({
        message: "Follow Ups Date are required.",
      });
    }

    const followUp = await FollowUp.create({
      dealerId,
      userId,
      followUpDate,
      notes,
      status,
    });
    return res
      .status(201)
      .json({ message: "FollowUp created successfully", followUp });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating FollowUp." });
  }
};

// Update an existing FollowUp
const updateFollowUp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id, dealerId, userId, followUpDate, notes, status } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Id is required to update." });
    }

    const followUp = await FollowUp.findByPk(id);
    if (!followUp) {
      return res.status(404).json({ message: "FollowUp not found." });
    }

    await followUp.update({
      dealerId,
      userId,
      followUpDate,
      notes,
      status,
    });

    return res
      .status(200)
      .json({ message: "FollowUp updated successfully", followUp });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating FollowUp." });
  }
};

const getStartAndEnd = (period: any) => {
  const date = period?.split(",");
  let start, end;
  const currentDate = new Date(Date.now());
  const convertedDate = new Date(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate(),
    0, // hours
    0, // minutes
    0, // seconds
    currentDate.getUTCMilliseconds() // milliseconds
  );
  convertedDate.setDate(convertedDate.getDate() - 1);

  if (period === "week") {
    start = new Date(convertedDate);
    end = new Date(start);
    end.setDate(end.getDate() + 8);
  } else if (period === "month") {
    start = new Date(convertedDate);
    end = new Date(start);
    end.setDate(end.getDate() + 31);
  } else if (period === "premonth") {
    start = new Date(convertedDate);
    start.setDate(start.getDate() - 31);
    end = new Date(convertedDate);
    // start = new Date(convertedDate);
    // start.setMonth(start.getMonth() - 1);
    // end = new Date(start);
  } else if (period === "today") {
    start = new Date(convertedDate);
    end = new Date(convertedDate);
    end.setDate(end.getDate() + 1);
  } else {
    const snewDate = new Date(date?.[0]);
    const startDate = new Date(
      snewDate.getUTCFullYear(),
      snewDate.getUTCMonth(),
      snewDate.getUTCDate(),
      0, // hours
      0, // minutes
      0, // seconds
      snewDate.getUTCMilliseconds() // milliseconds
    );
    const enewDate = new Date(date?.[1]);
    const endDate = new Date(
      enewDate.getUTCFullYear(),
      enewDate.getUTCMonth(),
      enewDate.getUTCDate(),
      0, // hours
      0, // minutes
      0, // seconds
      enewDate.getUTCMilliseconds() // milliseconds
    );
    start = new Date(startDate);
    end = new Date(endDate);
  }
  return { start, end };
};

const getFollowUp = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, status, period, start, end } = req.query;
    const currentUser = req.uid;
    const currentRole = req.role;

    // Fetch follow-up data
    const followUpQuery: any = {
      where: {},
      order: [["followUpDate", "ASC"]] as OrderItem[],
    };

    // If a specific userId is provided and it's not null, use it
    if (userId) {
      followUpQuery.where.userId = userId;
    } 
    // If user is a manager and no valid userId is provided, filter follow-ups to only show their subordinates' follow-ups
    else if (currentRole === "manager") {
      const usersList = await managerIdWiseUsers(currentUser);
      if (usersList && usersList.length > 0) {
        followUpQuery.where.userId = { [Op.in]: usersList };
      } else {
        // If manager has no subordinates, return empty array
        return res.status(200).json([]);
      }
    }
    // If user is a salesperson and no valid userId is provided, only show their own follow-ups
    else if (currentRole === "salesperson") {
      followUpQuery.where.userId = currentUser;
    }

    // Modify status filter
    if (status && status !== "all" && status !== "") {
      followUpQuery.where.status = status; // Apply the status filter if it's not "all" or blank
    }

    // Add date range filter based on the period
    if (period) {
      const { start, end } = getStartAndEnd(period);
      followUpQuery.where.followUpDate = {
        [Op.between]: [start, end],
      };
    }
    if (start || end) {
      followUpQuery.where.createdAt = {
        [Op.between]: [start, end],
      };
    }

    const followUps = await FollowUp.findAll(followUpQuery);

    // If no follow-ups found, return an empty array
    if (!followUps || followUps.length === 0) {
      return res.status(200).json([]);
    }

    // Extract unique userIds and dealerIds from follow-ups
    const userIds = [
      ...new Set(followUps.map((followUp: any) => followUp.userId)),
    ];
    const dealerIds = [
      ...new Set(followUps.map((followUp: any) => followUp.dealerId)),
    ];

    // Fetch related data from User and Dealer models
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ["id", "username"], // Only fetch necessary fields
    });

    const dealers = await Dealer.findAll({
      where: { id: dealerIds },
      attributes: ["id", "personName"], // Only fetch necessary fields
    });

    // Create maps for quick lookup
    const userMap = Object.fromEntries(
      users.map((user: any) => [user.id, user.username])
    );
    const dealerMap = Object.fromEntries(
      dealers.map((dealer: any) => [dealer.id, dealer.personName])
    );

    // Enrich follow-up data with username and personName
    const enrichedFollowUps = followUps.map((followUp: any) => ({
      ...followUp.get(),
      userName: userMap[followUp.userId] || null,
      dealerName: dealerMap[followUp.dealerId] || null,
    }));

    return res.status(200).json(enrichedFollowUps);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching FollowUp." });
  }
};

const getFollowUpNotification = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId, status } = req.query;

    // Fetch follow-up data
    const followUpQuery: any = {
      where: {},
      order: [["followUpDate", "DESC"]] as OrderItem[],
    };
    if (userId) {
      followUpQuery.where.userId = userId;
    }

    // Modify status filter
    if (status && status !== "all" && status !== "") {
      followUpQuery.where.status = status; // Apply the status filter if it's not "all" or blank
    }

    // Add date range filter based on the period
    const currentDate = new Date();

    // Calculate the start of the current day (17th)
    const endDate = new Date(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      currentDate.getUTCDate(),
      23, // hours
      59, // minutes
      59, // seconds
      999 // milliseconds
    );

    // Calculate the start of a desired range (e.g., from the 14th)
    const daysBack = 60; // Number of days to go back
    const startDate = new Date(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      currentDate.getUTCDate() - daysBack,
      0, // hours
      0, // minutes
      0, // seconds
      0 // milliseconds
    );

    // Adjusting for Sequelize Query
    followUpQuery.where.followUpDate = {
      [Op.between]: [startDate, endDate],
    };
    // followUpQuery.where.delete = { [Op.ne]: null };
    followUpQuery.where.delete = { [Op.ne]: 1 };

    const followUps = await FollowUp.findAll(followUpQuery);

    // If no follow-ups found, return an empty array
    if (!followUps || followUps.length === 0) {
      return res.status(200).json([]);
    }

    // Extract unique userIds and dealerIds from follow-ups
    const userIds = [
      ...new Set(followUps.map((followUp: any) => followUp.userId)),
    ];
    const dealerIds = [
      ...new Set(followUps.map((followUp: any) => followUp.dealerId)),
    ];

    // Fetch related data from User and Dealer models
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ["id", "username"], // Only fetch necessary fields
    });

    const dealers = await Dealer.findAll({
      where: { id: dealerIds },
      attributes: ["id", "personName"], // Only fetch necessary fields
    });

    // Create maps for quick lookup
    // const userMap = Object.fromEntries(
    //   users.map((user: any) => [user.id, user.username])
    // );
    const dealerMap = Object.fromEntries(
      dealers.map((dealer: any) => [dealer.id, dealer.personName])
    );

    // Enrich follow-up data with username and personName
    const enrichedFollowUps = followUps.map((followUp: any) => ({
      ...followUp.get(),
      // userName: userMap[followUp.userId] || null,
      dealerName: dealerMap[followUp.dealerId] || null,
    }));

    return res.status(200).json(enrichedFollowUps);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching FollowUp." });
  }
};

// Delete a FollowUp
const deleteFollowUp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Id is required to delete." });
    }

    const followUp = await FollowUp.findByPk(id);
    if (!followUp) {
      return res.status(404).json({ message: "FollowUp not found." });
    }

    await followUp.destroy();
    return res.status(200).json({ message: "FollowUp deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting FollowUp." });
  }
};

const clearFollowUpNotification = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id, dealerId, userId, followUpDate, notes, status } = req.body;
    const followUpQuery: any = {
      where: {},
      order: [["followUpDate", "DESC"]] as OrderItem[],
    };
    if (userId) {
      followUpQuery.where.userId = userId;
    }

    // Modify status filter
    if (status && status !== "all" && status !== "") {
      followUpQuery.where.status = status; // Apply the status filter if it's not "all" or blank
    }

    // Add date range filter based on the period
    const currentDate = new Date();

    // Calculate the start of the current day (17th)
    const endDate = new Date(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      currentDate.getUTCDate(),
      23, // hours
      59, // minutes
      59, // seconds
      999 // milliseconds
    );

    // Calculate the start of a desired range (e.g., from the 14th)
    const daysBack = 60; // Number of days to go back
    const startDate = new Date(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      currentDate.getUTCDate() - daysBack,
      0, // hours
      0, // minutes
      0, // seconds
      0 // milliseconds
    );

    // Adjusting for Sequelize Query
    followUpQuery.where.followUpDate = {
      [Op.between]: [startDate, endDate],
    };
    // followUpQuery.where.delete = { [Op.ne]: null };

    const followUps = await FollowUp.findAll(followUpQuery);

    for (const followUp of followUps) {
      await followUp.update({
        delete: 1,
      });
    }
    // await followUp.update({
    //   dealerId,
    //   userId,
    //   followUpDate,
    //   notes,
    //   status,
    // });

    return res
      .status(200)
      .json({ message: "FollowUp delet successfully", followUps });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating FollowUp." });
  }
};

export {
  createFollowUp,
  updateFollowUp,
  getFollowUp,
  deleteFollowUp,
  getFollowUpNotification,
  clearFollowUpNotification,
};