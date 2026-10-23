import "../config.js";
import bcrypt from "bcryptjs";
import { connectDatabase, all, insert } from "../db/store.js";
import { id, now } from "../utils/ids.js";

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password || password.length < 14) throw new Error("Set ADMIN_BOOTSTRAP_EMAIL and a unique ADMIN_BOOTSTRAP_PASSWORD of at least 14 characters before running this command.");
  await connectDatabase();
  if ((await all<{ email: string } & { id: string }>("users")).some((user) => user.email === email)) throw new Error("An account already exists for this email.");
  await insert("users", { id: id(), email, name: "Platform administrator", passwordHash: await bcrypt.hash(password, 12), role: "ADMIN", createdAt: now() });
  console.info(`Administrator created for ${email}. Remove the bootstrap password from the environment after use.`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
