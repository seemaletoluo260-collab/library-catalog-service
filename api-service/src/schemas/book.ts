import type { Types } from "mongoose";

import { model, Schema } from "mongoose";
import { z } from "zod/v4";

export const bookInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().trim().min(1, "Author is required"),
  isbn: z.string().trim().min(1, "ISBN is required"),
  genre: z.string().regex(/^[\da-f]{24}$/i, "Genre must be a valid genre id"),
  totalCopies: z.number().int().min(0).default(0),
  availableCopies: z.number().int().min(0).default(0),
}).refine(
  book => book.availableCopies <= book.totalCopies,
  { message: "Available copies cannot exceed total copies", path: ["availableCopies"] },
);

type BookRecord = {
  title: string;
  author: string;
  isbn: string;
  genre: Types.ObjectId;
  totalCopies: number;
  availableCopies: number;
};

const bookSchema = new Schema<BookRecord>({
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
  totalCopies: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  availableCopies: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
}, { timestamps: true });

bookSchema.pre("validate", function () {
  if (this.availableCopies > this.totalCopies)
    this.invalidate("availableCopies", "Available copies cannot exceed total copies");
});

const Book = model("Book", bookSchema);

export default Book;
