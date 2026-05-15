import express from 'express';

import { authorize } from '../middlewares/authorize';
import { createWhatsAppTemplates, deleteWhatsAppTemplate,  listWhatsAppTemplates, sendTempMsg, sendWhatsAppController } from '../controllers/whatsapp.controller';
import { getWpMessage } from '../services/whatsappService';

const router = express.Router();

router.post('/', authorize, sendWhatsAppController);
router.get('/templates', authorize, listWhatsAppTemplates);
router.post('/templates', authorize, createWhatsAppTemplates);
router.delete('/templates', authorize, deleteWhatsAppTemplate);
router.post('/send-temp-msg', authorize, sendTempMsg);
router.get('/wpmessage', authorize, getWpMessage);
// router.get('/', authorize, getAllSalesPersonTrackingInfo);

export default router;
