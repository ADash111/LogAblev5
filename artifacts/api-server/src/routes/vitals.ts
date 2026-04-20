import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, vitalLogsTable, usersTable, doctorPatientsTable } from "@workspace/db";
import { requireAuth } from "./auth";
import { AddVitalLogBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Normal ranges:
//   Heart rate: 60–100 bpm
//   Respiration: 12–20 br/min
//   SpO2: 95–100%
//   Blood pressure: systolic 90–120, diastolic 60–80

function isVitalCritical(
  heartRate?: number | null,
  respirationRate?: number | null,
  systolicBp?: number | null,
  diastolicBp?: number | null,
  spo2?: number | null
): boolean {
  if (heartRate !== undefined && heartRate !== null) {
    if (heartRate < 40 || heartRate > 130) return true;
  }
  if (respirationRate !== undefined && respirationRate !== null) {
    if (respirationRate < 8 || respirationRate > 30) return true;
  }
  if (systolicBp !== undefined && systolicBp !== null) {
    if (systolicBp < 80 || systolicBp > 180) return true;
  }
  if (diastolicBp !== undefined && diastolicBp !== null) {
    if (diastolicBp < 50 || diastolicBp > 120) return true;
  }
  if (spo2 !== undefined && spo2 !== null) {
    if (spo2 < 90) return true;
  }
  return false;
}

function isVitalAbnormal(
  heartRate?: number | null,
  respirationRate?: number | null,
  systolicBp?: number | null,
  diastolicBp?: number | null,
  spo2?: number | null
): boolean {
  if (heartRate !== undefined && heartRate !== null) {
    if (heartRate < 60 || heartRate > 100) return true;
  }
  if (respirationRate !== undefined && respirationRate !== null) {
    if (respirationRate < 12 || respirationRate > 20) return true;
  }
  if (systolicBp !== undefined && systolicBp !== null) {
    if (systolicBp < 90 || systolicBp > 120) return true;
  }
  if (diastolicBp !== undefined && diastolicBp !== null) {
    if (diastolicBp < 60 || diastolicBp > 80) return true;
  }
  if (spo2 !== undefined && spo2 !== null) {
    if (spo2 < 95) return true;
  }
  return false;
}

function formatVitalLog(v: any) {
  return {
    id: v.id,
    patientId: v.patientClerkId,
    heartRate: v.heartRate,
    respirationRate: v.respirationRate,
    systolicBp: v.systolicBp,
    diastolicBp: v.diastolicBp,
    spo2: v.spo2,
    isCritical: v.isCritical,
    isDismissed: v.isDismissed,
    loggedAt: v.loggedAt.toISOString(),
    notes: v.notes,
  };
}

// Get my vitals (patient)
router.get("/vitals", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const vitals = await db
    .select()
    .from(vitalLogsTable)
    .where(eq(vitalLogsTable.patientClerkId, userId))
    .orderBy(desc(vitalLogsTable.loggedAt));

  res.json(vitals.map(formatVitalLog));
});

// Add vital log (patient)
router.post("/vitals", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || user.role !== "patient") {
    res.status(403).json({ error: "Forbidden - not a patient" });
    return;
  }

  const parsed = AddVitalLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const critical = isVitalCritical(
    parsed.data.heartRate,
    parsed.data.respirationRate,
    parsed.data.systolicBp,
    parsed.data.diastolicBp,
    parsed.data.spo2
  );

  const [vital] = await db
    .insert(vitalLogsTable)
    .values({
      patientClerkId: userId,
      heartRate: parsed.data.heartRate ?? null,
      respirationRate: parsed.data.respirationRate ?? null,
      systolicBp: parsed.data.systolicBp ?? null,
      diastolicBp: parsed.data.diastolicBp ?? null,
      spo2: parsed.data.spo2 ?? null,
      isCritical: critical,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json(formatVitalLog(vital));
});

