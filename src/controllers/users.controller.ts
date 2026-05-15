import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Joi from "joi";
import xlsx from "xlsx";
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import User, { UserAttributes } from "../models/user.model";
import { sequelize } from "../database";
import TrackingInfo from "../models/tracking.model";
import Attendance from "../models/attendance.model";
import { Op } from "sequelize";
import Dealer from "../models/contact.model";
import multer from 'multer';
export const imgUpload = multer();

export const managerIdWiseUsers = async (id: string | undefined) => {
  const filter: any = {};

  if (id) {
    filter.managerId = id;
  }

  // Fetch all users from the database
  const users = await User.findAll({
    where: filter,
    attributes: ["id"],
    order: [["createdAt", "DESC"]],
  });
  return id ? [...users?.map((user) => user?.id),id] : [];
};

export const getUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Extract query parameters
    const { role, managerId } = req.query;

    // Prepare filter object based on provided query parameters
    const filter: any = {};
    if (role) {
      filter.role = role;
    }

    if (managerId) {
      filter.managerId = managerId;
    }

    // Fetch all users from the database
    const users = await User.findAll({
      where: filter,
      attributes: { exclude: ["password"] },
      include: [
        {
          model: User,
          as: "manager",
          attributes: ["id", "name", "mobile"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Return the users in the response
    return res.status(200).json({ users });
  } catch (error) {
    // Handle errors, log them, and return an internal server error response
    console.error("Error fetching users:", error);
    return res.status(500).json("Internal Server error");
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const id = parseInt(req.params.id);

  try {
    // Find the user by ID
    const user = await User.findByPk(id);

    // If user is not found, return 404 Not Found
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user in the response
    return res.status(200).json(user);
  } catch (error) {
    // Handle errors, log them, and return an internal server error response
    console.error("Error fetching user by ID:", error);
    return res.status(500).json("Internal Server error");
  }
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { empId, username, email, mobile, password, name, role, managerId, slpId, empmId, tags } =
    req.body;

  try {
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res
        .status(400)
        .json({ message: "email must be unique. This email already exists." });
    }
    const existingMobile = await User.findOne({ where: { mobile } });
    if (existingMobile) {
      return res.status(400).json({
        message: "mobile must be unique. This mobile number already exists.",
      });
    }
    const existingEmpId = await User.findOne({ where: { empId } });
    if (existingEmpId) {
      return res
        .status(400)
        .json({ message: "empId must be unique. This empId already exists." });
    }
    const existingSplId = await User.findOne({ where: { slpId } });
    if (existingSplId) {
      return res
        .status(400)
        .json({ message: "Sales employee code must be unique. This sales employee code already exists." });
    }
    const existingEmpmId = await User.findOne({ where: { empmId } });
    if (existingEmpmId) {
      return res
        .status(400)
        .json({ message: "Employee master code must be unique. This employee master code already exists." });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({
        message: "username must be unique. This username already exists.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds

    // Ensure the User table exists
    await User.sync({ alter: true });

    // Insert user into the database with hashed password
    const newUser = await User.create({
      empId,
      username,
      email,
      mobile,
      password: hashedPassword,
      name,
      role,
      slpId,
      empmId,
      managerId: managerId ? managerId : null,
      tags: tags ? tags : undefined, // Add tags field
    });

    // Return success response
    return res.status(201).json({
      message: "User created successfully",
      data: {
        id: newUser.id,
        empId: newUser.empId,
        username: newUser.username,
        email: newUser.email,
        mobile: newUser.mobile,
        name: newUser.name,
        role: newUser.role,
        tags: newUser.tags, // Include tags in response
      },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0].path;
      return res.status(400).json({
        message: `${field} must be unique. This ${field} already exists.`,
      });
    }
    // Return error response
    return res.status(500).json({
      message: error?.errors?.[0]?.message
        ? error?.errors?.[0]?.message
        : "Internal server error",
    });
  }
};

export const loginUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { username, password } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { empId: username }],
      },
    });

    // If user is not found, return 401 Unauthorized
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    // If password doesn't match, return 401 Unauthorized
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      "You can't steel my password", // Use a strong secret key
      { expiresIn: "12h" } // Token expiration time
    );

    // Update user's current token (this will invalidate previous tokens)
    await user.update({ currentToken: token });

    return res.status(200).json({
      message: "Login successful",
      token,
      userInfo: {
        empId: user.empId,
        empmId: user.empmId,
        slpId: user.slpId,
        userId: user.id,
        email: user.email,
        mobile: user.mobile,
        username: user.username,
        role: user.role,
        mangerId: user.managerId,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// New login function specifically for salespersons with session management
export const loginSalesperson = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { username, password } = req.body;

  try {
    // Find the salesperson or manager by username or empId
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { empId: username }],
        role: {
          [Op.in]: ["salesperson", "manager"]
        }
      },
    });

    // If user is not found, return 401 Unauthorized
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    // If password doesn't match, return 401 Unauthorized
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      "You can't steel my password", // Use a strong secret key
      { expiresIn: "12h" } // Token expiration time
    );

    // Update user's current token (this will invalidate previous tokens)
    await user.update({ currentToken: token });

    return res.status(200).json({
      message: "Login successful",
      token,
      userInfo: {
        empId: user.empId,
        empmId: user.empmId,
        slpId: user.slpId,
        userId: user.id,
        email: user.email,
        mobile: user.mobile,
        username: user.username,
        role: user.role,
        mangerId: user.managerId,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update a user by ID
export const updateUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // Extract user ID from request parameters
  const id = parseInt(req.params.id);

  // Extract updated user details from request body
  const { name, empId, username, email, mobile, password, role, managerId, slpId, empmId, tags } =
    req.body;

  try {
    // Find the user by ID
    const user = await User.findByPk(id);

    // If user is not found, return 404 Not Found
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (slpId) {
      const existingSlpId = await User.findOne({
        where: { slpId, id: { [Op.ne]: id } },
      });
      if (existingSlpId) {
        return res.status(400).json({
          message: "Sales employee code must be unique. This sales employee code already exists.",
        });
      }
    }
    if (empmId) {
      const existingEmpmId = await User.findOne({
        where: { empmId, id: { [Op.ne]: id } },
      });
      if (existingEmpmId) {
        return res.status(400).json({
          message: "Employee master code must be unique. This employee master code already exists.",
        });
      }
    }
    if (empId) {
      const existingEmpId = await User.findOne({
        where: { empId, id: { [Op.ne]: id } },
      });
      if (existingEmpId) {
        return res.status(400).json({
          message: "empId must be unique. This empId already exists.",
        });
      }
    }

    if (username) {
      const existingUsername = await User.findOne({
        where: { username, id: { [Op.ne]: id } },
      });
      if (existingUsername) {
        return res.status(400).json({
          message: "username must be unique. This username already exists.",
        });
      }
    }

    if (email) {
      const existingEmail = await User.findOne({
        where: { email, id: { [Op.ne]: id } },
      });
      if (existingEmail) {
        return res.status(400).json({
          message: "email must be unique. This email already exists.",
        });
      }
    }

    if (mobile) {
      const existingMobile = await User.findOne({
        where: { mobile, id: { [Op.ne]: id } },
      });
      if (existingMobile) {
        return res.status(400).json({
          message: "mobile must be unique. This mobile number already exists.",
        });
      }
    }

    // Hash the password
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    // Role update that time Dealer assign to other salesperson
    if (user?.role !== role && user?.role === "salesperson") {
      const replacementSalesperson = await User.findOne({
        where: {
          role: "salesperson",
          id: { [Op.ne]: id }, // Exclude the specified id
        },
        order: [["createdAt", "DESC"]],
      });
      if (replacementSalesperson && replacementSalesperson.id) {
        await Dealer.update(
          { userId: replacementSalesperson.id },
          { where: { userId: id } }
        );
      }
    }

    // Update user attributes
    user.empId = empId;
    user.empmId = empmId;
    user.slpId = slpId;
    user.name = name;
    user.username = username;
    user.email = email;
    user.mobile = mobile;
    user.managerId = user?.role === role ? managerId : null;
    user.role = role;
    user.tags = tags ? tags : undefined; // Update tags field

    // Save the changes to the database
    await user.save();

    // Return a JSON response with the updated user details
    return res.json({
      message: "User updated successfully",
      user: {
        id,
        empId,
        name,
        username,
        email,
        mobile,
        role,
        managerId,
        tags, // Include tags in response
      },
    });
  } catch (error) {
    // Handle errors, log them, and return an internal server error response
    console.error("Error updating user:", error);
    return res.status(500).json("Internal Server error");
  }
};

// Delete a user by ID
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // Extract user ID from request parameters
  const id = parseInt(req.params.id);

  try {
    // Find the user by ID
    const user = await User.findByPk(id);

    // If user is not found, return 404 Not Found
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "salesperson") {
      const replacementSalesperson = await User.findOne({
        where: {
          role: "salesperson",
          id: { [Op.ne]: id }, // Exclude the specified id
        },
        order: [["createdAt", "DESC"]],
      });
      if (replacementSalesperson && replacementSalesperson.id) {
        await Dealer.update(
          { userId: replacementSalesperson.id },
          { where: { userId: id } }
        );
      }
    }

    if (user.role === "manager") {
      const replacementSalesperson = await User.findOne({
        where: {
          role: "manager",
          id: { [Op.ne]: id }, // Exclude the specified id
        },
        order: [["createdAt", "DESC"]],
      });
      if (replacementSalesperson && replacementSalesperson.id) {
        await User.update(
          { managerId: replacementSalesperson.id },
          { where: { managerId: id } }
        );
      }
    }

    await Attendance.destroy({ where: { userId: id } });
    await TrackingInfo.destroy({ where: { userId: id } });
    await User.destroy({ where: { id } });

    // Return a JSON response indicating successful deletion
    return res
      .status(200)
      .json({ message: `User ${user.username} deleted successfully` });
  } catch (error) {
    // Handle errors, log them, and return an internal server error response
    console.error("Error deleting user:", error);
    return res.status(500).json("Internal Server error");
  }
};

