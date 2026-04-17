import { pgTable, text, serial, timestamp, boolean, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vitalLogsTable = pgTable("vital_logs", {
  id: serial("id").primaryKey(),
  patientClerkId: text("patient_clerk_id").notNull(),
  heartRate: integer("heart_rate"),
  respirationRate: integer("respiration_rate"),
  systolicBp: integer("systolic_bp"),
  diastolicBp: integer("diastolic_bp"),
  spo2: real("spo2"),
  isCritical: boolean("is_critical").notNull().default(false),
  isDismissed: boolean("is_dismissed").notNull().default(false),
  notes: text("notes"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVitalLogSchema = createInsertSchema(vitalLogsTable).omit({ id: true, loggedAt: true });
export type InsertVitalLog = z.infer<typeof insertVitalLogSchema>;
export type VitalLog = typeof vitalLogsTable.$inferSelect;
