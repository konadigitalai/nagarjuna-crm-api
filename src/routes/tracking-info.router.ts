import express, { Request, Response } from 'express';
import multer from 'multer';
import {
    createTrackingInfo,
    getTrackingInfoById,
    getAllTrackingInfo,
    updateTrackingInfo,
    deleteTrackingInfo,
    deleteTrackingInfos,
    processExcelData,
    getCapturedTrackings
} from '../controllers/tracking-info.controller';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.post('/', authorize, createTrackingInfo);
router.get('/', authorize, getAllTrackingInfo);
router.get('/captured-count', authorize, getCapturedTrackings);
router.get('/:id', authorize, getTrackingInfoById);
router.put('/:id', authorize, updateTrackingInfo);
router.delete('/:id', authorize, deleteTrackingInfo);
router.delete('/', authorize, deleteTrackingInfos);

// Set up multer middleware
const upload = multer({ dest: process.env.VERCEL ? '/tmp/uploads' : 'uploads/' });
router.post('/bulkupload', upload.single('file'), processExcelData);

export default router;
