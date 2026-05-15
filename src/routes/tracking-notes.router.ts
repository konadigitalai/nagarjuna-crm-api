import express, { Request, Response } from 'express';
import {
    createTrackingNote,
    getAllTrackingNotes,
    updateTrackingNote,
    deleteTrackingNote,
} from '../controllers/tracking-notes.controller';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.post('/', authorize, createTrackingNote);
router.get('/', authorize, getAllTrackingNotes);
router.put('/:id', authorize, updateTrackingNote);
router.delete('/:id', authorize, deleteTrackingNote);

export default router;
