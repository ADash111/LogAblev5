import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, appointmentSlotsTable, appointmentsTable, usersTable, doctorPatientsTable } from "@workspace/db";
import { requireAuth } from "./auth";
import {
  AddAppointmentSlotBody,
  RequestAppointmentBody,
  RespondToAppointmentBody,
  RespondToAppointmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Get my appointments
router.get("/appointments/my-appointments", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user) {
    res.json([]);
    return;
  }

  let appts;
  if (user.role === "doctor") {
    appts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.doctorClerkId, userId));
  } else {
    appts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.patientClerkId, userId));
  }

  // Get all involved user names
  const allClerkIds = new Set<string>();
  appts.forEach(a => { allClerkIds.add(a.patientClerkId); allClerkIds.add(a.doctorClerkId); });

  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.clerkId, u]));

  res.json(appts.map(a => ({
    id: a.id,
    patientId: a.patientClerkId,
    patientName: userMap.get(a.patientClerkId)?.name || "Unknown",
    doctorId: a.doctorClerkId,
    doctorName: userMap.get(a.doctorClerkId)?.name || "Unknown",
    requestedDate: a.requestedDate,
    requestedTime: a.requestedTime,
    status: a.status,
    doctorNote: a.doctorNote,
    createdAt: a.createdAt.toISOString(),
  })));
});

// Get available slots (for patient's doctor)
router.get("/appointments/available-slots", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  // Find the patient's doctor
  const [relationship] = await db
    .select()
    .from(doctorPatientsTable)
    .where(eq(doctorPatientsTable.patientClerkId, userId));

  if (!relationship) {
    res.json([]);
    return;
  }

  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.clerkId, relationship.doctorClerkId));

  const slots = await db
    .select()
    .from(appointmentSlotsTable)
    .where(
      and(
        eq(appointmentSlotsTable.doctorClerkId, relationship.doctorClerkId),
        eq(appointmentSlotsTable.isAvailable, true)
      )
    );

  res.json(slots.map(s => ({
    id: s.id,
    doctorId: s.doctorClerkId,
    doctorName: doctor?.name || "Unknown",
    slotDate: s.slotDate,
    slotTime: s.slotTime,
    isAvailable: s.isAvailable,
    createdAt: s.createdAt.toISOString(),
  })));
});

// Add appointment slot (doctor only)
router.post("/appointments/slots", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || user.role !== "doctor") {
    res.status(403).json({ error: "Forbidden - not a doctor" });
    return;
  }

  const parsed = AddAppointmentSlotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check for duplicate
  const [existing] = await db
    .select()
    .from(appointmentSlotsTable)
    .where(
      and(
        eq(appointmentSlotsTable.doctorClerkId, userId),
        eq(appointmentSlotsTable.slotDate, parsed.data.slotDate),
        eq(appointmentSlotsTable.slotTime, parsed.data.slotTime)
      )
    );

  if (existing) {
    res.status(400).json({ error: "This time slot already exists" });
    return;
  }

  const [slot] = await db
    .insert(appointmentSlotsTable)
    .values({
      doctorClerkId: userId,
      slotDate: parsed.data.slotDate,
      slotTime: parsed.data.slotTime,
    })
    .returning();

  res.status(201).json({
    id: slot.id,
    doctorId: slot.doctorClerkId,
    doctorName: user.name,
    slotDate: slot.slotDate,
    slotTime: slot.slotTime,
    isAvailable: slot.isAvailable,
    createdAt: slot.createdAt.toISOString(),
  });
});

// Request appointment (patient only)
router.post("/appointments/request", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || user.role !== "patient") {
    res.status(403).json({ error: "Forbidden - not a patient" });
    return;
  }

  const parsed = RequestAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Find the patient's doctor
  const [relationship] = await db
    .select()
    .from(doctorPatientsTable)
    .where(eq(doctorPatientsTable.patientClerkId, userId));

  if (!relationship) {
    res.status(400).json({ error: "You don't have a doctor assigned yet" });
    return;
  }

  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.clerkId, relationship.doctorClerkId));

  const [appt] = await db
    .insert(appointmentsTable)
    .values({
      patientClerkId: userId,
      doctorClerkId: relationship.doctorClerkId,
      requestedDate: parsed.data.requestedDate,
      requestedTime: parsed.data.requestedTime,
      status: "pending",
    })
    .returning();

  res.status(201).json({
    id: appt.id,
    patientId: appt.patientClerkId,
    patientName: user.name,
    doctorId: appt.doctorClerkId,
    doctorName: doctor?.name || "Unknown",
    requestedDate: appt.requestedDate,
    requestedTime: appt.requestedTime,
    status: appt.status,
    doctorNote: appt.doctorNote,
    createdAt: appt.createdAt.toISOString(),
  });
});

// Get appointment requests (doctor only)
router.get("/appointments/requests", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || user.role !== "doctor") {
    res.status(403).json({ error: "Forbidden - not a doctor" });
    return;
  }

  const pending = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.doctorClerkId, userId),
        eq(appointmentsTable.status, "pending")
      )
    );

  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.clerkId, u]));

  res.json(pending.map(a => ({
    id: a.id,
    patientId: a.patientClerkId,
    patientName: userMap.get(a.patientClerkId)?.name || "Unknown",
    doctorId: a.doctorClerkId,
    doctorName: user.name,
    requestedDate: a.requestedDate,
    requestedTime: a.requestedTime,
    status: a.status,
    doctorNote: a.doctorNote,
    createdAt: a.createdAt.toISOString(),
  })));
});

// Cancel an appointment (patient or doctor — for pending or accepted)
router.delete("/appointments/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [appt] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, id));

  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  if (appt.patientClerkId !== userId && appt.doctorClerkId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(appointmentsTable).where(eq(appointmentsTable.id, id));
  res.status(204).end();
});

// Respond to appointment request (doctor only)
router.post("/appointments/:id/respond", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || user.role !== "doctor") {
    res.status(403).json({ error: "Forbidden - not a doctor" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const parsed = RespondToAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [appt] = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.id, id),
        eq(appointmentsTable.doctorClerkId, userId)
      )
    );

  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  const [updated] = await db
    .update(appointmentsTable)
    .set({
      status: parsed.data.status,
      doctorNote: parsed.data.doctorNote ?? null,
    })
    .where(eq(appointmentsTable.id, id))
    .returning();

  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.clerkId, u]));

  res.json({
    id: updated.id,
    patientId: updated.patientClerkId,
    patientName: userMap.get(updated.patientClerkId)?.name || "Unknown",
    doctorId: updated.doctorClerkId,
    doctorName: user.name,
    requestedDate: updated.requestedDate,
    requestedTime: updated.requestedTime,
    status: updated.status,
    doctorNote: updated.doctorNote,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
