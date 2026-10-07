import express from "express";
import { z } from "zod/v4";

import * as middlewares from "../middlewares.js";
import Book, { bookInputSchema } from "../schemas/book.js";
import Genre from "../schemas/genre.js";

const router = express.Router();
const querySchema = z.object({
  genre: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

function validId(id: string | string[]): id is string {
  return typeof id === "string" && /^[\da-f]{24}$/i.test(id);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function invalidId(res: express.Response, field = "id") {
  return res.status(400).json({ message: "Validation failed", errors: { [field]: `Invalid ${field}` } });
}

router.get("/", async (req, res, next) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".") || "query";
      errors[field] ??= issue.message;
    }
    return res.status(400).json({ message: "Invalid query parameters", errors });
  }

  const { genre, search, page, limit } = parsed.data;
  if (genre && !validId(genre))
    return invalidId(res, "genre");

  const filter: Record<string, unknown> = {};
  if (genre)
    filter.genre = genre;
  if (search) {
    const expression = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: expression }, { author: expression }];
  }

  try {
    const [books, total] = await Promise.all([
      Book.find(filter).sort({ _id: 1 }).skip((page - 1) * limit).limit(limit),
      Book.countDocuments(filter),
    ]);
    return res.json({ data: books, total, page, limit, totalPages: Math.ceil(total / limit) });
  }
  catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  if (!validId(req.params.id))
    return invalidId(res);
  try {
    const book = await Book.findById(req.params.id);
    if (!book)
      return res.status(404).json({ message: "Book not found" });
    return res.json(book);
  }
  catch (error) {
    return next(error);
  }
});

router.post("/", middlewares.validateBody(bookInputSchema), async (req, res, next) => {
  try {
    if (!await Genre.exists({ _id: req.body.genre }))
      return res.status(400).json({ message: "Validation failed", errors: { genre: "Genre does not exist" } });
    const book = await Book.create(req.body);
    return res.status(201).json(book);
  }
  catch (error) {
    return next(error);
  }
});

router.put("/:id", middlewares.validateBody(bookInputSchema), async (req, res, next) => {
  if (!validId(req.params.id))
    return invalidId(res);
  try {
    if (!await Genre.exists({ _id: req.body.genre }))
      return res.status(400).json({ message: "Validation failed", errors: { genre: "Genre does not exist" } });
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!book)
      return res.status(404).json({ message: "Book not found" });
    return res.json(book);
  }
  catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  if (!validId(req.params.id))
    return invalidId(res);
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book)
      return res.status(404).json({ message: "Book not found" });
    return res.status(204).end();
  }
  catch (error) {
    return next(error);
  }
});

export default router;
