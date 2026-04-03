import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import db from "@/lib/db";

const isProduction = process.env.NODE_ENV === "production"

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders :{
    google: {
      clientId : process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    },
    github : {
      clientId : process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    },
  },
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:5173"],
  advanced: {
    crossSubDomainCookies: {
      enabled : isProduction,
    },
    defaultCookieAttributes : {
      secure : isProduction,
      sameSite : isProduction ? "none" : "lax"
    }
  }
});