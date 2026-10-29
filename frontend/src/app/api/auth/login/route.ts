
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 },
    );
  }

  const backendUrl =
    process.env.BACKEND_URL ?? "http://localhost:3000";

  try {
    const response = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await response.text();

    let result: Record<string, unknown>;

    try {
      result = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: `The authentication server returned an invalid response (${response.status}).`,
        },
        { status: 502 },
      );
    }

    if (!response.ok || result.success !== true) {
      const message =
        typeof result.error === "object" &&
        result.error !== null &&
        "message" in result.error &&
        typeof result.error.message === "string"
          ? result.error.message
          : typeof result.message === "string"
            ? result.message
            : response.status === 401
              ? "Invalid email or password."
              : `Login failed (${response.status}).`;
    
      return NextResponse.json(
        {
          success: false,
          message,
          error: result.error,
        },
        { status: response.status },
      );
    }

    const data = result.data as
      | {
          user?: { role?: string };
          accessToken?: string;
          refreshToken?: string;
        }
      | undefined;

    if (
      !data?.accessToken ||
      !data.refreshToken ||
      data.user?.role !== "PROVIDER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "The login response is missing required provider credentials.",
        },
        { status: 502 },
      );
    }

    const { accessToken, refreshToken } = data;

    const res = NextResponse.json({
      success: true,
      data: { user: data.user },
      message: "Login successful.",
    });

    const secure = process.env.NODE_ENV === "production";

    res.cookies.set("njirani_access", accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    res.cookies.set("njirani_refresh", refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to reach the server. Please try again shortly.",
      },
      { status: 502 },
    );
  }
}
