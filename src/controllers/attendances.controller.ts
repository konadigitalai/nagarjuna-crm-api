import { Request, Response } from "express";
import Attendance from "../models/attendance.model";
import User from "../models/user.model";
import { Op, Sequelize } from "sequelize";
import { OrderItem } from "sequelize/types";
import { managerIdWiseUsers } from "./users.controller";

// Create a new attendance record
export const createAttendance = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId, clockIn, clockOut } = req.body;

  try {
    // await Attendance.sync({ alter: true });
    // Validate that the user exists before creating attendance
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(400).json({
        message: "Invalid userId. User not found.",
      });
    }

    const newAttendance = await Attendance.create({
      userId,
      clockIn,
      clockOut,
    });

    return res.status(201).json({
      message: "Attendance created successfully",
      attendance: newAttendance,
    });
  } catch (error: any) {
    console.error("Error creating attendance:", error);

    // Handle foreign key constraint errors specifically
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: "Cannot create attendance. The specified user does not exist.",
      });
    }

    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get all attendance records with working hours
export const getAllAttendance = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const currentUser = req.uid;
    const currentRole = req.role;
    let { startTime: rawStartTime, endTime: rawEndTime, userId } = req.query;
    const filter: any = {};
    const startTime =
      rawStartTime === "undefined"
        ? new Date(Date.now())
        : new Date(rawStartTime as string);
    const endTime =
      rawEndTime === "undefined"
        ? new Date(Date.now())
        : new Date(rawEndTime as string);
    if (rawEndTime === "undefined") {
      endTime.setDate(new Date(Date.now()).getDate() + 1);
    }

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

    if (currentRole === "manager") {
      const usersList = await managerIdWiseUsers(currentUser)
      filter.userId = { [Op.in]: usersList };
      // filter.userId = currentUser;
    }
    if (userId) {
      filter.userId = userId;
    }

    const attendanceRecords = await Attendance.findAll({
      where: filter,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]] as OrderItem[],
    });

    function formatIST(date: any) {
      if (!date) return null;
      let d = new Date(date);

      // Cutoff for older UTC records
      const cutoffDate = new Date("2026-03-11T00:00:00Z");

      if (d < cutoffDate) {
        // For records before 11-03-2026, subtract 5:30 so that toLocaleString (which adds 5:30) 
        // returns the original raw value in the requested format.
        d.setMinutes(d.getMinutes() - 330);
      }

      return d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
    }

    const updatedRecords = attendanceRecords.map((record: any) => {
      const data = record.toJSON();

      const clockIn = data.clockIn ? new Date(data.clockIn) : null;
      const clockOut = data.clockOut ? new Date(data.clockOut) : null;

      let totalMinutes = 0;

      if (clockOut) {
        totalMinutes =
          clockOut.getUTCHours() * 60 + clockOut.getUTCMinutes();
      }

      // 👇 Date condition (12-03-2026 pachi)
      const filterDate = new Date('2026-03-11T00:00:00Z');

      if (
        clockOut &&
        clockIn &&
        clockIn > filterDate &&   // 👈 important condition
        totalMinutes > 870
      ) {
        clockIn.setMinutes(clockIn.getMinutes() - 330);
        clockOut.setMinutes(clockOut.getMinutes() - 330);
      }

      return {
        ...data,
        clockIn,
        clockOut
      };
    });

    const attendanceWithWorkingHours = calculateWorkingHours(updatedRecords);

    const attendanceWithIST = attendanceWithWorkingHours.map((record: any) => ({
      ...record,
      clockIn: formatIST(record.clockIn),
      clockOut: record.clockOut ? formatIST(record.clockOut) : null,
    }));

    return res.status(200).json({ attendance: attendanceWithIST });
  } catch (error: any) {
    console.error("Error fetching attendance records:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get attendance by userId with working hours
export const getAttendanceByUserId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { startTime, endTime } = req.query;
  const filter: any = {};
  const userId = parseInt(req.params.userId);

  if (userId) {
    filter.userId = userId;
  }

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

  try {
    const attendanceRecords = await Attendance.findAll({
      where: filter,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]] as OrderItem[],
    });
    const attendanceWithWorkingHours = calculateWorkingHours(attendanceRecords);
    return res.status(200).json({ attendance: attendanceWithWorkingHours });
  } catch (error: any) {
    console.error("Error fetching attendance records by userId:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get attendance by ID
export const getAttendanceById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const id = parseInt(req.params.id);

  try {
    const attendanceRecord = await Attendance.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
      ],
    });
    if (!attendanceRecord) {
      return res.status(404).json({ message: "Attendance not found" });
    }
    const attendanceWithWorkingHours = calculateWorkingHours([
      attendanceRecord,
    ]);
    return res.status(200).json({ attendance: attendanceWithWorkingHours[0] });
  } catch (error) {
    console.error("Error fetching attendance by ID:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update an attendance record
export const updateAttendance = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const id = parseInt(req.params.id);
  const { clockIn, clockOut } = req.body;

  try {
    const attendanceRecord = await Attendance.findByPk(id);
    if (!attendanceRecord) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    attendanceRecord.clockIn = clockIn;
    attendanceRecord.clockOut = clockOut;
    await attendanceRecord.save();

    return res.status(200).json({
      message: "Attendance updated successfully",
      attendance: attendanceRecord,
    });
  } catch (error: any) {
    console.error("Error updating attendance record:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete an attendance record
export const deleteAttendance = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const id = parseInt(req.params.id);

  try {
    const attendanceRecord = await Attendance.findByPk(id);
    if (!attendanceRecord) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    await attendanceRecord.destroy();

    return res.status(200).json({ message: "Attendance deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting attendance record:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const deleteAttendances = async (req: Request, res: Response) => {
  const idsString = req.query.ids as string;
  const ids = idsString.split(",").map((id) => parseInt(id, 10));
  try {
    const deletedRowCount = await Attendance.destroy({
      where: { id: { [Op.in]: ids } },
    });
    if (deletedRowCount === 0) {
      return res.status(404).json({ message: "Attendance not found" });
    }
    res.status(200).json({ message: "Attendance deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting attendance:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const calculateWorkingHours = (attendanceRecords: any[]): any[] => {
  return attendanceRecords.map((attendance) => {
    const plainAttendance =
      attendance && typeof attendance.toJSON === "function"
        ? attendance.toJSON()
        : attendance;

    if (plainAttendance.clockIn && plainAttendance.clockOut) {
      const parseDate = (dateStr: any): Date => {
        if (!dateStr) return new Date(NaN);
        if (dateStr instanceof Date) return dateStr;

        let date = new Date(dateStr);
        if (isNaN(date.getTime()) && typeof dateStr === "string") {
          // Explicitly handle "DD/MM/YYYY, HH:MM:SS am/pm" (en-IN format)
          const match = dateStr.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{1,2}):(\d{1,2})\s*(am|pm)$/i
          );
          if (match) {
            let [, day, month, year, hours, minutes, seconds, ampm] = match;
            let h = parseInt(hours, 10);
            if (ampm.toLowerCase() === "pm" && h < 12) h += 12;
            if (ampm.toLowerCase() === "am" && h === 12) h = 0;
            return new Date(
              parseInt(year, 10),
              parseInt(month, 10) - 1,
              parseInt(day, 10),
              h,
              parseInt(minutes, 10),
              parseInt(seconds, 10)
            );
          }
        }
        return date;
      };

      const clockIn = parseDate(plainAttendance.clockIn);
      const clockOut = parseDate(plainAttendance.clockOut);

      if (!isNaN(clockIn.getTime()) && !isNaN(clockOut.getTime())) {
        const diffInMilliseconds = clockOut.getTime() - clockIn.getTime();
        const workingHours = diffInMilliseconds / (1000 * 60 * 60);
        return {
          ...plainAttendance,
          workingHours: parseFloat(workingHours.toFixed(2)),
        };
      }
    }
    return plainAttendance;
  });
};

export const getPresentAndAbsentCount = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Extract date from the request query or use current date if not provided
    let { date } = req.query;
    if (!date) {
      date = new Date().toISOString().slice(0, 10); // Use current date in 'YYYY-MM-DD' format
    }

    // Parse the date string to a Date object
    const currentDate = new Date(date as string);
    // Set the time to the beginning of the day
    currentDate.setUTCHours(0, 0, 0, 0);

    // Fetch all salesperson users
    const salespersonUsers = await User.findAll({
      where: {
        role: "salesperson",
      },
    });

    // Get user IDs of salesperson users
    const userIds = salespersonUsers.map((user) => user.id);

    // Find unique attendances for the specified date and salesperson users
    const attendances = await Attendance.findAll({
      where: {
        userId: userIds,
        clockIn: {
          [Op.gte]: currentDate,
        },
      },
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("userId")), "userId"],
      ], // Ensure unique user IDs
    });

    // Count the number of present attendances
    const presentCount = attendances.length;

    // Calculate absent count
    const totalSalespersons = salespersonUsers.length;
    const absentCount = totalSalespersons - presentCount;

    // Return the counts in the response
    return res.status(200).json({ presentCount, absentCount });
  } catch (error: any) {
    // Handle errors
    console.error("Error fetching present and absent count:", error);
    return res
      .status(500)
      .json({ error: "Internal Server error", message: error.message });
  }
};

export const getTotalWorkingHours = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Extract query parameters
    const { userId, fromDate, toDate } = req.query;

    // Set up the filters
    const filter: any = {};

    if (userId) {
      filter.userId = +userId;
    }

    if (fromDate && toDate) {
      const parsedFromDate = new Date(fromDate as string);
      const parsedToDate = new Date(toDate as string);

      // Ensure the dates are in UTC
      parsedFromDate.setUTCHours(0, 0, 0, 0);
      parsedToDate.setUTCHours(23, 59, 59, 999);

      filter.clockIn = {
        [Op.between]: [parsedFromDate, parsedToDate],
      };
    }

    // Find all attendances matching the filters
    const attendances = await Attendance.findAll({
      where: filter,
      include: [{ model: User, as: "user", attributes: ["name", "email"] }],
    });

    // Calculate total working hours
    let totalWorkingHours = 0;
    attendances.forEach((attendance) => {
      if (attendance.clockIn && attendance.clockOut) {
        const clockInTime = new Date(attendance.clockIn).getTime();
        const clockOutTime = new Date(attendance.clockOut).getTime();

        // Calculate working hours for the current attendance
        let workingHours = (clockOutTime - clockInTime) / (1000 * 60 * 60); // Convert milliseconds to hours

        // If the working hours are negative, it means clockOut is on the next day
        if (workingHours < 0) {
          workingHours += 24;
        }

        totalWorkingHours += workingHours;
      }
    });

    // Round the total working hours to two decimal places
    totalWorkingHours = Math.round(totalWorkingHours * 100) / 100;

    // Return the total working hours in the response
    return res.status(200).json({ totalWorkingHours });
  } catch (error: any) {
    // Handle errors
    console.error("Error fetching total working hours:", error);
    return res
      .status(500)
      .json({ error: "Internal Server error", message: error.message });
  }
};
