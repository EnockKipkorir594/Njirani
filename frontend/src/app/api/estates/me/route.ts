import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ACCESS_COOKIE_NAME = "njirani_access";

export async function PATCH(request: NextRequest) {
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
                message: "Invalid request body",
            },
            { status: 400 }
        );
    }

    // Accept exactly one client-controlled field: estateId.
    if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body)
    ) {
        return NextResponse.json(
            {
                success: false,
                message: "Invalid request body",
            },
            { status: 400 }
        );
    }

    const assignment = body as Record<string, unknown>;

    const isValidEstateId =
        typeof assignment.estateId === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            assignment.estateId
        );

    if (
        Object.keys(assignment).length !== 1 ||
        !isValidEstateId
    ) {
        return NextResponse.json(
            {
                success: false,
                message: "A valid estateId is required",
            },
            { status: 400 }
        );
    }

    const backendUrl =
        process.env.BACKEND_URL ?? "http://localhost:3000";

    try {
        const backendResponse = await fetch(
            `${backendUrl}/estates/me`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    estateId: assignment.estateId,
                }),
                cache: "no-store",
            }
        );

        const responseText = await backendResponse.text();

        try {
            const result = JSON.parse(responseText);

            return NextResponse.json(result, {
                status: backendResponse.status,
            });
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message: "The estates server returned an invalid response",
                },
                { status: 502 }
            );
        }
    } catch {
        return NextResponse.json(
            {
                success: false,
                message: "Unable to connect to the estates server",
            },
            { status: 502 }
        );
    }
}