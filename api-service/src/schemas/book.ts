import { model, Schema } from "mongoose";
import { z } from "zod/v4";

export const bookInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().trim().min(1, "Author is required"),
  isbn: z.string().trim().min(1, "ISBN is required"),
  genre: z.string().regex(/^[\da-f]{24}$/i, "Genre must be a valid genre id"),
});

const bookSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  isbn: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  genre: {
    type: Schema.Types.ObjectId,
    ref: "Genre",
    required: true,
  },
}, { timestamps: true });
const Book = model("Book", bookSchema);

export default Book;
