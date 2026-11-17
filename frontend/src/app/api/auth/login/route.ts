
import { handleRoleLogin } from "@/lib/auth-login";

export async function POST(request: Request) {
  return handleRoleLogin(request, "PROVIDER");
}





