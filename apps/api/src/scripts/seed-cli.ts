import { seedDemoData } from "./seed.js";
seedDemoData(true)
  .then(() => {
    console.log("Seed completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
