import { seedDemoData } from "./seed.js";
seedDemoData().catch((error) => { console.error(error); process.exitCode = 1; });
