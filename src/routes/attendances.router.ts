import express from 'express';
import {
    createAttendance,
    getAllAttendance,
    getAttendanceByUserId,
    getAttendanceById,
    updateAttendance,
    deleteAttendance,
    deleteAttendances,
    getPresentAndAbsentCount,
    getTotalWorkingHours
} from '../controllers/attendances.controller';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.get('/count', authorize, getPresentAndAbsentCount);
router.get('/total-working-hours', authorize, getTotalWorkingHours);
router.get('/:id', authorize, getAttendanceById);
router.get('/user/:userId', authorize, getAttendanceByUserId);
router.get('/', authorize, getAllAttendance);
router.post('/', authorize, createAttendance);
router.put('/:id', authorize, updateAttendance);
router.delete('/:id', authorize, deleteAttendance);
router.delete('/', authorize, deleteAttendances);

export default router;
