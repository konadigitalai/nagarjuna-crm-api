import { Request, Response } from 'express';
import { Op } from 'sequelize';
import SalesPersonTrackingInfo from '../models/salesperson-tracking.model';
import User from '../models/user.model';

// Create a new sales person tracking info
export const createSalesPersonTrackingInfo = async (req: Request, res: Response): Promise<Response> => {
    const { latitude, longitude, address, userId } = req.body;
    try {
        SalesPersonTrackingInfo.sync({ alter: true });
        const newTrackingInfo = await SalesPersonTrackingInfo.create({
            latitude,
            longitude,
            address,
            userId
        });

        return res.status(201).json({ message: 'Sales person tracking info created successfully', trackingInfo: newTrackingInfo });
    } catch (error: any) {
        console.error('Error creating sales person tracking info:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get all sales person tracking info
export const getAllSalesPersonTrackingInfo = async (req: Request, res: Response): Promise<Response> => {
    try {
        const trackingInfo = await SalesPersonTrackingInfo.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'email']
                }
            ]
        });
        return res.status(200).json({ trackingInfo });
    } catch (error: any) {
        console.error('Error fetching sales person tracking info:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

export const getSalesPersonTrackingInfoByUserId = async (req: Request, res: Response): Promise<Response> => {
    const userId = parseInt(req.params.userId as string);

    try {
        // Find the tracking info by user ID
        const trackingInfo = await SalesPersonTrackingInfo.findAll({
            where: { userId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'email']
                }
            ]
        });

        // If tracking info is not found, return 404 Not Found
        if (!trackingInfo || trackingInfo.length === 0) {
            return res.status(404).json({ message: 'Sales person tracking info not found for the user' });
        }

        // Return the tracking info along with associated user
        return res.status(200).json({ trackingInfo });
    } catch (error: any) {
        console.error('Error fetching sales person tracking info by user ID:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get sales person tracking info by ID along with associated user
export const getSalesPersonTrackingInfoById = async (req: Request, res: Response): Promise<Response> => {
    const id = parseInt(req.params.id);

    try {
        // Find the tracking info by ID
        const trackingInfo = await SalesPersonTrackingInfo.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'email']
                }
            ]
        });

        // If tracking info is not found, return 404 Not Found
        if (!trackingInfo) {
            return res.status(404).json({ message: 'Sales person tracking info not found' });
        }

        // Return the tracking info along with associated user
        return res.status(200).json({ trackingInfo });
    } catch (error: any) {
        console.error('Error fetching sales person tracking info by ID:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update a sales person tracking info
export const updateSalesPersonTrackingInfo = async (req: Request, res: Response): Promise<Response> => {
    const id = parseInt(req.params.id);
    const { latitude, longitude, address, userId } = req.body;

    try {
        const trackingInfo = await SalesPersonTrackingInfo.findByPk(id);
        if (!trackingInfo) {
            return res.status(404).json({ message: 'Sales person tracking info not found' });
        }

        trackingInfo.latitude = latitude;
        trackingInfo.longitude = longitude;
        trackingInfo.address = address;
        trackingInfo.userId = userId;
        await trackingInfo.save();

        return res.status(200).json({ message: 'Sales person tracking info updated successfully', trackingInfo });
    } catch (error: any) {
        console.error('Error updating sales person tracking info:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete a sales person tracking info
export const deleteSalesPersonTrackingInfo = async (req: Request, res: Response): Promise<Response> => {
    const id = parseInt(req.params.id);

    try {
        const trackingInfo = await SalesPersonTrackingInfo.findByPk(id);
        if (!trackingInfo) {
            return res.status(404).json({ message: 'Sales person tracking info not found' });
        }

        await trackingInfo.destroy();

        return res.status(200).json({ message: 'Sales person tracking info deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting sales person tracking info:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete multiple sales person tracking infos
export const deleteMultipleSalesPersonTrackingInfo = async (req: Request, res: Response): Promise<Response> => {
    const ids = req.query.ids as string[];

    try {
        // Delete multiple sales person tracking infos by IDs
        const deletedRowCount = await SalesPersonTrackingInfo.destroy({ where: { id: { [Op.in]: ids } } });
        if (deletedRowCount === 0) {
            return res.status(404).json({ message: 'Sales person tracking infos not found' });
        }

        return res.status(200).json({ message: 'Sales person tracking infos deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting sales person tracking infos:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};