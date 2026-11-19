import type { Types } from "mongoose";

import { model, Schema } from "mongoose";
import { z } from "zod/v4";

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const bookingInputSchema = z.object({
  space: z.string().trim().min(1),
  date: z.iso.date(),
  startTime: z.string().regex(timePattern, "Start time must use HH:mm"),
  endTime: z.string().regex(timePattern, "End time must use HH:mm"),
}).refine(
  booking => booking.startTime < booking.endTime,
  { message: "End time must be after start time", path: ["endTime"] },
);

type BookingRecord = {
  space: string;
  user: Types.ObjectId;
  date: string;
  startTime: string;
  endTime: string;
};

const bookingSchema = new Schema<BookingRecord>({
  space: {
    type: String,
    required: true,
    trim: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Booking = model<BookingRecord>("Booking", bookingSchema);
export default Booking;
