import { z } from "zod";

const nameRegex = /^[A-Za-z]+$/;

const calculateAge = (dob) => {
  const today = new Date();
  const birthDate = new Date(dob);

  let age = today.getFullYear() - birthDate.getFullYear();

  const month = today.getMonth() - birthDate.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(30, "First name cannot exceed 30 characters")
      .regex(nameRegex, "Only alphabets are allowed"),

    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(30, "Last name cannot exceed 30 characters")
      .regex(nameRegex, "Only alphabets are allowed"),

    email: z
      .email("Please enter a valid email address")
      .transform((email) => email.toLowerCase()),

    dateOfBirth: z
      .string()
      .min(1, "Date of Birth is required")
      .refine((value) => calculateAge(value) >= 13, {
        message: "You must be at least 13 years old",
      }),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(50, "Password cannot exceed 50 characters"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
