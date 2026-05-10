import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";

const authHandler = withAuth({
  pages: {
    signIn: "/login",
  },
});

export function proxy(request: NextRequest) {
  return authHandler(request as any, {} as any);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
