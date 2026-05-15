import { Request, Response } from "express";
import { Op } from "sequelize";
import { OrderItem } from "sequelize/types";
import Joi from "joi";
import xlsx from "xlsx";
import { getDistance } from "geolib";

import { sequelize } from "../database";

import TrackingInfo from "../models/tracking.model";
import TrackingNote from "../models/tracking-note.model";
import TrackingImage from "../models/tracking-image.model";
import User from "../models/user.model";
import Dealer from "../models/contact.model";
import axios from "axios";
import { managerIdWiseUsers } from "./users.controller";

const calculateDistance = (
  prevLat: number,
  prevLon: number,
  currLat: number,
  currLon: number
): number => {
  const distanceInMeters = getDistance(
    { latitude: prevLat, longitude: prevLon },
    { latitude: currLat, longitude: currLon }
  );
  return distanceInMeters / 1000; // Convert to kilometers
};

const getDrivingDistance = async (
  prevLon: number,
  prevLat: number,
  currLon: number,
  currLat: number
) => {
  const accessToken = process.env.MAPBOX_API_KEY!;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${prevLon},${prevLat};${currLon},${currLat}?alternatives=true&geometries=geojson&access_token=${accessToken}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.routes && data.routes.length > 0) {
      const shortestRoute = data.routes.reduce((minRoute: any, route: any) =>
        route.distance < minRoute.distance ? route : minRoute
      );

      const distanceKm = (shortestRoute.distance / 1000).toFixed(2);
      // console.log(`Shortest Driving Distance: ${distanceKm} km`);
      return parseFloat(distanceKm);
    } else {
      console.log("No route found.");
      return null;
    }
  } catch (error: any) {
    console.error("Error fetching route:", error.message);
    return null;
  }
};

