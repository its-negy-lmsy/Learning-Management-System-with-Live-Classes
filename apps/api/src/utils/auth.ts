import { createHash, randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { get } from "../db/store.js";
import { HttpError } from "./http.js";

export type UserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type AuthUser = { id: string; name: string; email: string; role: UserRole };
declare global { namespace Express { interface Request { user?: AuthUser } } }

export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function makeRefreshToken() { return randomBytes(48).toString("base64url"); }

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const base = { httpOnly: true, secure: config.cookieSecure, sameSite: config.cookieSameSite, path: "/" as const };
  res.cookie(config.cookieNames.access, accessToken, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie(config.cookieNames.refresh, refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/api/v1/auth" });
}

export function clearAuthCookies(res: Response) {
  const base = { httpOnly: true, secure: config.cookieSecure, sameSite: config.cookieSameSite };
  res.clearCookie(config.cookieNames.access, { ...base, path: "/" });
  res.clearCookie(config.cookieNames.refresh, { ...base, path: "/api/v1/auth" });
}

export function issueAccessToken(user: AuthUser) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: "15m", issuer: "fs03-api", audience: "fs03-web" });
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[config.cookieNames.access] ?? req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) throw new HttpError(401, "UNAUTHENTICATED", "Sign in to continue.");
    const payload = jwt.verify(token, config.jwtSecret, { issuer: "fs03-api", audience: "fs03-web" }) as jwt.JwtPayload;
    const user = await get<{ id: string; name: string; email: string; role: UserRole }>("users", String(payload.sub));
    if (!user) throw new HttpError(401, "UNAUTHENTICATED", "Your session is no longer active.");
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch (error) { next(error instanceof HttpError ? error : new HttpError(401, "UNAUTHENTICATED", "Your session has expired. Sign in again.")); }
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[config.cookieNames.access] ?? req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) { next(); return; }
  authenticate(req, res, next);
}

export function allowRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, "UNAUTHENTICATED", "Sign in to continue."));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "FORBIDDEN", "You do not have access to this action."));
    next();
  };
}

