import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../src/app.js";
import { signToken } from "../src/auth/token.js";

describe("GET /api/v1", () => {
  it("responds with a json message", () =>
    request(app)
      .get("/api/v1")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200, {
        message: "API - 👋🌎🌍🌏",
      }));
});

describe("GET /api/v1/emojis", () => {
  it("responds with a json message", () =>
    request(app)
      .get("/api/v1/emojis")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200, ["😀", "😳", "🙄"]));
});

describe("Credentialed frontend CORS", () => {
  it("allows the configured frontend origin to send auth cookies", async () => {
    const response = await request(app)
      .options("/api/auth/login")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST")
      .expect(204);

    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("does not grant credentialed CORS access to an unconfigured origin", async () => {
    const response = await request(app)
      .options("/api/auth/login")
      .set("Origin", "https://untrusted.example")
      .set("Access-Control-Request-Method", "POST")
      .expect(200);

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    expect(response.headers["access-control-allow-credentials"]).toBeUndefined();
  });
});

describe("Book input validation", () => {
  const librarianToken = signToken("64a1b2c3d4e5f67890123456", "librarian");

  it("returns field-specific errors for an empty body", async () => {
    const response = await request(app)
      .post("/api/v1/books")
      .set("Cookie", `authToken=${librarianToken}`)
      .send({})
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body.errors).toMatchObject({
      title: expect.any(String),
      author: expect.any(String),
      isbn: expect.any(String),
      genre: expect.any(String),
    });
    expect(response.body).not.toHaveProperty("stack");
  });

  it("rejects a malformed genre id without querying MongoDB", async () => {
    const response = await request(app)
      .post("/api/v1/books")
      .set("Cookie", `authToken=${librarianToken}`)
      .send({ title: "Dune", author: "Frank Herbert", isbn: "9780441172719", genre: "not-an-id" })
      .expect(400);

    expect(response.body.errors.genre).toMatch(/valid genre id/i);
  });
});

describe("Authentication and book authorization", () => {
  it.each([
    ["POST", "/api/books"],
    ["PUT", "/api/books/64a1b2c3d4e5f67890123456"],
    ["DELETE", "/api/books/64a1b2c3d4e5f67890123456"],
  ] as const)("rejects anonymous %s %s requests", async (method, path) => {
    await request(app)[method.toLowerCase() as "post" | "put" | "delete"](path).expect(401);
  });

  it.each([
    ["POST", "/api/books"],
    ["PUT", "/api/books/64a1b2c3d4e5f67890123456"],
    ["DELETE", "/api/books/64a1b2c3d4e5f67890123456"],
  ] as const)("rejects patron %s %s requests", async (method, path) => {
    const token = signToken("64a1b2c3d4e5f67890123456", "patron");
    const bookMutation = method === "POST"
      ? request(app).post(path)
      : method === "PUT"
        ? request(app).put(path)
        : request(app).delete(path);
    await bookMutation
      .set("Cookie", `authToken=${token}`)
      .expect(403);
  });

  it("allows a librarian through authorization to book validation", async () => {
    const token = signToken("64a1b2c3d4e5f67890123456", "librarian");
    const response = await request(app)
      .post("/api/books")
      .set("Cookie", `authToken=${token}`)
      .send({})
      .expect(400);

    expect(response.body.message).toBe("Validation failed");
  });

  it("requires authentication for the caller profile", async () => {
    await request(app).get("/api/users/profile").expect(401);
  });

  it("rejects a tampered token", async () => {
    const token = signToken("64a1b2c3d4e5f67890123456", "librarian");
    const parts = token.split(".");
    parts[2] = `${parts[2]}x`;
    await request(app)
      .post("/api/books")
      .set("Cookie", `authToken=${parts.join(".")}`)
      .expect(401);
  });

  it("clears the authentication cookie on logout", async () => {
    const response = await request(app).post("/api/auth/logout").expect(204);
    expect(response.headers["set-cookie"][0]).toMatch(/authToken=;/);
    expect(response.headers["set-cookie"][0]).toMatch(/Expires=/i);
  });
});
