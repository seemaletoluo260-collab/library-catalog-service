import express from "express";

import * as middlewares from "../middlewares.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import Booking, { bookingInputSchema } from "../schemas/booking.js";

const router = express.Router();

export function timeRangesOverlap(startTime: string, endTime: string, existingStartTime: string, existingEndTime: string): boolean {
  return startTime < existingEndTime && endTime > existingStartTime;
}

router.get("/", requireAuth, requireRole("librarian"), async (_req, res, next) => {
  try {
    const bookings = await Booking.find()
      .sort({ date: 1, startTime: 1 })
      .populate("user", "username email");
    return res.json(bookings);
  }
  catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, middlewares.validateBody(bookingInputSchema), async (req, res, next) => {
  try {
    const overlappingBooking = await Booking.findOne({
      space: req.body.space,
      date: req.body.date,
      startTime: { $lt: req.body.endTime },
      endTime: { $gt: req.body.startTime },
    });
    if (overlappingBooking)
      return res.status(409).json({ message: "This space is already booked during that time" });

    const booking = await Booking.create({
      ...req.body,
      user: req.user!.id,
    });
    return res.status(201).json(booking);
  }
  catch (error) {
    return next(error);
  }
});

export default router;
