import express from "express";
import { z } from "zod/v4";

import { signToken } from "../auth/token.js";
import { env } from "../env.js";
import * as middlewares from "../middlewares.js";
import User, { userInputSchema, verifyPassword } from "../schemas/user.js";

const router = express.Router();
const loginInputSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

function setAuthCookie(res: express.Response, token: string) {
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 1000,
  });
}

router.post("/register", middlewares.validateBody(userInputSchema), async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    setAuthCookie(res, signToken(user.id, user.role));
    return res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  }
  catch (error) {
    return next(error);
  }
});

router.post("/login", middlewares.validateBody(loginInputSchema), async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select("+password");
    if (!user || !await verifyPassword(req.body.password, user.password))
      return res.status(401).json({ message: "Invalid email or password" });

    setAuthCookie(res, signToken(user.id, user.role));
    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  }
  catch (error) {
    return next(error);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  return res.status(204).end();
});

export default router;