export const cleanupTrackingInfo = async () => {
  try {
    // Get all records with trackingType = 'auto', ordered by userId and createdAt
    const records = await TrackingInfo.findAll({
      attributes: ["id", "userId", "createdAt"],
      where: {
        trackingType: "auto",
      },
      order: [
        ["userId", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    const deleteIds = new Set();
    const lastRecordTime = new Map();

    for (const { id, userId, createdAt } of records) {
      const createdTime: any = new Date(createdAt);

      if (lastRecordTime.has(userId)) {
        const lastTime = lastRecordTime.get(userId);

        // Check if the difference is less than 5 minutes
        if (createdTime - lastTime < 5 * 60 * 1000) {
          deleteIds.add(id);
          continue;
        }
      }

      lastRecordTime.set(userId, createdTime);
    }

    // Delete duplicate entries
    if (deleteIds.size > 0) {
      console.log(
        "🚀 ~ cleanupTrackingInfo ~ Array.from(deleteIds):",
        Array.from(deleteIds)
      );
      const deletRecords = await TrackingInfo.destroy({
        where: { id: Array.from(deleteIds) },
      });
      console.log(`Deleted ${deleteIds.size} duplicate records.`);
      console.log("🚀 ~ cleanupTrackingInfo ~ deletRecords:", deletRecords);
      return { size: deleteIds.size };
    } else {
      console.log("No duplicate records found.");
      return { message: "No duplicate records found." };
    }
  } catch (error: any) {
    console.error("Error cleaning up tracking info:", error);
    return { message: "Internal server error", error: error.message };
  }
};

export const createTrackingInfo = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { latitude, longitude, address, trackingType, userId, dealerId, time } =
    req.body;
  try {
    const currentTime = new Date(time);
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    // Check if the current time is outside the allowed range (8 AM to 8 PM)
    if (
      currentHour < 8 ||
      (currentHour === 20 && currentMinutes > 0) ||
      currentHour > 20
    ) {
      return res.status(403).json({
        message: "Tracking is allowed only between 8 AM and 8 PM",
      });
    }

    if (!latitude && !longitude) {
      return res.status(400).json({
        message: "latitude and longitude is not null allowed",
      });
    }

    // ✅ IF type is 'captured'
    if (trackingType === "captured") {
      let startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      let endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      // Check if this is the FIRST captured location of today
      const capturedToday = await TrackingInfo.findAll({
        where: {
          userId,
          trackingType: "captured",
          createdAt: {
            [Op.between]: [startOfToday, endOfToday],
          },
        },
        order: [["createdAt", "DESC"]],
      });

      if (capturedToday.length > 0) {
        // ✅ It's the first captured of the day

        // Find the FIRST AUTO location of the day
        const firstAutoToday = await TrackingInfo.findOne({
          where: {
            userId,
            trackingType: "auto",
            createdAt: {
              [Op.between]: [startOfToday, endOfToday],
            },
          },
          order: [["createdAt", "DESC"]],// Changed DESC → ASC
        });
        const todayLastCaptured = await TrackingInfo.findOne({
          where: {
            userId,
            trackingType: "captured",
            createdAt: {
              [Op.between]: [startOfToday, endOfToday],
            },
          },
          order: [["createdAt", "DESC"]],// Changed DESC → ASC
        });

        if (todayLastCaptured) {
          // ✅ Compare distance between first auto and current captured
          const distance = calculateDistance(
            todayLastCaptured.latitude,
            todayLastCaptured.longitude,
            latitude,
            longitude
          );

          const currentTime1 = new Date();
          // ✅ Calculate time gap in minutes
          const timeGapMs =
            currentTime1.getTime() -
            new Date(todayLastCaptured.createdAt).getTime();
          const timeGapMinutes = timeGapMs / (1000 * 60);

          if (timeGapMinutes <= 1) {
            return res.status(200).json({
              message: "Recapture not allowed within 1 minute.",
              reason: "Please wait at least 1 minute before capturing the location again.",
            });
          }
          if (distance <= 0.025) {
            return res.status(200).json({
              message: "Please move at least 25 meters before capturing the location again.",
              reason: "Please move at least 25 meters before capturing the location again.",
            });
          }
        }
        // if (firstAutoToday) {
        //   // ✅ Compare distance between first auto and current captured
        //   const distance = calculateDistance(
        //     firstAutoToday.latitude,
        //     firstAutoToday.longitude,
        //     latitude,
        //     longitude
        //   );

        //   const currentTime1 = new Date();
        //   // ✅ Calculate time gap in minutes
        //   const timeGapMs =
        //     currentTime1.getTime() -
        //     new Date(firstAutoToday.createdAt).getTime();
        //   const timeGapMinutes = timeGapMs / (1000 * 60);
        //   console.log("🚀 ~ createTrackingInfo ~ timeGapMinutes:", timeGapMinutes)
        //   console.log("🚀 ~ createTrackingInfo ~ distance:", distance)

        //   //If the same location is visited within 15 minutes, it should be captured after 15 minutes.
        //   if (timeGapMinutes > 15) {
        //     // ❌ Don't save — return warning
        //     if (distance <= 0.05) {
        //       return res.status(200).json({
        //         message: "Please recapture",
        //         reason:
        //           "Location is same as first auto and time gap > 15 minutes",
        //       });
        //     }
        //   }
        // }
      }
    }

    // If trackingType is 'auto', check if a recent activity exists
    if (trackingType === "auto") {
      // Define a time threshold (2 hours in milliseconds)
      // const tenMinutesAgo = new Date(Date.now() - 1 * 60 * 15 * 1000); //15 min
      const tenMinutesAgo = new Date(Date.now() - 1 * 60 * 5 * 1000); //5 min

      // Check if a recent activity exists for the specified dealerId and userId within the last 2 hours
      const existingActivity = await TrackingInfo.findOne({
        where: {
          trackingType: "auto",
          userId,
          createdAt: { [Op.gte]: tenMinutesAgo },
        },
      });

      if (existingActivity) {
        // If a recent activity exists, return it
        return res.status(200).json({ message: "Recent activity found" });
      }
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch today's entries, excluding the first one
    const trackingInfos = await TrackingInfo.findAll({
      where: {
        userId,
        createdAt: {
          [Op.between]: [startOfToday, endOfToday], // Include only today's entries
        },
      },
      order: [["createdAt", "ASC"]], // Order by createdAt in ascending order
      attributes: ["latitude", "longitude", "createdAt"],
    });

    let distance: number = 0;

    if (trackingInfos?.[trackingInfos?.length - 1]) {
      distance = calculateDistance(
        trackingInfos?.[trackingInfos?.length - 1]?.dataValues?.latitude,
        trackingInfos?.[trackingInfos?.length - 1]?.dataValues?.longitude,
        latitude,
        longitude
      );
      if (!distance) {
        await getDrivingDistance(
          trackingInfos?.[trackingInfos?.length - 1]?.dataValues?.longitude,
          trackingInfos?.[trackingInfos?.length - 1]?.dataValues?.latitude,
          longitude,
          latitude
        )
          .then((dis: any) => {
            // console.log("Final Distance:", dis);
            if (typeof dis == "number") {
              distance = dis;
            } else {
              distance = calculateDistance(
                trackingInfos?.[trackingInfos?.length - 1]?.dataValues?.latitude,
                trackingInfos?.[trackingInfos?.length - 1]?.dataValues?.longitude,
                latitude,
                longitude
              );
            }
          })
          .catch((error: any) => {
            console.error("Error:", error);
            distance = calculateDistance(
              trackingInfos?.[trackingInfos?.length - 1]?.dataValues?.latitude,
              trackingInfos?.[trackingInfos?.length - 1]?.dataValues?.longitude,
              latitude,
              longitude
            );
          });
      }
    }
    // console.log("🚀 ~ distance:", distance);
    // Create a new activity
    const newTrackingInfo = await TrackingInfo.create({
      latitude,
      longitude,
      address,
      trackingType,
      distance: distance.toFixed(4),
      userId,
      dealerId,
    });

    //dublicatevalue remover
    cleanupTrackingInfo();
    return res.status(201).json({
      message: "Activity created successfully",
      activity: newTrackingInfo,
    });
  } catch (error: any) {
    console.error("Error creating or fetching activity:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get all activity
export const getAllTrackingInfo = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const currentUser = req.uid;
    const currentRole = req.role;


    // Extract and parse query parameters
    const { dealerId, userId, trackingType, startTime, endTime } = req.query;
    const parsedDealerId = dealerId
      ? parseInt(dealerId as string, 10)
      : undefined;
    const parsedUserId = userId ? parseInt(userId as string, 10) : undefined;

    // Prepare filter object based on provided query parameters
    const filter: any = { distance: { [Op.ne]: null } };
    if (parsedDealerId) {
      filter.dealerId = parsedDealerId;
    }
    if (!dealerId) {
      if (currentRole === "manager") {
        const usersList = await managerIdWiseUsers(currentUser)
        filter.userId = { [Op.in]: usersList };
      }
    }
    if (parsedUserId) {
      filter.userId = parsedUserId;
    }
    if (trackingType) {
      filter.trackingType = trackingType;
    }
    // Add updatedAt range conditions
    if (startTime && endTime) {
      filter.updatedAt = {
        [Op.between]: [startTime, endTime],
      };
    } else if (startTime) {
      filter.updatedAt = {
        [Op.gte]: startTime,
      };
    } else if (endTime) {
      filter.updatedAt = {
        [Op.lte]: endTime,
      };
    }

    // Define options for sorting
    let options: any = {
      where: filter,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
        {
          model: Dealer,
          as: "dealer",
          attributes: ["personName", "companyName", "contactType", "address"],
        },
        { model: TrackingNote, as: "trackingNotes" },
        { model: TrackingImage, as: "trackingImages" },
      ],
      order: [["updatedAt", "DESC"]] as OrderItem[],
    };

    const activity = await TrackingInfo.findAll(options);
    //Filters the duplicate records that are created due to multiple parrallel pings from the mobile app.
    const filteredActivity = activity;
    // const filteredActivity = activity.filter(
    //   (item: any, index: number, self: any[]) => {
    //     if (item.trackingType === "auto") {
    //       const userId = item.userId;
    //       const createdAt = new Date(item.createdAt);
    //       // Check if there's another record for the same user within 2 hours
    //       const previousRecord = self.slice(0, index).find((prevItem: any) => {
    //         return (
    //           prevItem.userId === userId &&
    //           Math.abs(
    //             createdAt.getTime() - new Date(prevItem.createdAt).getTime()
    //           ) <=
    //             1 * 60 * 30 * 1000 &&
    //           prevItem.trackingType === "auto"
    //         );
    //       });
    //       // Return true if it's the first record for this user within 2 hours, otherwise false
    //       return !previousRecord;
    //     } else {
    //       return true; // Include records with trackingType other than 'auto'
    //     }
    //   }
    // );
    return res.status(200).json({ activity: filteredActivity });

    // return res.status(200).json({ activity }); // Wrap activity in an object for consistency
  } catch (error: any) {
    console.error("Error fetching activity:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get activity by ID along with associated tracking notes and tracking images
export const getTrackingInfoById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const id = parseInt(req.params.id);

  try {
    // Find the activity by ID
    const activity = await TrackingInfo.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
        {
          model: Dealer,
          as: "dealer",
          attributes: ["personName", "companyName", "contactType", "address"],
        },
        { model: TrackingNote, as: "trackingNotes" },
        { model: TrackingImage, as: "trackingImages" },
      ],
    });

    // If activity is not found, return 404 Not Found
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    // Return the activity along with associated tracking notes and images
    return res.status(200).json({ activity });
  } catch (error: any) {
    console.error("Error fetching activity by ID:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update a activity
export const updateTrackingInfo = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const id = parseInt(req.params.id);
  const { latitude, longitude, address, trackingType, userId, dealerId } =
    req.body;

  try {
    const activity = await TrackingInfo.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    activity.latitude = latitude;
    activity.longitude = longitude;
    activity.address = address;
    activity.trackingType = trackingType;
    activity.userId = userId;
    activity.dealerId = dealerId;
    await activity.save();

    return res
      .status(200)
      .json({ message: "Activity updated successfully", activity });
  } catch (error: any) {
    console.error("Error updating activity:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete a activity
export const deleteTrackingInfo = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const id = parseInt(req.params.id);

  try {
    const activity = await TrackingInfo.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    await activity.destroy();

    return res.status(200).json({ message: "Activity deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting activity:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const deleteTrackingInfos = async (req: Request, res: Response) => {
  const idsString = req.query.ids as string;
  const ids = idsString.split(",").map((id) => parseInt(id, 10));
  try {
    // Delete notes based on trackingInfoIds
    await Promise.all(
      ids.map(async (id) => {
        await TrackingNote.destroy({ where: { trackingInfoId: id } });
      })
    );

    // Delete images based on trackingInfoIds
    await Promise.all(
      ids.map(async (id) => {
        await TrackingImage.destroy({ where: { trackingInfoId: id } });
      })
    );

    const deletedRowCount = await TrackingInfo.destroy({
      where: { id: { [Op.in]: ids } },
    });
    if (deletedRowCount === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.status(200).json({ message: "Activity deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting activity:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const processExcelData = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Extract the uploaded Excel file from the request
    const excelFile = req.file;
    if (!excelFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Load the Excel workbook
    const workbook = xlsx.readFile(excelFile.path);

    // Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Extract data from the worksheet
    const trackingInfoData: any[] = xlsx.utils.sheet_to_json(worksheet);

    // Validate and process each row of data
    for (let i = 0; i < trackingInfoData.length; i++) {
      const trackingInfo = trackingInfoData[i];

      // Convert notes string to object and add description under 'notes' property
      if (typeof trackingInfo.notes === "string") {
        trackingInfo.notes = { description: trackingInfo.notes };
      }

      // Validate the trackingInfo data
      const validationResult = validateTrackingInfoData(trackingInfo);
      if (validationResult.error) {
        return res.status(400).json({
          error: `Validation error in row ${i + 1
            }: ${validationResult.error.details
              .map((detail) => detail.message)
              .join("; ")}`,
        });
      }

      // Create tracking info record
      const createdTrackingInfo = await TrackingInfo.create(trackingInfo);

      // Check if there are notes associated with this tracking info
      if (
        trackingInfo.notes &&
        typeof trackingInfo.notes === "object" &&
        trackingInfo.notes.description
      ) {
        const { description } = trackingInfo.notes;

        // Validate and process the note
        const noteValidationResult = validateTrackingNoteData({ description });
        if (noteValidationResult.error) {
          return res.status(400).json({
            error: `Validation error in notes for row ${i + 1
              }: ${noteValidationResult.error.details
                .map((detail) => detail.message)
                .join("; ")}`,
          });
        }

        // Create tracking note record
        await TrackingNote.create({
          description,
          trackingInfoId: createdTrackingInfo.id,
        });
      }
    }

    // Return success response
    return res.status(200).json({ message: "Data inserted successfully" });
  } catch (error: any) {
    console.error("Error processing Excel data:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getCapturedTrackings = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { fromDate, toDate, userId } = req.query;

    const parsedFromDate = fromDate
      ? new Date(fromDate.toString())
      : new Date(0);
    const parsedToDate = toDate ? new Date(toDate.toString()) : new Date();

    // Adjust the parsed dates to start and end of the day
    parsedFromDate.setUTCHours(0, 0, 0, 0);
    parsedToDate.setUTCHours(23, 59, 59, 999);

    const whereClause: any = {
      trackingType: "captured",
      createdAt: {
        [Op.between]: [parsedFromDate, parsedToDate],
      },
    };

    // Execute two separate queries: one for total count and one for count by userId
    const [totalCount, countByUserId] = await Promise.all([
      TrackingInfo.count({ where: whereClause }),
      userId ? TrackingInfo.count({ where: { ...whereClause, userId } }) : null,
    ]);

    return res.status(200).json({ totalCount, countByUserId });
  } catch (error: any) {
    console.error("Error fetching captured trackings:", error);
    return res
      .status(500)
      .json({ error: "Internal Server error", message: error.message });
  }
};

// Function to validate trackingInfo data using Joi schema
const validateTrackingInfoData = (trackingInfo: any) => {
  const trackingInfoSchema = Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    address: Joi.string().required(),
    trackingType: Joi.string().valid("auto", "captured").required(),
    userId: Joi.number().required(),
    dealerId: Joi.number().allow(null),
    notes: Joi.object()
      .keys({
        description: Joi.string().allow("").optional(),
      })
      .optional(),
    createdAt: Joi.date().optional(),
    updatedAt: Joi.date().optional(),
  });

  return trackingInfoSchema.validate(trackingInfo, { abortEarly: false });
};

// Function to validate trackingNote data using Joi schema
const validateTrackingNoteData = (note: any) => {
  const noteSchema = Joi.object({
    description: Joi.string().required(),
  });

  return noteSchema.validate(note, { abortEarly: false });
};
