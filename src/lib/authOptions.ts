import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { ensureEmailWallet } from "@/lib/crossmint";

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist provider profile on first sign-in
      if (account && profile) {
        const p: any = profile;
        token.email = (token.email as any) || p.email || token.email;
        token.name = (token.name as any) || p.name || token.name;
        token.picture = (token.picture as any) || p.picture || (p.image as any) || token.picture;
      }
      // Do not query DB in jwt callback; rely on provider profile and signIn upsert
      return token;
    },
    async session({ session, token }) {
      (session as any).userId = (token as any).uid || token.sub || (session as any).userId;
      if (session.user) {
        if (token.name) session.user.name = token.name as any;
        if ((token as any).picture) session.user.image = (token as any).picture as any;
        if (token.email) session.user.email = token.email as any;
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      try {
        const u: any = (message as any)?.user ?? {};
        const email: string | undefined = u?.email;
        if (email) {
          await ensureEmailWallet({ email });
          // Ensure our User row exists/updates on each sign-in (Data API first, then driver)
          const name = u?.name ?? null;
          const image = (u?.image ?? u?.picture ?? null) as any;
          try {
            const { dataApiAvailable, dataApiUpsertUserByEmail } = await import("@/lib/dataApi");
            if (await dataApiAvailable()) {
              await dataApiUpsertUserByEmail(email, name, image);
            } else {
              const { getSql } = await import("@/lib/neon");
              const sql: any = await getSql();
              await sql(
                'INSERT INTO "User" (email, name, image, role) VALUES (lower($1), $2, $3, $4)\n' +
                'ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, image = EXCLUDED.image',
                [email, name, image, 'user']
              );
            }
          } catch {}
        }
      } catch {}
    },
  },
};


