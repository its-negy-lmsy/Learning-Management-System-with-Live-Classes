import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { all, get, insert, update } from "../db/store.js";
import { id, now } from "../utils/ids.js";
import { asyncRoute, HttpError } from "../utils/http.js";
import { authenticate, clearAuthCookies, hashToken, issueAccessToken, makeRefreshToken, setAuthCookies, type AuthUser } from "../utils/auth.js";
import { config } from "../config.js";

type UserRecord = AuthUser & { passwordHash: string; createdAt: string };
type Session = { id: string; userId: string; tokenHash: string; expiresAt: string; revokedAt?: string };
const registerInput = z.object({ name: z.string().trim().min(2).max(80), email: z.email().max(200), password: z.string().min(12).max(128) });
const loginInput = z.object({ email: z.email(), password: z.string().min(1).max(128) });

async function createSession(user: UserRecord, res: Parameters<typeof setAuthCookies>[0]) {
  const refresh = makeRefreshToken();
  await insert<Session>("sessions", { id: id(), userId: user.id, tokenHash: hashToken(refresh), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() });
  const safeUser: AuthUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  setAuthCookies(res, issueAccessToken(safeUser), refresh);
  return safeUser;
}

export const authRouter = Router();

authRouter.post("/register", asyncRoute(async (req, res) => {
  const input = registerInput.parse(req.body);
  const email = input.email.trim().toLowerCase();
  if ((await all<UserRecord>("users")).some((user) => user.email === email)) throw new HttpError(409, "EMAIL_TAKEN", "An account already exists for this email.");
  const user: UserRecord = { id: id(), name: input.name, email, passwordHash: await bcrypt.hash(input.password, 12), role: "STUDENT", createdAt: now() };
  await insert("users", user);
  res.status(201).json({ user: await createSession(user, res) });
}));

authRouter.post("/login", asyncRoute(async (req, res) => {
  const input = loginInput.parse(req.body);
  const email = input.email.trim().toLowerCase();
  const user = (await all<UserRecord>("users")).find((record) => record.email === email);
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  res.json({ user: await createSession(user, res) });
}));

authRouter.post("/refresh", asyncRoute(async (req, res) => {
  const token = req.cookies?.[config.cookieNames.refresh];
  if (!token) throw new HttpError(401, "SESSION_EXPIRED", "Sign in again to continue.");
  const tokenHash = hashToken(token);
  const session = (await all<Session>("sessions")).find((record) => record.tokenHash === tokenHash && !record.revokedAt && new Date(record.expiresAt).getTime() > Date.now());
  if (!session) { clearAuthCookies(res); throw new HttpError(401, "SESSION_EXPIRED", "Sign in again to continue."); }
  await update<Session>("sessions", session.id, { revokedAt: now() });
  const user = await get<UserRecord>("users", session.userId);
  if (!user) { clearAuthCookies(res); throw new HttpError(401, "SESSION_EXPIRED", "Sign in again to continue."); }
  res.json({ user: await createSession(user, res) });
}));

authRouter.post("/logout", asyncRoute(async (req, res) => {
  const token = req.cookies?.[config.cookieNames.refresh];
  if (token) {
    const session = (await all<Session>("sessions")).find((record) => record.tokenHash === hashToken(token));
    if (session && !session.revokedAt) await update<Session>("sessions", session.id, { revokedAt: now() });
  }
  clearAuthCookies(res);
  res.status(204).end();
}));

authRouter.get("/me", authenticate, (req, res) => res.json({ user: req.user }));
