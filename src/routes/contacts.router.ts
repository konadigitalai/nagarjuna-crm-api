import { Router } from 'express';
import multer from 'multer';

import { 
    getContacts, getContactById, createContact, 
    deleteContact, updateContact, deleteContacts, 
    processExcelData, getContactsCountByType , contactDataUpdate, 
    getContactsForWp} from '../controllers/contacts.controller';
import { authorize } from '../middlewares/authorize';
import { imgUpload, updateDealerDisplayPicture } from '../controllers/contacts.controller';

const router = Router();

router.get('/', authorize, getContacts);
router.get('/wp', authorize, getContactsForWp);

router.get('/count', authorize, getContactsCountByType);

router.get('/:id', authorize, getContactById);

router.post('/', authorize, createContact);

router.put('/updateDisplayPicture', imgUpload.single('displayPicture'), authorize, updateDealerDisplayPicture);

router.put('/:id', authorize, updateContact);

router.delete('/:id', authorize, deleteContact);

router.delete('/', authorize, deleteContacts);

router.post('/contactDataUpdate', authorize, contactDataUpdate);


const upload = multer({ dest: 'uploads/' });
router.post('/bulkupload', upload.single('file'), processExcelData);

export default router;