import { Request, Response } from 'express';
import Message from '../models/message.model';
import User from '../models/user.model';

// Create a new message
export const createMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, message } = req.body;

        Message.sync({ alter: true });

        const newMessage = await Message.create({ userId, message });
        res.status(201).json({ message: 'Message created successfully', data: newMessage });
    } catch (error: any) {
        console.error('Error creating message:', error);
        res.status(500).json({ message: 'Error creating message', error: error.message });
    }
};

// Get all messages
export const getAllMessages = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.query;
    try {
        const whereClause = userId ? { userId } : {};
        const messages = await Message.findAll({
            where: whereClause,  // Apply the where clause conditionally
            include: {
                model: User,
                as: 'user',
                attributes: ['name', 'email', 'username']
            },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ messages });
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};

// Get a single message by ID
export const getMessageById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const message = await Message.findByPk(id, {
            include: {
                model: User,
                as: 'user',
                attributes: ['name', 'email']
            }
        });

        if (!message) {
            res.status(404).json({ message: 'Message not found' });
            return;
        }

        res.status(200).json({ message });
    } catch (error: any) {
        console.error('Error fetching message:', error);
        res.status(500).json({ message: 'Error fetching message', error: error.message });
    }
};

// Update a message by ID
export const updateMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const [updated] = await Message.update({ message }, {
            where: { id }
        });

        if (!updated) {
            res.status(404).json({ message: 'Message not found' });
            return;
        }

        const updatedMessage = await Message.findByPk(id, {
            include: {
                model: User,
                as: 'user',
                attributes: ['name', 'email']
            }
        });

        res.status(200).json({ message: 'Message updated successfully', data: updatedMessage });
    } catch (error: any) {
        console.error('Error updating message:', error);
        res.status(500).json({ message: 'Error updating message', error: error.message });
    }
};

// Delete a message by ID
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const deleted = await Message.destroy({
            where: { id }
        });

        if (!deleted) {
            res.status(404).json({ message: 'Message not found' });
            return;
        }

        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Error deleting message', error: error.message });
    }
};