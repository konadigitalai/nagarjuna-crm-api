// routes/relatedContacts.ts
import express from 'express';
import { 
    createRelatedContact, 
    getRelatedContacts, 
    getRelatedContactById, 
    updateRelatedContact, 
    deleteRelatedContact,
    deleteRelatedContacts
} from '../controllers/related-contacts.controller';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.post('/', authorize, createRelatedContact);
router.get('/', authorize, getRelatedContacts);
router.get('/:id', authorize, getRelatedContactById);
router.put('/:id', authorize, updateRelatedContact);
router.delete('/:id', authorize, deleteRelatedContact);
router.delete('/', authorize, deleteRelatedContacts);

export default router;
