import { Request, Response } from "express";
import Activite from "../models/activite.model";
import User from "../models/user.model";

export const createContactActivite = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId, subject, priority, dueDate, dealerId } = req.body;

  try {
    // Insert contact into the database
    const newDealer = await Activite.create({
      userId,
      subject,
      priority,
      dueDate,
      dealerId
    });

    // Return success response
    return res.status(201).json({
      message: "Contact activite created successfully",
      data: newDealer,
    });
  } catch (error: any) {
    // console.error("Error creating contact:", error);
    // Return error response
    return res
      .status(500)
      .json({
        message: error?.errors?.[0]?.message
          ? error?.errors?.[0]?.message
          : "Internal server error"
      });
  }
};

// GET API
export const getContactActivite = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const userId = req.query.userId as string; // Explicitly cast `userId` to a string

  try {
    let activities;

    if (userId) {
      // Fetch activities for a specific user
      activities = await Activite.findAll({
        where: { userId: parseInt(userId) }, // Ensure `userId` is a number if required by schema
        include: [
          {
            model: User,
            as: "user", // Ensure this matches your Sequelize association alias
            attributes: ["username"], // Only include the username field
          },
        ],
      });
    } else {
      // Fetch all activities
      activities = await Activite.findAll({
        include: [
          {
            model: User,
            as: "user", // Ensure this matches your Sequelize association alias
            attributes: ["username"], // Only include the username field
          },
        ],
      });
    }

    // Modify activities to include username in the response
    const modifiedActivities = activities.map((activity) => ({
      ...activity.toJSON(), // Convert the Sequelize instance to JSON
    }));

    // Return success response
    return res.status(200).json({
      message: "Contact activities fetched successfully",
      data: modifiedActivities,
    });
  } catch (error: any) {
    // console.error("Error fetching contact activities:", error);
    // Return error response
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
// DELETE API
export const deleteContactActivite = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({
        message: "Id is required to delete contact activities",
      });
    }

    // Delete activities for the specified user
    const deletedCount = await Activite.destroy({
      where: { id },
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        message: "No activities found for the specified userId",
      });
    }

    // Return success response
    return res.status(200).json({
      message: `Successfully deleted ${deletedCount} contact activities`,
    });
  } catch (error: any) {
    // console.error("Error deleting contact activities:", error);
    // Return error response
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
