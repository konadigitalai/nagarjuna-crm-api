import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import { QueryTypes } from "sequelize";
import {
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  format,
} from "date-fns";

import { sequelize } from "../database";

import User from "../models/user.model";
import Attendance from "../models/attendance.model";
import Contact from "../models/contact.model";
import TrackingInfo from "../models/tracking.model";
import Communication from "../models/communication.model";
import Dealer from "../models/contact.model";
import Task from "../models/task.model";
import { managerIdWiseUsers } from "./users.controller";

const getStartAndEnd = (period: any) => {
  const date = period?.split(",");
  let start, end;
  const currentDate = new Date(Date.now());
  // Utility functions to get start and end of the day
  const startOfDay = (date: Date) => {
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0
    );
  };

  const endOfDay = (date: Date) => {
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    );
  };

  if (period === "week") {
    start = new Date(currentDate); // Start is today
    start.setUTCDate(start.getUTCDate() - 7); // Set start to 7 days back
    end = endOfDay(currentDate); // End is today at the end of the day
  } else if (period === "month") {
    start = new Date(currentDate); // Start is today
    start.setUTCMonth(start.getUTCMonth() - 1); // Set start to one month back
    end = endOfDay(currentDate); // End is today at the end of the day
  } else if (period === "today") {
    start = startOfDay(currentDate);
    end = endOfDay(currentDate);
  } else if (period === "year") {
    start = new Date(currentDate); // Start is today
    start.setUTCFullYear(start.getUTCFullYear() - 1); // Set start to one year back
    end = endOfDay(currentDate); // End is today at the end of the day
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
    end.setDate(end.getDate() + 1);
  }
  return { start, end };
};

const parseToDate = (value: any, endOfDay = false): Date | undefined => {
  if (!value) return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined;
  if (endOfDay) d.setUTCHours(23, 59, 59, 999);
  else d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const webStatistics = async (req: Request, res: Response) => {
  try {
    const currentUser = req.uid;
    const currentRole = req.role;

    // Extract query parameters
    const { fromDate, toDate, period } = req.query;
    const { start, end } = getStartAndEnd(period);

    // const parsedFromDate = new Date(fromDate as string);
    // const parsedToDate = new Date(toDate as string);
    const parsedFromDate = period === "date" ? parseToDate(fromDate) : start;
    const parsedToDate = period === "date" ? parseToDate(toDate, true) : end;

    // Ensure the dates are in UTC
    // parsedFromDate.setUTCHours(0, 0, 0, 0);
    // parsedToDate.setUTCHours(23, 59, 59, 999);

    // Create date range clause if both dates are provided
    const dateRangeClause =
      parsedFromDate && parsedToDate
        ? {
          createdAt: {
            [Op.between]: [parsedFromDate, parsedToDate],
          },
        }
        : {};

    // Add user filter based on role
    let userFilter = {};
    let userIds = null;
    if (currentRole === "manager") {
      const usersList = await managerIdWiseUsers(currentUser);
      if (usersList && usersList.length > 0) {
        userIds = usersList;
        userFilter = { userId: { [Op.in]: usersList } };
      } else {
        // If manager has no subordinates, return zeros
        return res.status(200).json({
          tasksCount: 0,
          visitsCount: 0,
          newEnrollments: 0,
          totalEnrollments: 0,
          presentCount: 0,
          salesPersonCount: 0,
          totalDistance: 0,
        });
      }
    } else if (currentRole === "salesperson") {
      userIds = [currentUser];
      userFilter = { userId: currentUser };
    }

    // Fetch communications count with titleType = 'task' and within the specified date range
    let tasksCount = 0;
    if (userIds) {
      // For managers and salespersons, we need to query through the junction table
      const communicationUsers: any = await sequelize.query(
        `SELECT COUNT(DISTINCT c.id) as count
         FROM communications c
         INNER JOIN "communicationUsers" cu ON c.id = cu."communicationId"
         WHERE c."titleType" = 'task'
         AND c."createdAt" BETWEEN :startDate AND :endDate
         AND cu."userId" IN (:userIds)`,
        {
          replacements: {
            startDate: parsedFromDate,
            endDate: parsedToDate,
            userIds: userIds
          },
          type: QueryTypes.SELECT
        }
      );
      tasksCount = communicationUsers[0].count;
    } else {
      // For admin, simple count
      tasksCount = await Communication.count({
        where: {
          titleType: "task",
          ...dateRangeClause
        },
      });
    }

    const trackingFilter = {
      trackingType: "captured",
      ...dateRangeClause,
      ...userFilter
    };

    // Count the number of tracking entries matching the filters
    const visitsCount = await TrackingInfo.count({
      where: trackingFilter,
    });

    const trackingDistance = {
      ...dateRangeClause,
      ...userFilter
    };

    const totalDistance = await TrackingInfo.sum("distance", {
      where: trackingDistance,
    });

    const newEnrollments = await Contact.count({
      where: {
        ...dateRangeClause,
        ...userFilter
      },
    });

    // For total enrollments, we might want to show all or just for the user/their team
    let totalEnrollments = 0;
    if (!userIds) {
      // Admin sees all
      totalEnrollments = await Contact.count();
    } else {
      // Manager and salesperson see their data only
      totalEnrollments = await Contact.count({
        where: userFilter
      });
    }

    // Find unique users who have clocked in within the date range
    const presentUsers = await Attendance.findAll({
      where: {
        clockIn: {
          [Op.between]: [parsedFromDate!, parsedToDate!],
        },
        ...userFilter
      },
      attributes: ["userId"],
      group: ["userId"],
    });

    const presentCount = presentUsers.length;

    // Get total number of users based on role
    let salesPersonCount = 0;
    if (!userIds) {
      // Admin sees all salespersons
      salesPersonCount = await User.count({
        where: {
          role: "salesperson",
        },
      });
    } else if (currentRole === "manager") {
      // Manager sees their subordinates count
      salesPersonCount = userIds ? userIds.length : 0;
    } else {
      // Salesperson sees just themselves
      salesPersonCount = 1;
    }

    return res.status(200).json({
      tasksCount,
      visitsCount,
      newEnrollments,
      totalEnrollments,
      presentCount,
      salesPersonCount,
      totalDistance: totalDistance,
    });
  } catch (error) {
    console.error("Error fetching web statistics:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch web statistics",
    });
  }
};

