#!/usr/bin/env node
/**
 * Backfill team data so we can add NOT NULL team_id columns without truncating data.
 *
 * Steps:
 * 1) Ensures teams and team_members tables exist.
 * 2) Adds nullable team_id columns to workflows and integrations if missing.
 * 3) Creates a personal team + membership for any user without one.
 * 4) Backfills team_id on workflows and integrations from each user's team.
 * 5) Enforces NOT NULL and foreign keys on team_id columns.
 *
 * Run once before `pnpm db:push` to avoid data-loss prompts.
 */
const path = require("node:path");
const dotenv = require("dotenv");
const postgres = require("postgres");
const { nanoid } = require("nanoid");

// Load .env.local first, then .env
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "[backfill] DATABASE_URL is not set. Please add it to .env.local before running."
  );
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function ensureTables() {
  await sql`
    create table if not exists teams (
      id text primary key,
      name text not null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `;

  await sql`
    create table if not exists team_members (
      id text primary key,
      team_id text not null,
      user_id text not null,
      role text not null default 'member',
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `;

  await sql`
    create unique index if not exists team_members_team_id_user_id_unique
      on team_members (team_id, user_id)
  `;
}

async function ensureColumns() {
  await sql`alter table workflows add column if not exists team_id text`;
  await sql`alter table integrations add column if not exists team_id text`;
}

async function ensureForeignKeys() {
  // Helper to add FK if missing
  async function addFkIfMissing(table, constraintName) {
    const [{ exists }] =
      await sql`select exists (select 1 from information_schema.table_constraints where constraint_name = ${constraintName})`;

    if (exists) {
      return;
    }

    if (table === "workflows") {
      await sql`alter table workflows add constraint workflows_team_id_teams_id_fk foreign key (team_id) references teams(id)`;
    } else if (table === "integrations") {
      await sql`alter table integrations add constraint integrations_team_id_teams_id_fk foreign key (team_id) references teams(id)`;
    } else if (table === "team_members_team_fk") {
      await sql`alter table team_members add constraint team_members_team_id_teams_id_fk foreign key (team_id) references teams(id)`;
    } else if (table === "team_members_user_fk") {
      await sql`alter table team_members add constraint team_members_user_id_users_id_fk foreign key (user_id) references users(id)`;
    }
  }

  await addFkIfMissing(
    "team_members_team_fk",
    "team_members_team_id_teams_id_fk"
  );
  await addFkIfMissing(
    "team_members_user_fk",
    "team_members_user_id_users_id_fk"
  );
  await addFkIfMissing("workflows", "workflows_team_id_teams_id_fk");
  await addFkIfMissing("integrations", "integrations_team_id_teams_id_fk");
}

async function backfillTeams() {
  const users = await sql`select id, name from users`;

  for (const user of users) {
    const [membership] = await sql`
      select tm.id, tm.team_id
      from team_members tm
      where tm.user_id = ${user.id}
      limit 1
    `;

    if (membership) {
      continue;
    }

    const teamId = nanoid();
    const teamName = user.name
      ? `${user.name.split(" ")[0]}'s Team`
      : "Personal Team";

    await sql.begin(async (trx) => {
      await trx`
        insert into teams (id, name)
        values (${teamId}, ${teamName})
        on conflict (id) do nothing
      `;

      await trx`
        insert into team_members (id, team_id, user_id, role)
        values (${nanoid()}, ${teamId}, ${user.id}, 'owner')
        on conflict do nothing
      `;
    });
  }
}

async function backfillTeamIds() {
  await sql.begin(async (trx) => {
    await trx`
      update workflows w
      set team_id = tm.team_id
      from team_members tm
      where tm.user_id = w.user_id and (w.team_id is null or w.team_id = '')
    `;

    await trx`
      update integrations i
      set team_id = tm.team_id
      from team_members tm
      where tm.user_id = i.user_id and (i.team_id is null or i.team_id = '')
    `;

    // Safety check: ensure no nulls remain before locking NOT NULL
    const [{ null_workflows }] =
      await trx`select count(*)::int as null_workflows from workflows where team_id is null or team_id = ''`;
    const [{ null_integrations }] =
      await trx`select count(*)::int as null_integrations from integrations where team_id is null or team_id = ''`;

    if (null_workflows > 0 || null_integrations > 0) {
      throw new Error(
        `Backfill incomplete: ${null_workflows} workflows and ${null_integrations} integrations missing team_id`
      );
    }
  });
}

async function enforceNotNull() {
  await sql`alter table workflows alter column team_id set not null`;
  await sql`alter table integrations alter column team_id set not null`;
}

async function main() {
  console.log("[backfill] ensuring tables/columns exist...");
  await ensureTables();
  await ensureColumns();
  await ensureForeignKeys();

  console.log("[backfill] creating teams/memberships where missing...");
  await backfillTeams();

  console.log(
    "[backfill] backfilling team_id on workflows and integrations..."
  );
  await backfillTeamIds();

  console.log("[backfill] enforcing NOT NULL on team_id columns...");
  await enforceNotNull();

  console.log("[backfill] done. You can now run `pnpm db:push` safely.");
}

main()
  .catch((error) => {
    console.error("[backfill] failed:", error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
