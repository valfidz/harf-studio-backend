import "express";
export interface User {
    name: string,
    company_name: string | null,
    email: string;
    password: string;
    role: "admin" | "member";
}

export interface UserPayload {
    name: string;
    company_name?: string | null; // Optional field
    email: string;
    role: string;
}

declare module "express" {
    interface UserToken {
      xata_id: string;
      name: string;
      email: string;
      role: "admin" | "member";
      company_name?: string | null;
    }
  }