import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/about(.*)",
  "/auth/signin(.*)",
  "/auth/signup(.*)",
  "/api/webhook(.*)"
]);

export default clerkMiddleware(
  async (auth, req) => {
    // Only protect routes that are NOT public
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
    // For public routes—nothing else needed.
  }
);

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/(api|trpc)(.*)"
  ],
};
