import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher(["/client", "/api/:path*"]);

// Organization roles you want to support
const allowedRoles = ["admin", "member"];

export default clerkMiddleware((auth, req) => {
  const { nextUrl } = req;

  if (isProtectedRoute(req)) {
    const { orgId, orgRole, userId } = auth();

    // Ensure the user is authenticated
    if (!userId) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl.origin));
    }

    // Ensure the user belongs to an organization
    if (!orgId || !orgRole) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl.origin));
    }

    // Ensure the user's role is allowed
    if (!allowedRoles.includes(orgRole)) {
      return NextResponse.redirect(new URL("/forbidden", nextUrl.origin));
    }

   
    const response = NextResponse.next();
    response.headers.set("x-org-id", orgId);
    response.headers.set("x-org-role", orgRole);
    return response;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)", 
    "/", 
    "/(api|trpc)(.*)",
  ],
};