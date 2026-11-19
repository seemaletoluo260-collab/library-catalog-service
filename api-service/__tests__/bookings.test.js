import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import app from "../src/app.js";
import { signToken } from "../src/auth/token.js";
import Booking from "../src/schemas/booking.js";

afterEach(() => vi.restoreAllMocks());

describe("POST /api/bookings", () => {
  it("rejects a partial time overlap for the same space and date", async () => {
    const existingBooking = new Booking({
      space: "Quiet Study Room",
      user: "64a1b2c3d4e5f67890123456",
      date: "2026-04-15",
      startTime: "10:00",
      endTime: "11:00",
    });
    const findOne = vi.spyOn(Booking, "findOne").mockResolvedValue(existingBooking);
    const patronToken = signToken("64a1b2c3d4e5f67890123456", "patron");

    const response = await request(app)
      .post("/api/bookings")
      .set("Cookie", `authToken=${patronToken}`)
      .send({
        space: "Quiet Study Room",
        date: "2026-04-15",
        startTime: "10:30",
        endTime: "11:30",
      })
      .expect(409);

    expect(response.body).toEqual({ message: "This space is already booked during that time" });
    expect(findOne).toHaveBeenCalledWith({
      space: "Quiet Study Room",
      date: "2026-04-15",
      startTime: { $lt: "11:30" },
      endTime: { $gt: "10:30" },
    });
  });
});
