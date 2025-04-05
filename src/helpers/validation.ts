import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string().email("Invalid email format"),
    // password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
})

export const validatePassword = (password: string): any => {
    if (password.length < 8) {
        return "Password must be at least 8 characters long.";
      }
    
      if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return "Password must contain at least one lowercase letter, one uppercase letter, and one number";
      }
    
    //   if (!/[A-Z]/.test(password)) {
    //     return "Password must contain at least one uppercase letter.";
    //   }
    
    //   if (!/[0-9]/.test(password)) {
    //     return "Password must contain at least one number.";
    //   }
    
      // if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)) {
      //   return "Password must contain at least one special character.";
      // }
    
      return null; // valid
}