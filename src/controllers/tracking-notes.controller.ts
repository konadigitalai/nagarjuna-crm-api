import { Request, Response } from 'express';
import TrackingNote from '../models/tracking-note.model';

// Create a new tracking note
export const createTrackingNote = async (req: Request, res: Response): Promise<Response> => {
    const { description, trackingInfoId } = req.body;

    try {
        // Ensure the Tracking Note table exists
        await TrackingNote.sync({alter: true});

        // Create the tracking note with trackingInfoId
        const newTrackingNote = await TrackingNote.create({
            description,
            trackingInfoId,
        });

        return res.status(201).json({ message: 'Tracking note created successfully', trackingNote: newTrackingNote });
    } catch (error: any) {
        console.error('Error creating tracking note:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get all tracking notes with associated dealers
export const getAllTrackingNotes = async (req: Request, res: Response): Promise<Response> => {
    try {
        const trackingNotes = await TrackingNote.findAll();
        return res.status(200).json({ trackingNotes });
    } catch (error: any) {
        console.error('Error fetching tracking notes:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message  });
    }
};

// Update a tracking note
export const updateTrackingNote = async (req: Request, res: Response): Promise<Response> => {
    const id = parseInt(req.params.id);
    const { description, trackingInfoId } = req.body;

    try {
        const trackingNote = await TrackingNote.findByPk(id);
        if (!trackingNote) {
            return res.status(404).json({ message: 'Tracking note not found' });
        }

        trackingNote.description = description;
        trackingNote.trackingInfoId = trackingInfoId; // Update trackingInfoId if needed
        await trackingNote.save();

        return res.status(200).json({ message: 'Tracking note updated successfully', trackingNote });
    } catch (error: any) {
        console.error('Error updating tracking note:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message  });
    }
};

// Delete a tracking note
export const deleteTrackingNote = async (req: Request, res: Response): Promise<Response> => {
    const id = parseInt(req.params.id);

    try {
        const trackingNote = await TrackingNote.findByPk(id);
        if (!trackingNote) {
            return res.status(404).json({ message: 'Tracking note not found' });
        }

        await trackingNote.destroy();

        return res.status(200).json({ message: 'Tracking note deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting tracking note:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message  });
    }
};