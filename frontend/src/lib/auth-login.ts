
import "server-only";

import { NextResponse } from "next/server";

type LoginRole = "PROVIDER" | "RESIDENT";

interface LoginResponse {
  success?: unknown;
  message?: unknown;
  error?: unknown;
  data?: {
    user?: {
      id?: string;
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
    };
    accessToken?: string;
    refreshToken?: string;
  };
}

function getErrorMessage(
  result: LoginResponse,
  status: number,
): string {
  const error = result.error;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  if (typeof result.message === "string") {
    return result.message;
  }

  return status === 401
    ? "Invalid email or password."
    : `Login failed (${status}).`;
}

export async function handleRoleLogin(
  request: Request,
  expectedRole: LoginRole,
) {
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

    const responseText = await response.text();

    let result: LoginResponse;

    try {
      result = JSON.parse(responseText) as LoginResponse;
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
      return NextResponse.json(
        {
          success: false,
          message: getErrorMessage(result, response.status),
          error: result.error,
        },
        { status: response.status },
      );
    }

    const data = result.data;

    if (
      !data?.accessToken ||
      !data.refreshToken ||
      !data.user ||
      typeof data.user.role !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "The authentication server returned incomplete credentials.",
        },
        { status: 502 },
      );
    }

    if (data.user.role !== expectedRole) {
      return NextResponse.json(
        {
          success: false,
          message:
            expectedRole === "RESIDENT"
              ? "This login page is for resident accounts."
              : "This login page is for provider accounts.",
        },
        { status: 403 },
      );
    }

    const res = NextResponse.json({
      success: true,
      data: { user: data.user },
      message: "Login successful.",
    });

    const secure = process.env.NODE_ENV === "production";

    res.cookies.set("njirani_access", data.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    res.cookies.set("njirani_refresh", data.refreshToken, {
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

