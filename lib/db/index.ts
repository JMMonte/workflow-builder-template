import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  accounts,
  sessions,
  teamInvites,
  teamMembers,
  teams,
  users,
  verifications,
  workflowExecutionLogs,
  workflowExecutions,
  workflowExecutionsRelations,
  workflows,
} from "./schema";

// Construct schema object for drizzle
const schema = {
  users,
  sessions,
  accounts,
  verifications,
  teams,
  teamMembers,
  workflows,
  workflowExecutions,
  workflowExecutionLogs,
  workflowExecutionsRelations,
  teamInvites,
};

const connectionString =
  process.env.DATABASE_URL || "postgres://localhost:5432/workflow";

// For migrations
export const migrationClient = postgres(connectionString, { max: 1 });

// For queries
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
