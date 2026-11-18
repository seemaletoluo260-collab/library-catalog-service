import express from "express";

import type MessageResponse from "../interfaces/message-response.js";

import auth from "./auth.js";
import books from "./books.js";
import emojis from "./emojis.js";
import genres from "./genres.js";
import users from "./users.js";

const router = express.Router();

router.get<object, MessageResponse>("/", (req, res) => {
  res.json({
    message: "API - 👋🌎🌍🌏",
  });
});

router.use("/emojis", emojis);
router.use("/auth", auth);
router.use("/users", users);
router.use("/books", books);
router.use("/genres", genres);
export default router;
