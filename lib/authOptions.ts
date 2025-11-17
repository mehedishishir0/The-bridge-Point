



// authOptions.ts
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";

export interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    email: string;
    role: string;
    userId: string;
    user: {
      email: string | undefined;
      _id: string;
      role: string;
      accessRoutes: string[];
    };
  };
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        });

        const data: LoginResponse = await res.json();

        if (!res.ok || !data?.data?.accessToken) return null;

        // ✅ Only admin & superadmin allowed
        if (data.data.user.role !== "admin" && data.data.user.role !== "superadmin") {
          throw new Error("admin_only");
        }

        return {
          id: data.data.user._id,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          email: data.data.user.email,
          role: data.data.user.role,
          accessRoutes: data.data.user.accessRoutes, // ✅ Add accessRoutes here
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.userId = user.id;
        token.email = user.email;
        token.role = user.role;
        token.accessRoutes = user.accessRoutes || []; // ✅ store in token
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        userId: token.userId as string,
        email: token.email as string,
        role: token.role as string,
        accessRoutes: token.accessRoutes || [],
      };
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
