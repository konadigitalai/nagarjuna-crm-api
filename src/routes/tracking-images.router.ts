import express from 'express';
import multer from 'multer';

import {
    createTrackingImage,
    getAllTrackingImages,
    updateTrackingImage,
    deleteTrackingImage,
    compressAndReplaceImages,
} from '../controllers/tracking-images.controller';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

// Set up multer middleware
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

router.post('/', authorize, upload.single('image'), createTrackingImage);
router.get('/', authorize, getAllTrackingImages);
router.put('/:id', authorize, updateTrackingImage);
router.delete('/:id', authorize, deleteTrackingImage);
router.get('/compress', compressAndReplaceImages);

export default router;
