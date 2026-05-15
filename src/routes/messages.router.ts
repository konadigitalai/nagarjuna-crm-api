import { Router } from 'express';
import {
    createMessage,
    getAllMessages,
    getMessageById,
    updateMessage,
    deleteMessage
} from '../controllers/messages.controller';

const router = Router();

// Create a new message
router.post('/', createMessage);

// Get all messages
router.get('/', getAllMessages);

// Get a single message by ID
router.get('/:id', getMessageById);

// Update a message by ID
router.put('/:id', updateMessage);

// Delete a message by ID
router.delete('/:id', deleteMessage);

export default router;