import { randomUUID } from "node:crypto";
export const id = () => randomUUID();
export const now = () => new Date().toISOString();
export const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
