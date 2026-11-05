
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

const ACCESS_COOKIE_NAME = "njirani_access";

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    // Read the HTTP-only access token on the server.
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

    if (!accessToken) {
      return null;
    }

    const backendUrl =
      process.env.BACKEND_URL ?? "http://localhost:3000";

    // Ask the backend to validate the token and retrieve the user.
    const response = await fetch(`${backendUrl}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as AuthMeResponse;

    if (
      result.success !== true ||
      !result.data?.user
    ) {
      return null;
    }

    return result.data.user;
  } catch {
    return null;
  }
}
