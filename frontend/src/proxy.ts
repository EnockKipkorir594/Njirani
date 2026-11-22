// frontend/src/proxy.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE_NAME = "njirani_access";
const REFRESH_COOKIE_NAME = "njirani_refresh";

const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

const BACKEND_URL =
  process.env.BACKEND_URL ?? "http://localhost:3000";

interface AuthUser {
  id: string;
  role: string;
  estateId: string | null;
}

interface AuthMeResponse {
  success: boolean;
  data?: {
    user?: AuthUser;
  };
}

interface RefreshResponse {
  success: boolean;
  data?: {
    user?: AuthUser;
    accessToken?: string;
    refreshToken?: string;
  };
}

interface RefreshedSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

type AuthCheckResult =
  | { kind: "authenticated"; user: AuthUser }
  | { kind: "unauthorized" }
  | { kind: "unavailable" };

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.id === "string" &&
    typeof user.role === "string" &&
    (typeof user.estateId === "string" || user.estateId === null)
  );
}

async function getUserFromAccessToken(
  accessToken: string,
): Promise<AuthCheckResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      return { kind: "unauthorized" };
    }

    if (!response.ok) {
      return { kind: "unavailable" };
    }

    const result = (await response.json()) as AuthMeResponse;

    if (result.success !== true || !isAuthUser(result.data?.user)) {
      return { kind: "unavailable" };
    }

    return {
      kind: "authenticated",
      user: result.data.user,
    };
  } catch {
    return { kind: "unavailable" };
  }
}

async function refreshSession(
  refreshToken: string,
): Promise<
  | { kind: "refreshed"; session: RefreshedSession }
  | { kind: "unauthorized" }
  | { kind: "unavailable" }
> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      return { kind: "unauthorized" };
    }

    if (!response.ok) {
      return { kind: "unavailable" };
    }

    const result = (await response.json()) as RefreshResponse;
    const data = result.data;

    if (
      result.success !== true ||
      !isAuthUser(data?.user) ||
      typeof data?.accessToken !== "string" ||
      !data.accessToken ||
      typeof data.refreshToken !== "string" ||
      !data.refreshToken
    ) {
      return { kind: "unavailable" };
    }

    return {
      kind: "refreshed",
      session: {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
    };
  } catch {
    return { kind: "unavailable" };
  }
}

function applySessionCookies(
  response: NextResponse,
  session: RefreshedSession,
): void {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_COOKIE_NAME, session.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, session.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

function redirectTo(
  request: NextRequest,
  pathname: string,
  session?: RefreshedSession,
): NextResponse {
  const destination = request.nextUrl.clone();
  destination.pathname = pathname;
  destination.search = "";

  const response = NextResponse.redirect(destination);

  if (session) {
    applySessionCookies(response, session);
  }

  return response;
}

function redirectToLogin(request: NextRequest): NextResponse {
  const response = redirectTo(request, "/resident/login");

  response.cookies.delete(ACCESS_COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);

  return response;
}

function serviceUnavailable(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message:
        "We cannot verify your session right now. Please try again shortly.",
    },
    { status: 503 },
  );
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  let user: AuthUser;
  let refreshedSession: RefreshedSession | undefined;

  if (accessToken) {
    const authResult = await getUserFromAccessToken(accessToken);

    if (authResult.kind === "authenticated") {
      user = authResult.user;
    } else if (authResult.kind === "unavailable") {
      return serviceUnavailable();
    } else {
      // The access token was rejected. Try the existing refresh token.
      if (!refreshToken) {
        return redirectToLogin(request);
      }

      const refreshResult = await refreshSession(refreshToken);

      if (refreshResult.kind === "unauthorized") {
        return redirectToLogin(request);
      }

      if (refreshResult.kind === "unavailable") {
        return serviceUnavailable();
      }

      refreshedSession = refreshResult.session;
      user = refreshedSession.user;
    }
  } else {
    // No access token. A refresh token may still represent a valid session.
    if (!refreshToken) {
      return redirectToLogin(request);
    }

    const refreshResult = await refreshSession(refreshToken);

    if (refreshResult.kind === "unauthorized") {
      return redirectToLogin(request);
    }

    if (refreshResult.kind === "unavailable") {
      return serviceUnavailable();
    }

    refreshedSession = refreshResult.session;
    user = refreshedSession.user;
  }

  if (user.role !== "RESIDENT") {
    return redirectTo(request, "/", refreshedSession);
  }

  if (!user.estateId) {
    return redirectTo(
      request,
      "/resident/estate-selection",
      refreshedSession,
    );
  }

  const response = NextResponse.next();

  if (refreshedSession) {
    applySessionCookies(response, refreshedSession);
  }

  return response;
}

export const config = {
  matcher: ["/resident/dashboard/:path*"],
};