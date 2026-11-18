import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import type MessageResponse from "./interfaces/message-response.js";

import api from "./api/index.js";
import { env } from "./env.js";
import * as middlewares from "./middlewares.js";

const app = express();
const allowedOrigins = new Set(env.CORS_ORIGINS.split(",").map(origin => origin.trim()).filter(Boolean));

app.use(morgan("dev"));
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  },
  credentials: true,
}));
app.use(express.json());
app.get<object, MessageResponse>("/", (req, res) => {
  res.json({
    message: "🦄🌈✨👋🌍🌏✨🌈🦄",
  });
});

app.use("/api", api);
app.use("/api/v1", api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
