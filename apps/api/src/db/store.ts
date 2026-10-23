import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { config } from "../config.js";
import { models } from "./models.js";

type Row = { id: string };
type State = Record<string, Row[]>;
const statePath = path.join(config.root, "data", "dev-store.json");
let localState: State = {};
let localMode = config.demoMode;
const lockPath = path.join(config.root, "data", "dev-store.lock");

async function readLocalFile(): Promise<State> {
  try { return JSON.parse(await fs.readFile(statePath, "utf8")) as State; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return {}; throw error; }
}

async function withLocalLock<T>(operation: () => Promise<T> | T): Promise<T> {
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  let handle: Awaited<ReturnType<typeof fs.open>> | undefined;
  const deadline = Date.now() + 10000;
  while (!handle) {
    try { handle = await fs.open(lockPath, "wx"); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try {
        const stat = await fs.stat(lockPath);
        if (Date.now() - stat.mtimeMs > 30000) { await fs.rm(lockPath, { force: true }); continue; }
      } catch { continue; }
      if (Date.now() >= deadline) throw new Error("Timed out waiting for the local demo store lock.");
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  try {
    localState = await readLocalFile();
    const result = await operation();
    const temp = `${statePath}.${process.pid}.tmp`;
    await fs.writeFile(temp, JSON.stringify(localState, null, 2), "utf8");
    await fs.rename(temp, statePath);
    return result;
  } finally {
    await handle.close().catch(() => undefined);
    await fs.rm(lockPath, { force: true }).catch(() => undefined);
  }
}

export async function connectDatabase() {
  if (config.nodeEnv === "production" && !config.mongoUri) throw new Error("MONGODB_URI is required in production.");
  localMode = config.demoMode || !config.mongoUri;
  if (localMode) {
    localState = await readLocalFile();
    console.info("Database: local JSON demo store", statePath);
    return;
  }
  await mongoose.connect(config.mongoUri!, { serverSelectionTimeoutMS: 5000 });
  await Promise.all(Object.values(models).map((model) => model.createCollection().catch(() => undefined)));
  await Promise.all(Object.values(models).map((model) => model.syncIndexes()));
  console.info("Database: MongoDB", mongoose.connection.name);
}

export const isLocalStore = () => localMode;

export async function all<T = Row>(collection: string): Promise<T[]> {
  if (localMode) { localState = await readLocalFile(); return [...(localState[collection] ?? [])] as unknown as T[]; }
  const docs = await mongoose.connection.db!.collection(collection).find({}).toArray();
  return docs.map((doc) => ({ ...doc, id: String(doc.id ?? doc._id) }) as unknown as T);
}

export async function get<T = Row>(collection: string, id: string): Promise<T | undefined> {
  if (localMode) { localState = await readLocalFile(); return (localState[collection] ?? []).find((item) => item.id === id) as unknown as T | undefined; }
  const doc = await mongoose.connection.db!.collection(collection).findOne({ _id: id } as never);
  return doc ? ({ ...doc, id: String(doc.id ?? doc._id) } as unknown as T) : undefined;
}

export async function insert<T extends Row>(collection: string, row: T): Promise<T> {
  if (localMode) {
    return withLocalLock(() => {
      const list = localState[collection] ?? [];
      if (list.some((entry) => entry.id === row.id)) throw new Error("Duplicate record id");
      localState[collection] = [...list, row];
      return row;
    });
  }
  await mongoose.connection.db!.collection(collection).insertOne({ ...row, _id: row.id } as never);
  return row;
}

export async function update<T extends Row>(collection: string, id: string, patch: Partial<T>): Promise<T | undefined> {
  if (localMode) {
    return withLocalLock(() => {
      const list = localState[collection] ?? [];
      const index = list.findIndex((entry) => entry.id === id);
      if (index < 0) return undefined;
      const next = { ...list[index], ...patch } as T;
      list[index] = next;
      localState[collection] = list;
      return next;
    });
  }
  await mongoose.connection.db!.collection(collection).updateOne({ _id: id } as never, { $set: patch } as never);
  return get<T>(collection, id);
}

export async function remove(collection: string, id: string) {
  if (localMode) {
    await withLocalLock(() => { localState[collection] = (localState[collection] ?? []).filter((entry) => entry.id !== id); });
    return;
  }
  await mongoose.connection.db!.collection(collection).deleteOne({ _id: id } as never);
}

export async function clearCollection(collection: string) {
  if (localMode) { await withLocalLock(() => { localState[collection] = []; }); return; }
  await mongoose.connection.db!.collection(collection).deleteMany({});
}
