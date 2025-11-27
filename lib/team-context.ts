import { NextResponse } from "next/server";
import { auth } from "./auth";
import type { TeamMember } from "./db/schema";
import {
  ensureUserTeam,
  getTeamMembership,
  type TeamWithRole,
} from "./db/teams";

export const TEAM_HEADER = "x-team-id";

type SuccessResult = {
  ok: true;
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
  team: TeamWithRole;
  membership: TeamMember;
};

type ErrorResult = {
  ok: false;
  response: NextResponse;
};

export type TeamContextResult = SuccessResult | ErrorResult;

/**
 * Resolve the active team for the authenticated user.
 * - Uses x-team-id header or ?teamId query param when provided
 * - Falls back to the user's first team (creating a personal team if needed)
 */
export async function requireTeamContext(
  request: Request
): Promise<TeamContextResult> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { searchParams } = new URL(request.url);
  const requestedTeamId =
    request.headers.get(TEAM_HEADER) ?? searchParams.get("teamId");

  if (requestedTeamId) {
    const membership = await getTeamMembership(
      requestedTeamId,
      session.user.id
    );

    if (!membership) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "You do not have access to this team" },
          { status: 403 }
        ),
      };
    }

    return {
      ok: true,
      session,
      team: { ...membership.team, role: membership.membership.role },
      membership: membership.membership,
    };
  }

  const ensured = await ensureUserTeam(session.user.id);

  return {
    ok: true,
    session,
    team: { ...ensured.team, role: ensured.membership.role },
    membership: ensured.membership,
  };
}
