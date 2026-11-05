
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ACCESS_COOKIE_NAME = "njirani_access";
const REFRESH_COOKIE_NAME = "njirani_refresh";

const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(_request: NextRequest) {
  const cookieStore = await cookies();

  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  // A refresh token is required to renew the session.
  if (!refreshToken) {
    const response = NextResponse.json(
      {
        success: false,
        message: "Your session has expired. Please sign in again.",
      },
      { status: 401 },
    );

    response.cookies.delete(ACCESS_COOKIE_NAME);
    response.cookies.delete(REFRESH_COOKIE_NAME);

    return response;
  }

  const backendUrl =
    process.env.BACKEND_URL ?? "http://localhost:3000";

  try {
    // Ask the backend to validate and rotate the refresh token.
    const backendResponse = await fetch(`${backendUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    const responseText = await backendResponse.text();

    let result: Record<string, unknown>;

    try {
      result = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The authentication server returned an invalid response.",
        },
        { status: 502 },
      );
    }

    // The backend rejected the refresh token.
    if (!backendResponse.ok || result.success !== true) {
      const message =
        typeof result.message === "string"
          ? result.message
          : "Unable to refresh your session. Please sign in again.";

      const response = NextResponse.json(
        {
          success: false,
          message,
        },
        { status: backendResponse.status },
      );

      // Only clear cookies when the backend rejects the refresh token.
      if (
        backendResponse.status === 401 ||
        backendResponse.status === 403
      ) {
        response.cookies.delete(ACCESS_COOKIE_NAME);
        response.cookies.delete(REFRESH_COOKIE_NAME);
      }

      return response;
    }

    const data = result.data as
      | {
          user?: {
            id?: string;
            name?: string;
            email?: string;
            role?: string;
          };
          accessToken?: string;
          refreshToken?: string;
        }
      | undefined;

    if (
      typeof data?.accessToken !== "string" ||
      !data.accessToken ||
      typeof data.refreshToken !== "string" ||
      !data.refreshToken ||
      !data.user ||
      typeof data.user.id !== "string" ||
      typeof data.user.role !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "The authentication server returned incomplete session data.",
        },
        { status: 502 },
      );
    }

    // Return only safe account information to the browser.
    const response = NextResponse.json({
      success: true,
      data: {
        user: data.user,
      },
      message: "Session refreshed successfully.",
    });

    const secure = process.env.NODE_ENV === "production";

    // Replace the access token cookie.
    response.cookies.set(ACCESS_COOKIE_NAME, data.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    // Replace the refresh token cookie with the rotated token.
    response.cookies.set(REFRESH_COOKIE_NAME, data.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to reach the authentication server. Please try again.",
      },
      { status: 502 },
    );
  }
}
