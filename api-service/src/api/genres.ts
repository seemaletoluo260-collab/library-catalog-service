import express from "express";

import * as middlewares from "../middlewares.js";
import Book from "../schemas/book.js";
import Genre, { genreInputSchema } from "../schemas/genre.js";

const router = express.Router();

function validId(id: string | string[]): id is string {
  return typeof id === "string" && /^[\da-f]{24}$/i.test(id);
}

function invalidId(res: express.Response) {
  return res.status(400).json({ message: "Validation failed", errors: { id: "Invalid id" } });
}

router.get("/", async (_req, res, next) => {
  try {
    return res.json(await Genre.find().sort({ name: 1 }));
  }
  catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  if (!validId(req.params.id))
    return invalidId(res);
  try {
    const genre = await Genre.findById(req.params.id);
    if (!genre)
      return res.status(404).json({ message: "Genre not found" });
    return res.json(genre);
  }
  catch (error) {
    return next(error);
  }
});

router.post("/", middlewares.validateBody(genreInputSchema), async (req, res, next) => {
  try {
    const genre = await Genre.create(req.body);
    return res.status(201).json(genre);
  }
  catch (error) {
    return next(error);
  }
});

router.put("/:id", middlewares.validateBody(genreInputSchema), async (req, res, next) => {
  if (!validId(req.params.id))
    return invalidId(res);
  try {
    const genre = await Genre.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!genre)
      return res.status(404).json({ message: "Genre not found" });
    return res.json(genre);
  }
  catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  if (!validId(req.params.id))
    return invalidId(res);
  try {
    const genre = await Genre.findById(req.params.id);
    if (!genre)
      return res.status(404).json({ message: "Genre not found" });
    if (await Book.exists({ genre: genre._id }))
      return res.status(409).json({ message: "Genre is still referenced by books", field: "genre" });
    await genre.deleteOne();
    return res.status(204).end();
  }
  catch (error) {
    return next(error);
  }
});

export default router;
