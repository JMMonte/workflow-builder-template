import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "./index";
import {
  type Team,
  type TeamMember,
  teamInvites,
  teamMembers,
  teams,
  users,
} from "./schema";

export type TeamWithRole = Team & { role: "owner" | "member" };

export type TeamMemberWithUser = TeamMember & {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

export type AddTeamMemberResult = {
  member: TeamMemberWithUser;
  created: boolean;
};

/**
 * Get all teams the user belongs to
 */
export async function getTeamsForUser(userId: string): Promise<TeamWithRole[]> {
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      imageUrl: teams.imageUrl,
      icon: teams.icon,
      iconColor: teams.iconColor,
      createdAt: teams.createdAt,
      updatedAt: teams.updatedAt,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId));

  return rows;
}

/**
 * Get a specific team membership for a user
 */
export async function getTeamMembership(
  teamId: string,
  userId: string
): Promise<{ team: Team; membership: TeamMember } | null> {
  const [row] = await db
    .select({
      team: teams,
      membership: teamMembers,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    team: row.team,
    membership: row.membership,
  };
}

/**
 * Create a new team and add the creator as owner
 */
export async function createTeamForUser(
  userId: string,
  name: string,
  data?: {
    icon?: string | null;
    iconColor?: string | null;
    imageUrl?: string | null;
  }
): Promise<{ team: Team; membership: TeamMember }> {
  const [team] = await db
    .insert(teams)
    .values({
      name,
      icon: data?.icon ?? null,
      iconColor: data?.iconColor ?? null,
      imageUrl: data?.imageUrl ?? null,
    })
    .returning();

  const [membership] = await db
    .insert(teamMembers)
    .values({
      teamId: team.id,
      userId,
      role: "owner",
    })
    .returning();

  return { team, membership };
}

/**
 * Ensure the user has at least one team (creates a personal team if none exist)
 */
export async function ensureUserTeam(
  userId: string
): Promise<{ team: Team; membership: TeamMember }> {
  const existingTeams = await getTeamsForUser(userId);

  if (existingTeams.length > 0) {
    const team = existingTeams[0];
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, team.id),
        eq(teamMembers.userId, userId)
      ),
    });

    if (!membership) {
      throw new Error("Team membership missing for existing team");
    }

    return { team, membership };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const defaultName = user?.name
    ? `${user.name.split(" ")[0]}'s Team`
    : "Personal Team";

  return createTeamForUser(userId, defaultName);
}

/**
 * List members of a team (with user details)
 */
export async function listTeamMembers(
  teamId: string
): Promise<TeamMemberWithUser[]> {
  const rows = await db
    .select({
      membership: teamMembers,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId));

  return rows.map((row) => ({
    ...row.membership,
    user: row.user,
  }));
}

/**
 * Add an existing user to a team by email
 */
export async function addTeamMemberByEmail(
  teamId: string,
  email: string,
  role: "owner" | "member" = "member"
): Promise<AddTeamMemberResult> {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Avoid duplicate memberships
  const existingMembership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id)),
  });

  if (existingMembership) {
    return {
      member: {
        ...existingMembership,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      created: false,
    };
  }

  const [membership] = await db
    .insert(teamMembers)
    .values({
      teamId,
      userId: user.id,
      role,
    })
    .returning();

  // Mark any pending invites for this email as accepted
  await db
    .update(teamInvites)
    .set({
      status: "accepted",
      acceptedUserId: user.id,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(teamInvites.teamId, teamId),
        eq(teamInvites.email, normalizedEmail),
        eq(teamInvites.status, "pending")
      )
    );

  return {
    member: {
      ...membership,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
    created: true,
  };
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<boolean> {
  const deleted = await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .returning();

  return deleted.length > 0;
}
