import express from 'express';
import { authorize } from '../middlewares/authorize';
import {
  createGroup,
  listGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  sendGroup,
} from '../controllers/group.controller';

const router = express.Router();

router.post('/', authorize, createGroup);
router.post('/send', authorize, sendGroup);
router.get('/', authorize, listGroups);
router.get('/:id', authorize, getGroupById);
router.put('/:id', authorize, updateGroup);
router.delete('/:id', authorize, deleteGroup);

export default router;
