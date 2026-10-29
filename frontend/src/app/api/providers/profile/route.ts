import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("njirani_access")?.value;

  if (!accessToken) {
    return NextResponse.json(
      {
        success: false,
        message: "Your session has expired. Please sign in again.",
      },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request body.",
      },
      { status: 400 },
    );
  }

  const backendUrl =
    process.env.BACKEND_URL ?? "http://localhost:3000";

  try {
    const response = await fetch(
      `${backendUrl}/api/providers/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const responseText = await response.text();

    let responseBody: unknown;

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The server returned an unexpected response.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(responseBody, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to reach the server. Please try again.",
      },
      { status: 502 },
    );
  }
}