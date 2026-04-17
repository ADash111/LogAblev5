import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, medicationsTable, usersTable, doctorPatientsTable } from "@workspace/db";
import { requireAuth } from "./auth";
import { AddMedicationBody, UpdateMedicationBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatMedication(m: any, doctorName: string) {
  return {
    id: m.id,
    patientId: m.patientClerkId,
    doctorId: m.doctorClerkId,
    doctorName,
    medicationName: m.medicationName,
    dosage: m.dosage,
    frequency: m.frequency,
    timeToTake: m.timeToTake,
    conditionInfo: m.conditionInfo,
    additionalInfo: m.additionalInfo,
    isCurrent: m.isCurrent,
    prescribedAt: m.prescribedAt.toISOString(),
  };
}

// Get my medications (patient)
router.get("/medications/my", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const meds = await db
    .select()
    .from(medicationsTable)
    .where(eq(medicationsTable.patientClerkId, userId))
    .orderBy(desc(medicationsTable.prescribedAt));

  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.clerkId, u]));

  const current = meds.filter(m => m.isCurrent).map(m => formatMedication(m, userMap.get(m.doctorClerkId)?.name || "Unknown"));
  const past = meds.filter(m => !m.isCurrent).map(m => formatMedication(m, userMap.get(m.doctorClerkId)?.name || "Unknown"));

  res.json({ current, past });
});

// Get patient medications (doctor only)
router.get("/medications/patient/:patientId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const patientId = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || user.role !== "doctor") {
    res.status(403).json({ error: "Forbidden - not a doctor" });
    return;
  }

  // Verify patient belongs to doctor
  const [relationship] = await db
    .select()
    .from(doctorPatientsTable)
    .where(
      and(
        eq(doctorPatientsTable.doctorClerkId, userId),
        eq(doctorPatientsTable.patientClerkId, patientId)
      )
    );

  if (!relationship) {
    res.status(403).json({ error: "Forbidden - patient not in your care" });
    return;
  }

  const meds = await db
    .select()
    .from(medicationsTable)
    .where(eq(medicationsTable.patientClerkId, patientId))
    .orderBy(desc(medicationsTable.prescribedAt));

  const current = meds.filter(m => m.isCurrent).map(m => formatMedication(m, user.name));
  const past = meds.filter(m => !m.isCurrent).map(m => formatMedication(m, user.name));

  res.json({ current, past });
});

// Add medication (doctor only)
router.post("/medications", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || user.role !== "doctor") {
    res.status(403).json({ error: "Forbidden - not a doctor" });
    return;
  }

  const parsed = AddMedicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Verify patient belongs to doctor
  const [relationship] = await db
    .select()
    .from(doctorPatientsTable)
    .where(
      and(
        eq(doctorPatientsTable.doctorClerkId, userId),
        eq(doctorPatientsTable.patientClerkId, parsed.data.patientId)
      )
    );

  if (!relationship) {
    res.status(403).json({ error: "Forbidden - patient not in your care" });
    return;
  }

  const [med] = await db
    .insert(medicationsTable)
    .values({
      patientClerkId: parsed.data.patientId,
      doctorClerkId: userId,
      medicationName: parsed.data.medicationName,
      dosage: parsed.data.dosage ?? null,
      frequency: parsed.data.frequency ?? null,
      timeToTake: parsed.data.timeToTake ?? null,
      conditionInfo: parsed.data.conditionInfo ?? null,
      additionalInfo: parsed.data.additionalInfo ?? null,
    })
    .returning();

  res.status(201).json(formatMedication(med, user.name));
});

// Update medication
router.patch("/medications/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || user.role !== "doctor") {
    res.status(403).json({ error: "Forbidden - not a doctor" });
    return;
  }

  const [med] = await db.select().from(medicationsTable).where(
    and(
      eq(medicationsTable.id, id),
      eq(medicationsTable.doctorClerkId, userId)
    )
  );

  if (!med) {
    res.status(404).json({ error: "Medication not found" });
    return;
  }

  const parsed = UpdateMedicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.isCurrent !== undefined) updateData.isCurrent = parsed.data.isCurrent;
  if (parsed.data.dosage !== undefined) updateData.dosage = parsed.data.dosage;
  if (parsed.data.frequency !== undefined) updateData.frequency = parsed.data.frequency;
  if (parsed.data.timeToTake !== undefined) updateData.timeToTake = parsed.data.timeToTake;
  if (parsed.data.conditionInfo !== undefined) updateData.conditionInfo = parsed.data.conditionInfo;
  if (parsed.data.additionalInfo !== undefined) updateData.additionalInfo = parsed.data.additionalInfo;

  const [updated] = await db
    .update(medicationsTable)
    .set(updateData)
    .where(eq(medicationsTable.id, id))
    .returning();

  res.json(formatMedication(updated, user.name));
});

export default router;