export const getContactsCountByTypeAndDate = async (
  req: Request,
  res: Response
) => {
  try {
    const currentUser = req.uid;
    const currentRole = req.role;
    const { filter, userId } = req.query; // Expecting 'week', 'month', or 'year' as filter

    let datePart: string;
    let dateCondition: string;

    const currentUTCDate = new Date().toISOString(); // Current UTC date
    switch (filter) {
      case "week":
        datePart = 'DATE("createdAt")';
        dateCondition = `AND DATE_TRUNC('week', "createdAt"::TIMESTAMP) = DATE_TRUNC('week', '${currentUTCDate}'::TIMESTAMP)`;
        break;
      case "month":
        datePart = 'DATE("createdAt")';
        dateCondition = `AND DATE_TRUNC('month', "createdAt"::TIMESTAMP) = DATE_TRUNC('month', '${currentUTCDate}'::TIMESTAMP)`;
        break;
      case "year":
        datePart = "TO_CHAR(\"createdAt\"::TIMESTAMP, 'YYYY-MM')";
        dateCondition = `AND DATE_TRUNC('year', "createdAt"::TIMESTAMP) = DATE_TRUNC('year', '${currentUTCDate}'::TIMESTAMP)`;
        break;
      default:
        return res.status(400).json({ error: "Invalid filter type" });
    }

    // Initialize userCondition as empty string
    let userCondition = "";

    // If user is a manager, get all users under this manager
    if (currentRole === "manager") {
      const usersList = await managerIdWiseUsers(currentUser);
      if (usersList && usersList.length > 0) {
        userCondition = `AND "userId" IN (${usersList.map(id => `'${id}'`).join(",")})`;
      } else {
        // If manager has no subordinates, return empty result
        return res.json([]);
      }
    }
    // If a specific userId is provided and user is not a manager, use that userId
    else if (userId) {
      userCondition = `AND "userId" = '${userId}'`;
    }
    // If user is salesperson and no userId is provided, show only their own data
    else if (currentRole === "salesperson") {
      userCondition = `AND "userId" = '${currentUser}'`;
    }

    const query = `
          SELECT ${datePart} AS type,
            SUM(CASE WHEN "contactType" = 'fabricator' THEN 1 ELSE 0 END) AS "fabricatorsCount",
            SUM(CASE WHEN "contactType" = 'customer' THEN 1 ELSE 0 END) AS "customersCount",
            SUM(CASE WHEN "contactType" = 'dealer' THEN 1 ELSE 0 END) AS "dealersCount",
            SUM(CASE WHEN "contactType" = 'engineers' THEN 1 ELSE 0 END) AS "engineersCount",
            SUM(CASE WHEN "contactType" = 'masons' THEN 1 ELSE 0 END) AS "masonsCount"
          FROM "dealers"
          WHERE 1=1 ${dateCondition} ${userCondition}
          GROUP BY ${datePart}
          ORDER BY ${datePart};
        `;

    const result: any = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    // Define a function to check if a date exists in the result set
    const dateExists = (date: string) => {
      return result.some((row: any) => row.type === date);
    };

    // Generate a range of dates based on the filter
    let formattedResult = [];
    switch (filter) {
      case "week":
        const startDate = new Date(currentUTCDate);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of the week
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6); // End of the week
        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setDate(d.getDate() + 1)
        ) {
          const dayName = format(d, "EEE"); // Get day name (Mon, Tue, Wed, etc.)
          const date = d.toISOString().slice(0, 10); // Get date
          const dayResult: any = result.find((row: any) => row.type === date);
          formattedResult.push({
            type: date,
            dayName,
            fabricatorsCount: dayResult ? dayResult.fabricatorsCount : 0,
            customersCount: dayResult ? dayResult.customersCount : 0,
            dealersCount: dayResult ? dayResult.dealersCount : 0,
            engineersCount: dayResult ? dayResult.engineersCount : 0,
            masonsCount: dayResult ? dayResult.masonsCount : 0,
          });
        }
        break;
      case "month":
        const firstDayOfMonth = new Date(
          Date.UTC(
            new Date(currentUTCDate).getFullYear(),
            new Date(currentUTCDate).getMonth(),
            1
          )
        );
        const lastDayOfMonth = new Date(
          Date.UTC(
            new Date(currentUTCDate).getFullYear(),
            new Date(currentUTCDate).getMonth() + 1,
            0
          )
        );

        // Initialize currentDate to the first day of the month
        let currentDate = new Date(firstDayOfMonth);

        // Loop until currentDate reaches the last day of the month
        while (currentDate <= lastDayOfMonth) {
          // Get date in YYYY-MM-DD format
          const date = currentDate.toISOString().split("T")[0];

          // Find result for the current date
          const monthResult = result.find((row: any) => row.type === date);

          // Push result into formattedResult array
          formattedResult.push({
            type: date,
            fabricatorsCount: monthResult ? monthResult.fabricatorsCount : 0,
            customersCount: monthResult ? monthResult.customersCount : 0,
            dealersCount: monthResult ? monthResult.dealersCount : 0,
            engineersCount: monthResult ? monthResult.engineersCount : 0,
            masonsCount: monthResult ? monthResult.masonsCount : 0,
          });

          // Move to the next day
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        break;
      case "year":
        const year = new Date(currentUTCDate).getFullYear();

        // Loop over all months of the year (from January to December)
        for (let month = 0; month < 12; month++) {
          const monthDate = new Date(Date.UTC(year, month, 1));
          const monthType = monthDate.toISOString().slice(0, 7); // Get month in YYYY-MM format

          // Find if the month exists in the result array
          const monthResult = result.find((row: any) => row.type === monthType);

          // If the month doesn't exist in the result array, add it with zeros
          if (!monthResult) {
            formattedResult.push({
              type: monthType,
              monthName: format(monthDate, "MMMM"),
              fabricatorsCount: 0,
              customersCount: 0,
              dealersCount: 0,
              engineersCount: 0,
              masonsCount: 0,
            });
          }
        }

        // Add the existing result data
        formattedResult = formattedResult.concat(result);

        // Sort the formatted result by type (month) in ascending order
        formattedResult.sort((a, b) => {
          // Extract year and month from the type (YYYY-MM) and convert to numbers
          const [aYear, aMonth] = a.type.split("-").map(Number);
          const [bYear, bMonth] = b.type.split("-").map(Number);

          // Compare years
          if (aYear !== bYear) {
            return aYear - bYear;
          }

          // If years are equal, compare months
          return aMonth - bMonth;
        });
        break;
    }

    res.json(formattedResult);
  } catch (error) {
    console.error("Error fetching dealer counts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const getOverallEnrolment = async (req: Request, res: Response) => {
//   const { period, userId, managerId, teamName } = req.query;
//   const { start, end } = getStartAndEnd(period);

//   try {
//     const whereClause: any = {
//       createdAt: {
//         [Op.between]: [start, end],
//       },
//     };

//     if (userId) {
//       whereClause.userId = userId;
//     }

//     const includeClause: any[] = [
//       {
//         model: User,
//         as: 'user',
//         attributes: ['username', 'empId'], // Include empId attribute
//         where: {}, // Placeholder for conditions on the user model
//       },
//     ];

//     // Add condition for teamName based on empId in the user model
//     if (teamName && typeof teamName === 'string') {
//       const teamNames = teamName.split(',').map((name: string) => name.trim());
//       includeClause[0].where = {
//         empId: {
//           [Op.or]: teamNames.map((name: string) => ({
//             [Op.like]: `${name}%`,
//           })),
//         },
//       };
//     }

//     // Add a nested include for filtering by managerId
//     if (managerId) {
//       whereClause['$user.managerId$'] = managerId;
//       includeClause.push({
//         model: User,
//         as: 'user',
//         attributes: [],
//         include: [
//           {
//             model: User,
//             as: 'manager',
//             attributes: [],
//           },
//         ],
//       });
//     }

//     const results = await Dealer.findAll({
//       attributes: [
//         'userId',
//         'contactType',
//         [fn('COUNT', col('Dealer.id')), 'count'],
//       ],
//       where: whereClause,
//       group: ['userId', 'contactType', 'user.id'],
//       include: includeClause,
//     });

//     const counts: { [key: number]: { userId: number, username: string, fabricatorCount: number, customerCount: number, dealerCount: number } } = {};

//     results.forEach((result: any) => {
//       const userId = result.getDataValue('userId');
//       const contactType = result.getDataValue('contactType');
//       const count = parseInt(result.getDataValue('count'), 10);
//       const username = result.user?.username;

//       if (!counts[userId]) {
//         counts[userId] = {
//           userId: userId,
//           username,
//           fabricatorCount: 0,
//           customerCount: 0,
//           dealerCount: 0,
//         };
//       }

//       switch (contactType) {
//         case 'fabricator':
//           counts[userId].fabricatorCount += count;
//           break;
//         case 'customer':
//           counts[userId].customerCount += count;
//           break;
//         case 'dealer':
//           counts[userId].dealerCount += count;
//           break;
//       }
//     });

//     const flattenedResults = Object.values(counts);

//     res.json(flattenedResults);
//   } catch (error: any) {
//     console.error('Error fetching overall enrolment:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

export const getOverallEnrolment = async (req: Request, res: Response) => {
  const { period, userId, managerId, teamName } = req.query;
  const { start, end } = getStartAndEnd(period);

  try {
    const whereClause: any = {
      createdAt: {
        [Op.between]: [start, end],
      },
    };

    if (userId) {
      whereClause.userId = userId;
    }

    const includeClause: any[] = [
      {
        model: User,
        as: "user",
        attributes: ["username", "empId", "name"], // Include name attribute
        where: {}, // Placeholder for conditions on the user model
      },
    ];

    // Add condition for teamName based on empId in the user model
    if (teamName && typeof teamName === "string") {
      const teamNames = teamName.split(",").map((name: string) => name.trim());
      includeClause[0].where = {
        empId: {
          [Op.or]: teamNames.map((name: string) => ({
            [Op.like]: `${name}%`,
          })),
        },
      };
    }

    // Add a nested include for filtering by managerId
    if (managerId) {
      whereClause["$user.managerId$"] = managerId;
      includeClause.push({
        model: User,
        as: "user",
        attributes: [],
        include: [
          {
            model: User,
            as: "manager",
            attributes: [],
          },
        ],
      });
    }

    const results = await Dealer.findAll({
      attributes: [
        "userId",
        "contactType",
        [fn("COUNT", col("Dealer.id")), "count"],
      ],
      where: whereClause,
      group: ["userId", "contactType", "user.id"],
      include: includeClause,
    });

    const counts: {
      [key: number]: {
        userId: number;
        username: string;
        empId: string;
        name: string;
        fabricatorCount: number;
        customerCount: number;
        dealerCount: number;
        engineersCount: number;
        masonsCount: number;
      };
    } = {};

    results.forEach((result: any) => {
      const userId = result.getDataValue("userId");
      const contactType = result.getDataValue("contactType");
      const count = parseInt(result.getDataValue("count"), 10);
      const username = result.user?.username;
      const empId = result.user?.empId;
      const name = result.user?.name;

      if (!counts[userId]) {
        counts[userId] = {
          userId: userId,
          username,
          empId,
          name,
          fabricatorCount: 0,
          customerCount: 0,
          dealerCount: 0,
          engineersCount: 0,
          masonsCount: 0,
        };
      }

      switch (contactType) {
        case "fabricator":
          counts[userId].fabricatorCount += count;
          break;
        case "customer":
          counts[userId].customerCount += count;
          break;
        case "dealer":
          counts[userId].dealerCount += count;
          break;
        case "engineers":
          counts[userId].engineersCount += count;
          break;
        case "masons":
          counts[userId].masonsCount += count;
          break;
      }
    });

    const flattenedResults = Object.values(counts);

    res.json(flattenedResults);
  } catch (error: any) {
    console.error("Error fetching overall enrolment:", error);
    res.status(500).json({ error: error.message });
  }
};

// export const getOverallDistance = async (req: Request, res: Response) => {
//   const { period, userId, teamName } = req.query; // Removed managerId and count-specific logic
//   const { start, end } = getStartAndEnd(period);

//   try {
//     const whereClause: any = {
//       createdAt: {
//         [Op.between]: [start, end],
//       },
//     };

//     if (userId) {
//       whereClause.userId = userId;
//     }

//     const includeClause: any[] = [
//       {
//         model: User,
//         as: "user",
//         attributes: ["username", "empId", "name"], // Include user details
//         where: {}, // Placeholder for conditions on the User model
//       },
//     ];

//     // Add condition for teamName based on empId in the User model
//     if (teamName && typeof teamName === "string") {
//       const teamNames = teamName.split(",").map((name: string) => name.trim());
//       includeClause[0].where = {
//         empId: {
//           [Op.or]: teamNames.map((name: string) => ({
//             [Op.like]: `${name}%`,
//           })),
//         },
//       };
//     }

//     // Fetch enrolment data
//     const results = await Dealer.findAll({
//       attributes: [
//         "userId",
//         [fn("COUNT", col("Dealer.id")), "totalCount"], // Single total count
//       ],
//       where: whereClause,
//       group: ["userId", "user.id"],
//       include: includeClause,
//     });

//     // Fetch total distance grouped by userId from TrackingInfo
//     const distanceResults = await TrackingInfo.findAll({
//       attributes: ["userId", [fn("SUM", col("distance")), "totalDistance"]],
//       where: whereClause,
//       group: ["userId"],
//     });

//     const distanceMap = distanceResults.reduce((map: any, result: any) => {
//       map[result.getDataValue("userId")] = parseFloat(
//         result.getDataValue("totalDistance")
//       );
//       return map;
//     }, {});

//     const counts: {
//       [key: number]: {
//         userId: number;
//         username: string;
//         empId: string;
//         name: string;
//         totalCount: number; // Single count for all contact types
//         totalDistance: number; // Add total distance
//       };
//     } = {};

//     results.forEach((result: any) => {
//       const userId = result.getDataValue("userId");
//       const totalCount = parseInt(result.getDataValue("totalCount"), 10);
//       const username = result.user?.username;
//       const empId = result.user?.empId;
//       const name = result.user?.name;

//       if (!counts[userId]) {
//         counts[userId] = {
//           userId,
//           username,
//           empId,
//           name,
//           totalCount, // Assign total count
//           totalDistance: distanceMap[userId] || 0, // Default to 0 if no distance
//         };
//       }
//     });

//     const flattenedResults = Object.values(counts);

//     res.json(flattenedResults);
//   } catch (error: any) {
//     console.error("Error fetching enrolment with distance:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// export const getOverallDistance = async (req: Request, res: Response) => {
//   const { period, userId, teamName } = req.query;
//   const { start, end } = getStartAndEnd(period);

//   try {
//     // Step 1: Define whereClause for TrackingInfo
//     const trackingInfoWhereClause: any = {
//       createdAt: {
//         [Op.between]: [start, end],
//       },
//       // trackingType: "captured", // Specific to TrackingInfo
//     };

//     if (userId) {
//       trackingInfoWhereClause.userId = userId;
//     }

//     const whereClause: any = {
//       createdAt: {
//         [Op.between]: [start, end],
//       },
//     };

//     if (userId) {
//       whereClause.userId = userId;
//     }

//     // Step 2: Fetch all valid users from the User model
//     const validUsers = await User.findAll({
//       attributes: ["id", "username", "empId", "name"],
//     });
//     const validUserMap = validUsers.reduce((map: any, user: any) => {
//       map[user.id] = {
//         username: user.username,
//         empId: user.empId,
//         name: user.name,
//       };
//       return map;
//     }, {});
//     const validUserIds = Object.keys(validUserMap).map((id) =>
//       parseInt(id, 10)
//     );

//     // Step 3: Fetch TrackingInfo data, filtered by valid user IDs
//     const trackingInfoResults = await TrackingInfo.findAll({
//       attributes: ["userId", [fn("SUM", col("distance")), "totalDistance"]],
//       where: {
//         ...trackingInfoWhereClause,
//         userId: { [Op.in]: validUserIds }, // Only include valid user IDs
//       },
//       group: ["userId"],
//     });

//     // Build a map of userId -> totalDistance from TrackingInfo
//     const distanceMap = trackingInfoResults.reduce((map: any, result: any) => {
//       const userId = result.getDataValue("userId");
//       map[userId] = parseFloat(result.getDataValue("totalDistance"));
//       return map;
//     }, {});

//     // Step 4: Fetch Dealer data for matching users
//     const includeClause: any[] = [
//       {
//         model: User,
//         as: "user",
//         attributes: ["username", "empId", "name"],
//         where: {}, // Placeholder for teamName filter
//       },
//     ];

//     if (teamName && typeof teamName === "string") {
//       const teamNames = teamName.split(",").map((name: string) => name.trim());
//       includeClause[0].where = {
//         empId: {
//           [Op.or]: teamNames.map((name: string) => ({
//             [Op.like]: `${name}%`,
//           })),
//         },
//       };
//     }

//     const dealerResults = await Dealer.findAll({
//       attributes: ["userId", [fn("COUNT", col("Dealer.id")), "totalCount"]],
//       where: {
//         ...whereClause,
//         userId: { [Op.in]: Object.keys(distanceMap) }, // Only include userIds from TrackingInfo
//       },
//       group: ["userId", "user.id"],
//       include: includeClause,
//     });

//     // Step 5: Merge Dealer and TrackingInfo Data, ensuring no nulls
//     const counts: {
//       [key: number]: {
//         userId: number;
//         username: string;
//         empId: string;
//         name: string;
//         totalCount: number; // Count from Dealer
//         totalDistance: number; // Sum from TrackingInfo
//       };
//     } = {};

//     // Add Dealer data first
//     dealerResults.forEach((result: any) => {
//       const userId = result.getDataValue("userId");
//       if (validUserMap[userId]) {
//         counts[userId] = {
//           userId,
//           username: validUserMap[userId].username,
//           empId: validUserMap[userId].empId,
//           name: validUserMap[userId].name,
//           totalCount: parseInt(result.getDataValue("totalCount"), 10),
//           totalDistance: distanceMap[userId] || 0, // Default to 0 if no TrackingInfo
//         };
//       }
//     });

//     // Add any TrackingInfo-only data
//     Object.keys(distanceMap).forEach((userId) => {
//       const id = parseInt(userId, 10);
//       if (validUserMap[id] && !counts[id]) {
//         counts[id] = {
//           userId: id,
//           username: validUserMap[id].username,
//           empId: validUserMap[id].empId,
//           name: validUserMap[id].name,
//           totalCount: 0, // No Dealer data
//           totalDistance: distanceMap[id] *2,
//         };
//       }
//     });

//     // Step 6: Flatten results and send response
//     const flattenedResults = Object.values(counts);
//     res.json(flattenedResults);
//   } catch (error: any) {
//     console.error("Error fetching enrolment with distance:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

export const getOverallDistance = async (req: Request, res: Response) => {
  const currentUser = req.uid;
  const currentRole = req.role;
  const { period, userId, teamName } = req.query;
  const { start, end } = getStartAndEnd(period);

  try {
    // Build date condition
    let dateCondition = "";
    if (start && end) {
      dateCondition = `AND t."createdAt" BETWEEN '${start.toISOString()}' AND '${end.toISOString()}'`;
    }

    // Initialize userCondition as empty string (following the pattern from getContactsCountByTypeAndDate)
    let userCondition = "";
    let dealerUserCondition = "";
    let trackingUserCondition = "";

    // If user is a manager, get all users under this manager
    if (currentRole === "manager") {
      const usersList = await managerIdWiseUsers(currentUser);
      if (usersList && usersList.length > 0) {
        userCondition = `AND "userId" IN (${usersList.map(id => `'${id}'`).join(",")})`;
        dealerUserCondition = `AND d."userId" IN (${usersList.map(id => `'${id}'`).join(",")})`;
        trackingUserCondition = `AND t."userId" IN (${usersList.map(id => `'${id}'`).join(",")})`;
      } else {
        // If manager has no subordinates, return empty result
        return res.json([]);
      }
    }
    // If a specific userId is provided and user is not a manager, use that userId
    else if (userId) {
      userCondition = `AND "userId" = '${userId}'`;
      dealerUserCondition = `AND d."userId" = '${userId}'`;
      trackingUserCondition = `AND t."userId" = '${userId}'`;
    }
    // If user is salesperson and no userId is provided, show only their own data
    else if (currentRole === "salesperson") {
      userCondition = `AND "userId" = '${currentUser}'`;
      dealerUserCondition = `AND d."userId" = '${currentUser}'`;
      trackingUserCondition = `AND t."userId" = '${currentUser}'`;
    }

    // Build team condition if provided
    let teamCondition = "";
    if (teamName && typeof teamName === "string") {
      const teamNames = teamName.split(",").map((name: string) => name.trim());
      const teamConditions = teamNames.map((name: string) => `u."empId" LIKE '${name}%'`).join(" OR ");
      teamCondition = `AND (${teamConditions})`;
    }

    // Fetch tracking info data with distance
    const trackingQuery = `
      SELECT 
        t."userId",
        u."username",
        u."empId",
        u."name",
        SUM(COALESCE(t."distance", 0)) as "totalDistance"
      FROM "trackingInfo" t
      JOIN "users" u ON t."userId" = u."id"
      WHERE 1=1 
        ${dateCondition}
        ${trackingUserCondition}
        ${teamCondition}
        AND t."distance" IS NOT NULL
      GROUP BY t."userId", u."username", u."empId", u."name"
      ORDER BY t."userId"
    `;

    const trackingResults: any = await sequelize.query(trackingQuery, {
      type: QueryTypes.SELECT,
    });

    // Build a map of userId -> totalDistance from TrackingInfo
    const distanceMap: any = {};
    trackingResults.forEach((result: any) => {
      distanceMap[result.userId] = parseFloat(result.totalDistance);
    });

    // Fetch dealer data
    const dealerQuery = `
      SELECT 
        d."userId",
        u."username",
        u."empId",
        u."name",
        COUNT(d."id") as "totalCount"
      FROM "dealers" d
      JOIN "users" u ON d."userId" = u."id"
      WHERE 1=1 
        AND d."createdAt" BETWEEN '${start?.toISOString()}' AND '${end?.toISOString()}'
        ${dealerUserCondition}
        ${teamCondition}
      GROUP BY d."userId", u."username", u."empId", u."name"
      ORDER BY d."userId"
    `;

    const dealerResults: any = await sequelize.query(dealerQuery, {
      type: QueryTypes.SELECT,
    });

    // Merge Dealer and TrackingInfo Data
    const counts: {
      [key: number]: {
        userId: number;
        username: string;
        empId: string;
        name: string;
        totalCount: number;
        totalDistance: number;
      };
    } = {};

    // Add Dealer data first
    dealerResults.forEach((result: any) => {
      const userId = result.userId;
      counts[userId] = {
        userId,
        username: result.username,
        empId: result.empId,
        name: result.name,
        totalCount: parseInt(result.totalCount, 10),
        totalDistance: distanceMap[userId] || 0,
      };
    });

    // Add any TrackingInfo-only data
    trackingResults.forEach((result: any) => {
      const userId = result.userId;
      if (!counts[userId]) {
        counts[userId] = {
          userId,
          username: result.username,
          empId: result.empId,
          name: result.name,
          totalCount: 0,
          totalDistance: distanceMap[userId] || 0,
        };
      }
    });

    // If a specific userId was requested, return only that user's data
    if (userId && typeof userId === "string") {
      const singleUserResult = counts[parseInt(userId, 10)];
      if (singleUserResult) {
        return res.json([singleUserResult]);
      } else {
        return res.json([]);
      }
    } else {
      const flattenedResults = Object.values(counts);
      res.json(flattenedResults);
    }
  } catch (error: any) {
    console.error("Error fetching enrolment with distance:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserActivity = async (req: Request, res: Response) => {
  const { period } = req.query;
  const currentUser = req.uid;
  const currentRole = req.role;
  const { start, end } = getStartAndEnd(period);

  // Define filter object
  const filter: any = {};
  
  if (currentRole === "manager") {
    const usersList = await managerIdWiseUsers(currentUser);
    filter.userId = { [Op.in]: usersList };
  }

  try {
    const tasks = await Task.findAll({
      attributes: ["userId", [fn("COUNT", col("Task.id")), "taskCount"]],
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
        ...filter // Apply the filter here
      },
      group: ["userId"],
    });

    const contacts = await Dealer.findAll({
      attributes: ["userId", [fn("COUNT", col("Dealer.id")), "contactCount"]],
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
        ...filter // Apply the filter here
      },
      group: ["userId"],
    });

    const attendance = await Attendance.findAll({
      attributes: [
        "userId",
        [
          fn(
            "SUM",
            literal('CASE WHEN "clockOut" IS NOT NULL THEN 1 ELSE 0 END')
          ),
          "presentDays",
        ],
        [
          fn("SUM", literal('CASE WHEN "clockOut" IS NULL THEN 1 ELSE 0 END')),
          "absentDays",
        ],
      ],
      where: {
        clockIn: {
          [Op.between]: [start, end],
        },
        ...filter // Apply the filter here
      },
      group: ["userId"],
    });

    const userActivity: any = {};
    tasks.forEach((task: any) => {
      const userId = task.getDataValue("userId");
      if (!userActivity[userId]) {
        userActivity[userId] = {
          taskCount: 0,
          contactCount: 0,
          presentDays: 0,
          absentDays: 0,
        };
      }
      userActivity[userId].taskCount = parseInt(
        task.getDataValue("taskCount"),
        10
      );
    });

    contacts.forEach((contact: any) => {
      const userId = contact.getDataValue("userId");
      if (!userActivity[userId]) {
        userActivity[userId] = {
          taskCount: 0,
          contactCount: 0,
          presentDays: 0,
          absentDays: 0,
        };
      }
      userActivity[userId].contactCount = parseInt(
        contact.getDataValue("contactCount"),
        10
      );
    });

    attendance.forEach((attend: any) => {
      const userId = attend.getDataValue("userId");
      if (!userActivity[userId]) {
        userActivity[userId] = {
          taskCount: 0,
          contactCount: 0,
          presentDays: 0,
          absentDays: 0,
        };
      }
      userActivity[userId].presentDays = parseInt(
        attend.getDataValue("presentDays"),
        10
      );
      userActivity[userId].absentDays = parseInt(
        attend.getDataValue("absentDays"),
        10
      );
    });

    const userIds = Object.keys(userActivity);

    const users = await User.findAll({
      where: {
        role: "salesperson",
        id: {
          [Op.in]: userIds,
        },
      },
      attributes: ["id", "empId", "name"],
    });

    const results = users.map((user: any) => ({
      userId: user.id,
      empId: user.empId,
      name: user.name,
      ...userActivity[user.id],
    }));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
