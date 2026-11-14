import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Audit log helper - inline to avoid circular dependency
async function logAuthAudit(
  action: "LOGIN" | "LOGOUT" | "LOGIN_FAILED",
  email?: string,
  userId?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        resource: "Authentication",
        userId,
        userEmail: email,
        description: `User ${action.toLowerCase().replace("_", " ")}`,
      },
    });
  } catch {
    // Don't break auth if audit fails
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Note: Using JWT strategy with Credentials provider, so no adapter needed
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes - HIPAA compliant session timeout
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { clinic: true },
        });

        if (!user || !user.password) {
          // Log failed login attempt
          await logAuthAudit("LOGIN_FAILED", email);
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          // Log failed login attempt
          await logAuthAudit("LOGIN_FAILED", email, user.id);
          return null;
        }

        // Log successful login
        await logAuthAudit("LOGIN", email, user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clinicId: user.clinicId,
          clinicName: user.clinic?.name || null,
        };
      },
    }),
  ],
  events: {
    async signOut(message) {
      // Log logout event
      if ("token" in message && message.token?.email) {
        await logAuthAudit("LOGOUT", message.token.email as string, message.token.id as string);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clinicId = user.clinicId;
        token.clinicName = user.clinicName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || "";
        session.user.role = token.role || "STAFF";
        session.user.clinicId = token.clinicId || null;
        session.user.clinicName = token.clinicName || null;
      }
      return session;
    },
  },
});
