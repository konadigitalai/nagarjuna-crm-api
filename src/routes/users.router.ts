import { Router } from "express";
import multer from "multer";

import {
  getUsers,
  getUserById,
  createUser,
  deleteUser,
  updateUser,
  loginUser,
  loginSalesperson, // Import the new salesperson login function
  processExcelData,
  getSalespersonsStats,
  changePassword,
  resetPassword,
} from "../controllers/users.controller";
import { authorize } from "../middlewares/authorize";
import { imgUpload , updateUserProfilePicture } from '../controllers/users.controller';

const router = Router();

router.get("/", getUsers);
router.get("/salesperson/stats", getSalespersonsStats);
router.get("/:id", getUserById);
router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/login/salesperson", loginSalesperson); // New endpoint for salesperson login
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/passchange", changePassword); 
router.post('/updateProfilePicture', imgUpload.single('profilePicture'), authorize, updateUserProfilePicture);
router.post("/resetPassword", resetPassword); 


// Set up multer middleware
const upload = multer({ dest: "uploads/" });
router.post("/bulkupload", upload.single("file"), processExcelData);

export default router;