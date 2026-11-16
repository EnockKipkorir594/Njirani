
import { NextResponse } from "next/server";

const ACCESS_COOKIE_NAME = "njirani_access";
const REFRESH_COOKIE_NAME = "njirani_refresh";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logout successful.",
  });

  const secure = process.env.NODE_ENV === "production";

  // Expire the access-token cookie.
  response.cookies.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  // Expire the refresh-token cookie.
  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
