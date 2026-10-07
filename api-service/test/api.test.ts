import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../src/app.js";

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

describe("Book input validation", () => {
  it("returns field-specific errors for an empty body", async () => {
    const response = await request(app)
      .post("/api/v1/books")
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
      .send({ title: "Dune", author: "Frank Herbert", isbn: "9780441172719", genre: "not-an-id" })
      .expect(400);

    expect(response.body.errors.genre).toMatch(/valid genre id/i);
  });
});
