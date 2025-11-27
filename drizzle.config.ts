import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// Load local env first (falls back to .env)
config({ path: ".env.local" });
config();

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://localhost:5432/workflow",
  },
} satisfies Config;
