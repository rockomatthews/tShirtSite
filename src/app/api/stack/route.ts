import { StackHandler } from "@stackframe/stack-next/server";
import { stackServerApp } from "@/lib/stack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = StackHandler(stackServerApp);
export { handler as GET, handler as POST };


