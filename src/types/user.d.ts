import "express";
export interface User {
    name: string,
    company_name: string | null,
    email: string;
    password: string;
    role: "business" | "personal";
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
      role: "business" | "personal";
      company_name?: string | null;
    }
  }