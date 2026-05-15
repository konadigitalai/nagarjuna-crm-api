import express from 'express';
import {
    createCommunication,
    getAllCommunications,
    getCommunicationById,
    updateCommunication,
    deleteCommunication,
    getCommunicationsByUserId,
} from '../controllers/communications.controller';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.post('/', authorize, createCommunication);
router.get('/', authorize, getAllCommunications);
router.get('/:id', authorize, getCommunicationById);
router.put('/:id', authorize, updateCommunication);
router.delete('/:id', authorize, deleteCommunication);
router.get('/user/:userId', authorize, getCommunicationsByUserId);

export default router;