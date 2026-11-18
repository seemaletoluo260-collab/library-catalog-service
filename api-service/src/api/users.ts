import express from "express";

import { requireAuth } from "../middlewares/auth.js";
import User from "../schemas/user.js";

const router = express.Router();

router.get("/profile", requireAuth, async (req, res, next) => {
  try {
    const authenticatedUser = req.user;
    if (!authenticatedUser)
      return res.status(401).json({ message: "Authentication required" });

    const user = await User.findById(authenticatedUser.id).select("username email role");
    if (!user)
      return res.status(404).json({ message: "User not found" });

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  }
  catch (error) {
    return next(error);
  }
});

export default router;
