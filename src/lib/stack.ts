import { StackServerApp } from "@stackframe/stack-next";

export const stackServerApp = new StackServerApp({
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID ?? "",
  clientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ?? "",
  secretKey: process.env.STACK_SECRET_SERVER_KEY ?? "",
  urls: { signIn: "/signin" },
});


