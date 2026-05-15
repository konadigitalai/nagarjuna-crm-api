import { Router } from "express";
import { authorize } from "../middlewares/authorize";
import { createContactActivite,deleteContactActivite,getContactActivite  } from "../controllers/activite.controller";

const router = Router();

router.post("/", authorize, createContactActivite);
router.get("/", authorize, getContactActivite);
router.delete("/:id", authorize, deleteContactActivite);


export default router; 