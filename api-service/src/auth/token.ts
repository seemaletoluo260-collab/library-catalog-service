import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";

import type { UserRole } from "../schemas/user.js";

import { env } from "../env.js";

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
};

type TokenPayload = {
  sub: string;
  iat: number;
  exp: number;
  role: UserRole;
};

const TOKEN_LIFETIME_SECONDS = 60 * 60;

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signature(input: string): Buffer {
  return createHmac("sha256", env.JWT_SECRET).update(input).digest();
}

export function signToken(id: string, role: UserRole): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ sub: id, role, iat: issuedAt, exp: issuedAt + TOKEN_LIFETIME_SECONDS });
  const input = `${header}.${payload}`;
  return `${input}.${signature(input).toString("base64url")}`;
}

export function verifyToken(token: string): AuthenticatedUser | null {
  if (token.length > 4096) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3)
    return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  if (!encodedHeader || !encodedPayload || !encodedSignature)
    return null;

  try {
    const input = `${encodedHeader}.${encodedPayload}`;
    const suppliedSignature = Buffer.from(encodedSignature, "base64url");
    const expectedSignature = signature(input);
    if (suppliedSignature.length !== expectedSignature.length
      || !timingSafeEqual(suppliedSignature, expectedSignature)) {
      return null;
    }

    const header: unknown = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8"));
    const payload: unknown = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (typeof header !== "object" || header === null || !("alg" in header) || header.alg !== "HS256") {
      return null;
    }
    if (typeof payload !== "object" || payload === null) {
      return null;
    }

    const claims = payload as Partial<TokenPayload>;
    if (typeof claims.sub !== "string" || !claims.sub
      || (claims.role !== "patron" && claims.role !== "librarian")
      || typeof claims.exp !== "number" || claims.exp <= Math.floor(Date.now() / 1000)
      || typeof claims.iat !== "number") {
      return null;
    }

    return { id: claims.sub, role: claims.role };
  }
  catch {
    return null;
  }
}
