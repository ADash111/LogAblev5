import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  role: text("role"),
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""),
  dateOfBirth: text("date_of_birth"),
  heightCm: real("height_cm"),
  weightKg: real("weight_kg"),
  conditions: text("conditions"),
  qualifications: text("qualifications"),
  specialty: text("specialty"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const doctorPatientsTable = pgTable("doctor_patients", {
  id: serial("id").primaryKey(),
  doctorClerkId: text("doctor_clerk_id").notNull(),
  patientClerkId: text("patient_clerk_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type DoctorPatient = typeof doctorPatientsTable.$inferSelect;
