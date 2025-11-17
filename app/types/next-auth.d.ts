/* eslint-disable */
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      userId?: string;
      email?: string | null;
      name?: string | null;
      role?: string | null;
      profileImage?: string | null;
      accessRoutes?: string[];
    };

    accessToken?: string;
    refreshToken?: string;
    message?: string;
    success?: boolean;
    statusCode?: number;
    role?: string;
  }

  interface User {
    userId?: string;
    email?: string;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    profileImage?: string;
    accessRoutes?: string[]; 
    message?: string;
    success?: boolean;
    statusCode?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    email?: string;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    profileImage?: string;
    accessRoutes?: string[]; 
    message?: string;
    success?: boolean;
    statusCode?: number;
  }
}
