import express from 'express';
import { authorize } from '../middlewares/authorize';
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  createMultipleTasks
} from '../controllers/tasks.controller';

const router = express.Router();

router.post('/', authorize, createTask);
router.post('/bulk', authorize, createMultipleTasks);
router.get('/', authorize, getAllTasks);
router.get('/:id', authorize, getTaskById);
router.put('/:id', authorize, updateTask);
router.delete('/:id', authorize, deleteTask);
router.patch('/:id/status', authorize, updateTaskStatus);

export default router;