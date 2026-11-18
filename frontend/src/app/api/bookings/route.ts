
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ACCESS_COOKIE_NAME = "njirani_access";

const ALLOWED_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

type BookingStatus = (typeof ALLOWED_STATUSES)[number];

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const requestUrl = new URL(request.url);

    const pageParam = requestUrl.searchParams.get("page") ?? "1";
    const limitParam = requestUrl.searchParams.get("limit") ?? "10";
    const statusParam = requestUrl.searchParams.get("status");

    const page = Number(pageParam);
    const limit = Number(limitParam);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 50
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid pagination parameters",
        },
        { status: 400 }
      );
    }

    if (
      statusParam &&
      !ALLOWED_STATUSES.includes(statusParam as BookingStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid booking status",
        },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.BACKEND_URL ?? "http://localhost:3000";

    const backendQuery = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (statusParam) {
      backendQuery.set("status", statusParam);
    }

    const backendResponse = await fetch(
      `${backendUrl}/api/v1/bookings?${backendQuery.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const responseText = await backendResponse.text();

    let responseBody: unknown;

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The booking service returned an invalid response",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(responseBody, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve bookings",
      },
      { status: 502 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.BACKEND_URL ?? "http://localhost:3000";

    const backendResponse = await fetch(
      `${backendUrl}/api/v1/bookings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const responseText = await backendResponse.text();

    let responseBody: unknown;

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The booking service returned an invalid response",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(responseBody, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to create booking",
      },
      { status: 502 }
    );
  }
}