
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
    const response = await fetch(`${backendUrl}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const responseText = await response.text();

    let responseBody: unknown;

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = {
        success: false,
        message: response.ok
          ? "The server returned an unexpected response."
          : `Registration failed with status ${response.status}.`,
      };
    }

    return NextResponse.json(responseBody, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to reach the server. Please try again shortly.",
      },
      { status: 502 },
    );
  }
}
