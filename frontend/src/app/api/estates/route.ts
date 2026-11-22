import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const page = searchParams.get("page") ?? "1";
    const limit = searchParams.get("limit") ?? "20";
    const search = searchParams.get("search")?.trim() ?? "";

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
        !Number.isInteger(parsedPage) ||
        parsedPage < 1 ||
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 50
    ) {
        return NextResponse.json(
            {
                success: false,
                message: "Invalid pagination parameters",
            },
            { status: 400 }
        );
    }

    const backendUrl =
        process.env.BACKEND_URL ?? "http://localhost:3000";

    const query = new URLSearchParams({
        page,
        limit,
    });

    if (search) {
        query.set("search", search);
    }

    try {
        const backendResponse = await fetch(
            `${backendUrl}/estates/list?${query.toString()}`,
            {
                method: "GET",
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