import express from 'express';
import {
    sendEmail,
} from '../controllers/mails.controller';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.post('/send', authorize, sendEmail);

export default router;
