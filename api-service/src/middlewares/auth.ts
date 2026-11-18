import type { NextFunction, Request, Response } from "express";

import type { AuthenticatedUser } from "../auth/token.js";
import type { UserRole } from "../schemas/user.js";

import { verifyToken } from "../auth/token.js";

declare module "express-serve-static-core" {
  // Express request augmentation must use an interface for declaration merging.
  // eslint-disable-next-line ts/consistent-type-definitions
  interface Request {
    user?: AuthenticatedUser;
  }
}

function authCookie(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader)
    return undefined;
  const cookie = cookieHeader.split(";").map(value => value.trim()).find(value => value.startsWith("authToken="));
  if (!cookie)
    return undefined;

  try {
    return decodeURIComponent(cookie.slice("authToken=".length));
  }
  catch {
    return undefined;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = authCookie(req);
  const user = token ? verifyToken(token) : null;
  if (!user)
    return res.status(401).json({ message: "Authentication required" });

  req.user = user;
  return next();
}

export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user)
      return res.status(401).json({ message: "Authentication required" });
    if (req.user.role !== role)
      return res.status(403).json({ message: "Forbidden" });
    return next();
  };
}
