import express from "express";

import type MessageResponse from "../interfaces/message-response.js";

import books from "./books.js";
import emojis from "./emojis.js";
import genres from "./genres.js";

const router = express.Router();

router.get<object, MessageResponse>("/", (req, res) => {
  res.json({
    message: "API - 👋🌎🌍🌏",
  });
});

router.use("/emojis", emojis);
router.use("/books", books);
router.use("/genres", genres);
export default router;
