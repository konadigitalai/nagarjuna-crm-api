import express, { Request, Response } from "express";
import {
  clearFollowUpNotification,
  createFollowUp,
  deleteFollowUp,
  getFollowUp,
  getFollowUpNotification,
  updateFollowUp,
} from "../controllers/followUp.controller";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

router.post("/", authorize, createFollowUp);
router.get("/", authorize, getFollowUp);
router.get("/notification", authorize, getFollowUpNotification);
router.put("/", authorize, updateFollowUp);
router.delete("/:id", authorize, deleteFollowUp);
router.put("/clearnotification", authorize, clearFollowUpNotification);

export default router;
