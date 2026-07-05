import { email, z } from "zod";

const nameRegex = /^[A-Za-z]+$/;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(30, "First name cannot exceed 30 characters")
      .regex(nameRegex, "First name can only contain letters"),
    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(30, "Last name cannot exceed 30 characters")
      .regex(nameRegex, "Last name can only contain letters"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    dateOfBirth: z.coerce.date({
      message: "Date of birth is required",
    }),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      const today = new Date();
      const dob = new Date(data.dateOfBirth);

      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
      ) {
        age--;
      }

      return age >= 18;
    },
    {
      message: "You must be at least 18 years old",
      path: ["dateOfBirth"],
    },
  );

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
