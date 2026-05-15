import { Request, Response } from 'express';
import { Op } from 'sequelize';

import User from '../models/user.model';
import Attendance from '../models/attendance.model';
import Contact from '../models/contact.model';
import TrackingInfo from '../models/tracking.model';

export const appStatistics = async (req: Request, res: Response) => {
    try {
        // Extract query parameters
        const { userId, fromDate, toDate } = req.query;

        // Ensure userId is present and valid
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

		// Initialize the filters
        const userFilter = { userId: +userId };

		const parsedFromDate = new Date(fromDate as string);
		const parsedToDate = new Date(toDate as string);

		// Ensure the dates are in UTC
		parsedFromDate.setUTCHours(0, 0, 0, 0);
		parsedToDate.setUTCHours(23, 59, 59, 999);

		// Create date range clause if both dates are provided
        const dateRangeClause = parsedFromDate && parsedToDate ? {
            createdAt: {
                [Op.between]: [parsedFromDate, parsedToDate]
            }
        } : {};

        // Count contacts for the specific user without date filter
        const contactsCountByUserId = await Contact.count({
            where: userFilter
        });

        // Count contacts for the specific user with date filter
        const userDateFilter = {
            ...userFilter,
            ...dateRangeClause
        };

        const contactsCountByUserIdWithDate = await Contact.count({
            where: userDateFilter
        });

		// Find attendances matching the filters
        const attendances = await Attendance.findAll({
            where: userDateFilter,
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        });

		// Calculate total working hours for the retrieved attendances
        const totalWorkingHours = calculateTotalWorkingHours(attendances);


		const trackingFilter = {
            userId: userId,
            trackingType: 'captured',
            createdAt: {
                [Op.between]: [parsedFromDate, parsedToDate]
            }
        };

        // Count the number of tracking entries matching the filters
        const trackingCount = await TrackingInfo.count({
            where: trackingFilter
        });

        return res.status(200).json({
            totalNoOfContacts: contactsCountByUserId,
            newContacts: contactsCountByUserIdWithDate,
			workingHours: totalWorkingHours,
			noOfVisits: trackingCount
        });
    } catch (error) {
        console.error('Error fetching app statistics:', error);
        return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch app statistics' });
    }
};

const calculateTotalWorkingHours = (attendances: Array<any>) => {
    let totalWorkingHours = 0;

    attendances.forEach(attendance => {
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
    return Math.round(totalWorkingHours * 100) / 100;
}