export const processExcelData = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Extract the uploaded Excel file from the request
    const excelFile = req.file;
    if (!excelFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Load the Excel workbook
    const workbook = xlsx.readFile(excelFile.path);

    // Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Extract data from the worksheet
    const userData: UserAttributes[] = xlsx.utils.sheet_to_json(worksheet);

    // Validate and process each row of data
    for (let i = 0; i < userData.length; i++) {
      const user = userData[i];
      user.name = user.name.toLowerCase();
      user.mobile = user.mobile?.toString();
      user.password = await bcrypt.hash(user.password.toString(), 10);

      // Joi schema for user data validation
      const userSchema = Joi.object({
        empId: Joi.string().required(),
        name: Joi.string().required(),
        username: Joi.string().required(),
        mobile: Joi.string()
          .required()
          .pattern(/^[0-9]{10}$/),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        role: Joi.string().valid("admin", "user", "salesperson").required(),
        tags: Joi.array().items(Joi.string()).optional(), // Add tags validation
      });

      // Validate the user data
      const validationResult = userSchema.validate(user, { abortEarly: false });
      if (validationResult.error) {
        return res.status(400).json({
          error: `Validation error in row ${i + 1
            }: ${validationResult.error.details
              .map((detail) => detail.message)
              .join("; ")}`,
        });
      }
    }

    // Insert validated user data into the database
    await User.bulkCreate(userData);

    // Return success response
    return res.status(200).json({ message: "Data inserted successfully" });
  } catch (error: any) {
    console.error("Error processing Excel data:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getSalespersonsStats = async (req: Request, res: Response) => {
  let { fromDate, toDate } = req.query;

  // Provide default values if fromDate and toDate are not provided
  if (!fromDate) {
    // Default fromDate to one week ago
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // One week in milliseconds
    fromDate = oneWeekAgo.toISOString();
  }

  if (!toDate) {
    // Default toDate to today
    const today = new Date();
    toDate = today.toISOString();
  }

  try {
    const parsedFromDate = new Date(fromDate as string);
    parsedFromDate.setUTCHours(0, 0, 0, 0);
    const parsedToDate = new Date(toDate as string);
    parsedToDate.setUTCHours(23, 59, 59, 999);

    const query = `
            SELECT 
                u.id,
                u.name,
                u.username,
                COUNT(DISTINCT CASE WHEN a."clockOut" IS NOT NULL THEN DATE(a."createdAt") END) AS "presentDays",
				COUNT(DISTINCT CASE WHEN a."clockOut" IS NULL THEN DATE(a."createdAt") END) AS "absentDays"
            FROM 
                users u
            LEFT JOIN 
                attendances a ON u.id = a."userId"
            WHERE 
                u.role = 'salesperson'
                AND a."createdAt" BETWEEN :fromDate AND :toDate
            GROUP BY 
				u.id, u.name, u.username;
        `;

    const salespersonsAttendance = await sequelize.query(query, {
      replacements: {
        fromDate: parsedFromDate.toISOString(),
        toDate: parsedToDate.toISOString(),
      },
      type: "SELECT",
    });

    return res.status(200).json(salespersonsAttendance);
  } catch (error) {
    console.error("Error fetching salespersons attendance:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    // Find the user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Error updating password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ message: "User ID and password are required" });
  }

  try {
    // Find the user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
const containerName = process.env.AZURE_STORAGE_DP_CONTAINER_NAME!;
const containerClient = blobServiceClient.getContainerClient(containerName);


export const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  const blobName = `${uuidv4()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });
  return blockBlobClient.url;
};


export const updateUserProfilePicture = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }

    const displayPictureUrl = await uploadImage(req.file);

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    user.profilePicture = displayPictureUrl;
    await user.save();

    res.send({ message: 'Profile picture updated successfully', profilePicture: user?.profilePicture });
  } catch (error) {
    res.status(500).send({ message: 'Failed to update profile picture', error });
  }
};