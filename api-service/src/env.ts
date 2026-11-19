import { z } from "zod/v4";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(32).default("development-only-change-this-secret-32"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
}).superRefine((values, context) => {
  if (values.NODE_ENV === "production" && values.JWT_SECRET === "development-only-change-this-secret-32") {
    context.addIssue({
      code: "custom",
      path: ["JWT_SECRET"],
      message: "Set JWT_SECRET to a unique secret of at least 32 characters in production",
    });
  }
});

try {
  // eslint-disable-next-line node/no-process-env
  envSchema.parse(process.env);
}
catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Missing environment variables:", error.issues.flatMap(issue => issue.path));
  }
  else {
    console.error(error);
  }
  process.exit(1);
}

// eslint-disable-next-line node/no-process-env
export const env = envSchema.parse(process.env);
