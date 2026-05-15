import express from 'express';
import {
    createSalesPersonTrackingInfo,
    getAllSalesPersonTrackingInfo,
    getSalesPersonTrackingInfoByUserId,
    getSalesPersonTrackingInfoById,
    updateSalesPersonTrackingInfo,
    deleteSalesPersonTrackingInfo,
    deleteMultipleSalesPersonTrackingInfo
} from '../controllers/salesperson-tracking-info.controller';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.post('/', authorize, createSalesPersonTrackingInfo);
router.get('/user/:userId', authorize, getSalesPersonTrackingInfoByUserId);
router.get('/', authorize, getAllSalesPersonTrackingInfo);
router.get('/:id', authorize, getSalesPersonTrackingInfoById);
router.put('/:id', authorize, updateSalesPersonTrackingInfo);
router.delete('/:id', authorize, deleteSalesPersonTrackingInfo);
router.delete('/', authorize, deleteMultipleSalesPersonTrackingInfo);

export default router;
