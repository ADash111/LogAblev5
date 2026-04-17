import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentSlotsTable = pgTable("appointment_slots", {
  id: serial("id").primaryKey(),
  doctorClerkId: text("doctor_clerk_id").notNull(),
  slotDate: text("slot_date").notNull(),
  slotTime: text("slot_time").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientClerkId: text("patient_clerk_id").notNull(),
  doctorClerkId: text("doctor_clerk_id").notNull(),
  requestedDate: text("requested_date").notNull(),
  requestedTime: text("requested_time").notNull(),
  status: text("status").notNull().default("pending"),
  doctorNote: text("doctor_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAppointmentSlotSchema = createInsertSchema(appointmentSlotsTable).omit({ id: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertAppointmentSlot = z.infer<typeof insertAppointmentSlotSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type AppointmentSlot = typeof appointmentSlotsTable.$inferSelect;
export type Appointment = typeof appointmentsTable.$inferSelect;