// Get critical vitals (doctor only)
router.get("/vitals/critical", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || user.role !== "doctor") {
    res.status(403).json({ error: "Forbidden - not a doctor" });
    return;
  }

  const relationships = await db
    .select()
    .from(doctorPatientsTable)
    .where(eq(doctorPatientsTable.doctorClerkId, userId));

  const patientIds = relationships.map(r => r.patientClerkId);

  if (patientIds.length === 0) {
    res.json([]);
    return;
  }

  const criticalVitals = await db
    .select()
    .from(vitalLogsTable)
    .where(eq(vitalLogsTable.isCritical, true))
    .orderBy(desc(vitalLogsTable.loggedAt));

  const myPatientCriticals = criticalVitals.filter(v => patientIds.includes(v.patientClerkId));

  const allPatients = await db.select().from(usersTable);
  const patientMap = new Map(allPatients.map(p => [p.clerkId, p]));

  res.json(myPatientCriticals.map(v => ({
    logId: v.id,
    patientId: v.patientClerkId,
    patientName: patientMap.get(v.patientClerkId)?.name || "Unknown",
    heartRate: v.heartRate,
    respirationRate: v.respirationRate,
    systolicBp: v.systolicBp,
    diastolicBp: v.diastolicBp,
    spo2: v.spo2,
    isDismissed: v.isDismissed,
    loggedAt: v.loggedAt.toISOString(),
  })));
});

// Get abnormal (but not critical) vitals (doctor only)
router.get("/vitals/abnormal", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || user.role !== "doctor") {
    res.status(403).json({ error: "Forbidden - not a doctor" });
    return;
  }

  const relationships = await db
    .select()
    .from(doctorPatientsTable)
    .where(eq(doctorPatientsTable.doctorClerkId, userId));

  const patientIds = relationships.map(r => r.patientClerkId);

  if (patientIds.length === 0) {
    res.json([]);
    return;
  }

  const allVitals = await db
    .select()
    .from(vitalLogsTable)
    .orderBy(desc(vitalLogsTable.loggedAt));

  const myPatientAbnormals = allVitals.filter(v =>
    patientIds.includes(v.patientClerkId) &&
    !v.isCritical &&
    isVitalAbnormal(v.heartRate, v.respirationRate, v.systolicBp, v.diastolicBp, v.spo2)
  );

  const allPatients = await db.select().from(usersTable);
  const patientMap = new Map(allPatients.map(p => [p.clerkId, p]));

  res.json(myPatientAbnormals.map(v => ({
    logId: v.id,
    patientId: v.patientClerkId,
    patientName: patientMap.get(v.patientClerkId)?.name || "Unknown",
    heartRate: v.heartRate,
    respirationRate: v.respirationRate,
    systolicBp: v.systolicBp,
    diastolicBp: v.diastolicBp,
    spo2: v.spo2,
    isDismissed: v.isDismissed,
    loggedAt: v.loggedAt.toISOString(),
  })));
});

// Dismiss critical vital (doctor only)
router.post("/vitals/critical/:id/dismiss", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || user.role !== "doctor") {
    res.status(403).json({ error: "Forbidden - not a doctor" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [vital] = await db.select().from(vitalLogsTable).where(eq(vitalLogsTable.id, id));
  if (!vital) {
    res.status(404).json({ error: "Vital log not found" });
    return;
  }

  // Verify this patient belongs to this doctor
  const relationships = await db
    .select()
    .from(doctorPatientsTable)
    .where(
      and(
        eq(doctorPatientsTable.doctorClerkId, userId),
        eq(doctorPatientsTable.patientClerkId, vital.patientClerkId)
      )
    );

  if (relationships.length === 0) {
    res.status(403).json({ error: "Forbidden - patient not in your care" });
    return;
  }

  const [updated] = await db
    .update(vitalLogsTable)
    .set({ isDismissed: true })
    .where(eq(vitalLogsTable.id, id))
    .returning();

  res.json(formatVitalLog(updated));
});

// Get patient vitals (doctor only)
router.get("/vitals/patient/:patientId", requireAuth, async (req, res): Promise<void> => {
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

  const vitals = await db
    .select()
    .from(vitalLogsTable)
    .where(eq(vitalLogsTable.patientClerkId, patientId))
    .orderBy(desc(vitalLogsTable.loggedAt));

  res.json(vitals.map(formatVitalLog));
});

export default router;
