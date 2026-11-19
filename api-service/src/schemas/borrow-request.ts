import type { Types } from "mongoose";

import { model, Schema } from "mongoose";
import { z } from "zod/v4";

export const borrowRequestInputSchema = z.object({
  bookId: z.string().regex(/^[\da-f]{24}$/i, "Book must be a valid book id"),
});

export const borrowRequestStatusSchema = z.object({
  status: z.enum(["pending", "approved", "returned", "late"]),
});

type BorrowRequestRecord = {
  book: Types.ObjectId;
  user: Types.ObjectId;
  status: "pending" | "approved" | "returned" | "late";
  requestedAt: Date;
  dueAt: Date;
  returnedAt: Date | null;
  fine: number;
};

const borrowRequestSchema = new Schema<BorrowRequestRecord>({
  book: {
    type: Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "returned", "late"],
    default: "pending",
    required: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  dueAt: {
    type: Date,
    required: true,
  },
  returnedAt: {
    type: Date,
    default: null,
  },
  fine: {
    type: Number,
    min: 0,
    default: 0,
    required: true,
  },
}, { timestamps: true });

const BorrowRequest = model<BorrowRequestRecord>("BorrowRequest", borrowRequestSchema);
export default BorrowRequest;
