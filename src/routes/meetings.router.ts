import express from 'express';
import {
    sendEmails,
    getAllMeetings
} from '../controllers/meetings.controller';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.post('/schedule', authorize, sendEmails);
router.get('/', authorize, getAllMeetings);

export default router;
