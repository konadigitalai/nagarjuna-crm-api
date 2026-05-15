import { Request, Response } from 'express';
import Task from '../models/task.model';
import User from '../models/user.model';
import { Op } from 'sequelize';
import { managerIdWiseUsers } from '../controllers/users.controller';

export const createTask = async (req: Request, res: Response) => {
  try {
    Task.sync();
    const { title, titleType, description, status, userId } = req.body;
    const newTask = await Task.create({ title, titleType, description, status, userId });
    res.status(201).json({ task: newTask });
  } catch (error: any) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const currentUser = req.uid;
    const currentRole = req.role;
    
    const options: any = {
      order: [['createdAt', 'DESC']],
      include: {
        model: User,
        as: 'user',
        attributes: ['name', 'email', 'username']
      }
    };

    // Initialize filter object
    const filter: any = {};
    
    // If a specific userId is provided and it's not null, use it
    if (userId !== undefined && userId !== null && userId !== 'null') {
      filter.userId = userId;
    } 
    // If user is a manager and no valid userId is provided, filter tasks to only show their subordinates' tasks
    else if (currentRole === "manager") {
      const usersList = await managerIdWiseUsers(currentUser);
      if (usersList && usersList.length > 0) {
        filter.userId = { [Op.in]: usersList };
      } else {
        // If manager has no subordinates, return empty array
        return res.status(200).json({ tasks: [] });
      }
    }
    // If user is a salesperson and no valid userId is provided, only show their own tasks
    else if (currentRole === "salesperson") {
      filter.userId = currentUser;
    }

    options.where = filter;

    const tasks = await Task.findAll(options);
    res.status(200).json({ tasks });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ task });
  } catch (error: any) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { title, titleType, description, status, userId } = req.body;
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.title = title;
    task.titleType = titleType;
    task.description = description;
    task.status = status;
    task.userId = userId;

    await task.save();
    res.status(200).json({ task });
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.destroy();
    res.status(200).json({ message: 'Task deleted' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;

    await task.save();
    res.status(200).json({ task });
  } catch (error: any) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: 'Error updating task status', error: error.message });
  }
};

export const createMultipleTasks = async (req: Request, res: Response) => {
  try {
    const { title, titleType, description, status, userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    const tasks = await Promise.all(userIds.map(userId =>
      Task.create({ title, titleType, description, status, userId })
    ));

    res.status(201).json({ tasks });
  } catch (error: any) {
    console.error('Error creating multiple tasks:', error);
    res.status(500).json({ message: 'Error creating multiple tasks', error: error.message });
  }
};