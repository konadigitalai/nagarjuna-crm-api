import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

// 👇 Extend Request interface in same file
declare module "express-serve-static-core" {
  interface Request {
    uid?: string;
    role?: string;
  }
}

export const authorize = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      "You can't steel my password"
    ) as { userId: string, role: string };

    // Find the user by ID
    const user = await User.findByPk(parseInt(decoded.userId));

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    // Check if the token matches the user's current token

    if (user.role === "manager" || user.role === "salesperson") {
      if (user.currentToken !== token) {
        return res.status(401).json({ message: "Unauthorized: Token expired or invalid" });
      }
    }

    // Attach uid to request
    req.uid = decoded.userId;
    req.role = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};