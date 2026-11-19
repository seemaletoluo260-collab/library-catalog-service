import express from "express";

import * as middlewares from "../middlewares.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import Book from "../schemas/book.js";
import BorrowRequest, { borrowRequestInputSchema, borrowRequestStatusSchema } from "../schemas/borrow-request.js";

const router = express.Router();
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const FINE_PER_LATE_DAY = 0.25;

function validId(id: string | string[]): id is string {
  return typeof id === "string" && /^[\da-f]{24}$/i.test(id);
}

export function calculateFine(dueAt: Date, returnedAt: Date): number {
  const lateDays = Math.max(0, Math.ceil((returnedAt.getTime() - dueAt.getTime()) / DAY_IN_MILLISECONDS));
  return Number((lateDays * FINE_PER_LATE_DAY).toFixed(2));
}

router.get("/", requireAuth, requireRole("librarian"), async (_req, res, next) => {
  try {
    const requests = await BorrowRequest.find()
      .sort({ requestedAt: -1 })
      .populate("book", "title author")
      .populate("user", "username email");
    return res.json(requests);
  }
  catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, middlewares.validateBody(borrowRequestInputSchema), async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.body.bookId, availableCopies: { $gt: 0 } });
    if (!book)
      return res.status(400).json({ message: "Book is unavailable or does not exist" });

    const requestedAt = new Date();
    const dueAt = new Date(requestedAt);
    dueAt.setUTCDate(dueAt.getUTCDate() + 14);
    const borrowRequest = await BorrowRequest.create({
      book: book._id,
      user: req.user!.id,
      status: "pending",
      requestedAt,
      dueAt,
      returnedAt: null,
      fine: 0,
    });
    return res.status(201).json(borrowRequest);
  }
  catch (error) {
    return next(error);
  }
});

router.patch("/:id", requireAuth, requireRole("librarian"), middlewares.validateBody(borrowRequestStatusSchema), async (req, res, next) => {
  if (!validId(req.params.id))
    return res.status(400).json({ message: "Invalid borrow request id" });

  try {
    const borrowRequest = await BorrowRequest.findById(req.params.id);
    if (!borrowRequest)
      return res.status(404).json({ message: "Borrow request not found" });

    borrowRequest.status = req.body.status;
    if (req.body.status === "returned") {
      borrowRequest.returnedAt = new Date();
      borrowRequest.fine = calculateFine(borrowRequest.dueAt, borrowRequest.returnedAt);
    }
    else {
      borrowRequest.returnedAt = null;
      borrowRequest.fine = 0;
    }
    await borrowRequest.save();
    await borrowRequest.populate("book", "title author");
    await borrowRequest.populate("user", "username email");
    return res.json(borrowRequest);
  }
  catch (error) {
    return next(error);
  }
});

export default router;
