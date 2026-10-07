import { model, Schema } from "mongoose";
import { z } from "zod/v4";

export const genreInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
});

const genreSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
}, { timestamps: true });

const Genre = model("Genre", genreSchema);

export default Genre;
