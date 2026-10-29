import { NextResponse } from "next/server";

export async function GET() {
  const backendUrl =
    process.env.BACKEND_URL ?? "http://localhost:3000";

  try {
    const response = await fetch(
      `${backendUrl}/api/providers/categories`,
      { cache: "no-store" },
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
        message: "Unable to load service categories. Please try again.",
      },
      { status: 502 },
    );
  }
}