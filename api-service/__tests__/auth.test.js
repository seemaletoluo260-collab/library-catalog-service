import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../src/app.js";
import { signToken } from "../src/auth/token.js";

describe("librarian route authorization", () => {
  it("rejects missing and invalid credentials and denies patrons", async () => {
    const path = "/api/borrow-requests";
    await request(app).get(path).expect(401);
    await request(app).get(path).set("Cookie", "authToken=not-a-valid-token").expect(401);

    const patronToken = signToken("64a1b2c3d4e5f67890123456", "patron");
    const response = await request(app)
      .get(path)
      .set("Cookie", `authToken=${patronToken}`)
      .expect(403);
    expect(response.body).toEqual({ message: "Forbidden" });
  });
});
