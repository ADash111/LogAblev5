import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const medicationsTable = pgTable("medications", {
  id: serial("id").primaryKey(),
  patientClerkId: text("patient_clerk_id").notNull(),
  doctorClerkId: text("doctor_clerk_id").notNull(),
  medicationName: text("medication_name").notNull(),
  dosage: text("dosage"),
  frequency: text("frequency"),
  timeToTake: text("time_to_take"),
  conditionInfo: text("condition_info"),
  additionalInfo: text("additional_info"),
  isCurrent: boolean("is_current").notNull().default(true),
  prescribedAt: timestamp("prescribed_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMedicationSchema = createInsertSchema(medicationsTable).omit({ id: true, prescribedAt: true, updatedAt: true });
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medicationsTable.$inferSelect;
