import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { teamInvites, teams, users } from "./schema";
import { addTeamMemberByEmail } from "./teams";

export type TeamInvite = typeof teamInvites.$inferSelect;
export type TeamInviteWithTeam = TeamInvite & { teamName: string };

function calculateExpiryDate(days = 7): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

export async function upsertTeamInvite(input: {
  teamId: string;
  email: string;
  invitedBy: string;
}): Promise<TeamInvite> {
  const normalizedEmail = input.email.toLowerCase().trim();

  const existing = await db.query.teamInvites.findFirst({
    where: and(
      eq(teamInvites.teamId, input.teamId),
      eq(teamInvites.email, normalizedEmail)
    ),
  });

  const expiresAt = calculateExpiryDate();

  if (existing) {
    const [updated] = await db
      .update(teamInvites)
      .set({
        invitedBy: input.invitedBy,
        status: "pending",
        updatedAt: new Date(),
        expiresAt,
      })
      .where(eq(teamInvites.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(teamInvites)
    .values({
      teamId: input.teamId,
      email: normalizedEmail,
      invitedBy: input.invitedBy,
      status: "pending",
      expiresAt,
    })
    .returning();

  return created;
}

export async function listPendingInvitesForEmail(
  email: string
): Promise<TeamInvite[]> {
  const normalizedEmail = email.toLowerCase().trim();
  return await db.query.teamInvites.findMany({
    where: and(eq(teamInvites.email, normalizedEmail), eq(teamInvites.status, "pending")),
  });
}

export async function listInvitesForTeam(
  teamId: string
): Promise<TeamInvite[]> {
  return await db.query.teamInvites.findMany({
    where: eq(teamInvites.teamId, teamId),
  });
}

export async function getInviteWithTeam(
  inviteId: string
): Promise<TeamInviteWithTeam | null> {
  const [invite] = await db
    .select({
      invite: teamInvites,
      teamName: teams.name,
    })
    .from(teamInvites)
    .innerJoin(teams, eq(teamInvites.teamId, teams.id))
    .where(eq(teamInvites.id, inviteId))
    .limit(1);

  if (!invite) {
    return null;
  }

  return {
    ...invite.invite,
    teamName: invite.teamName,
  };
}

export function isInviteExpired(
  invite: Pick<TeamInvite, "expiresAt">
): boolean {
  return invite.expiresAt ? invite.expiresAt.getTime() < Date.now() : false;
}

export async function acceptPendingInvitesForUser(input: {
  userId: string;
  email: string;
}): Promise<void> {
  const pending = await listPendingInvitesForEmail(input.email);

  if (pending.length === 0) {
    return;
  }

  for (const invite of pending) {
    if (isInviteExpired(invite)) {
      continue;
    }

    await addTeamMemberByEmail(invite.teamId, input.email, "member");

    await db
      .update(teamInvites)
      .set({
        status: "accepted",
        acceptedUserId: input.userId,
        updatedAt: new Date(),
      })
      .where(eq(teamInvites.id, invite.id));
  }
}

export async function getUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  return await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });
}

export async function acceptInviteForUser(input: {
  inviteId: string;
  userId: string;
}): Promise<
  | {
      ok: true;
      teamId: string;
      teamName: string;
      email: string;
      status: "accepted" | "already-member";
    }
  | {
      ok: false;
      reason: "not-found" | "invalid-email" | "expired";
    }
> {
  const invite = await getInviteWithTeam(input.inviteId);
  if (!invite || invite.status === "cancelled") {
    return { ok: false, reason: "not-found" };
  }

  if (isInviteExpired(invite)) {
    return { ok: false, reason: "expired" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, input.userId),
  });

  if (!user?.email || user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return { ok: false, reason: "invalid-email" };
  }

  const membership = await addTeamMemberByEmail(
    invite.teamId,
    invite.email,
    "member"
  );

  await db
    .update(teamInvites)
    .set({
      status: "accepted",
      acceptedUserId: input.userId,
      updatedAt: new Date(),
    })
    .where(eq(teamInvites.id, invite.id));

  return {
    ok: true,
    teamId: invite.teamId,
    teamName: invite.teamName,
    email: invite.email,
    status: membership.created ? "accepted" : "already-member",
  };
}
