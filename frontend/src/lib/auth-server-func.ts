import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/lib/auth-middleware";

// Server function that automatically includes auth middleware
export const getUserDetails = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // context.user is now available and type-safe
    return context?.user;
  });

// Example: Protected server function for workflows
export const getProtectedWorkflows = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const user = context?.user;
    if (!user) {
      throw new Error('Unauthorized');
    }
    
    // Your workflow logic here
    // This automatically has authentication via the middleware
    return { workflows: [], user };
  });

