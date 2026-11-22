
import "server-only";

import { cookies } from "next/headers";

export type UserRole = "RESIDENT" | "PROVIDER" | "ADMIN";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  estateId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthMeResponse {
  success: boolean;
  data?: {
    user?: AuthenticatedUser;
  };
}


export type CurrentUserResult =
  | {
      status: "authenticated";
      user: AuthenticatedUser;
    }
  | {
      status: "unauthenticated";
    }
  | {
      status: "unavailable";
    };

const ACCESS_COOKIE_NAME = "njirani_access";

export async function getCurrentUserResult(): Promise<CurrentUserResult> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

    if (!accessToken) {
      return { status: "unauthenticated" };
    }

    const backendUrl =
      process.env.BACKEND_URL ?? "http://localhost:3000";

    const response = await fetch(`${backendUrl}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      return { status: "unauthenticated" };
    }

    if (!response.ok) {
      return { status: "unavailable" };
    }

    const result = (await response.json()) as AuthMeResponse;

    if (
      result.success !== true ||
      !result.data?.user
    ) {
      return { status: "unavailable" };
    }

    return {
      status: "authenticated",
      user: result.data.user,
    };
  } catch {
    return { status: "unavailable" };
  }
}

// Backward-compatible helper for existing server pages.
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const result = await getCurrentUserResult();

  return result.status === "authenticated" ? result.user : null;
}