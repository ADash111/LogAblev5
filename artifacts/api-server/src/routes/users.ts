import { Router, type IRouter } from "express";
import { eq, and, ne } from "drizzle-orm";
import { db, usersTable, doctorPatientsTable, appointmentsTable } from "@workspace/db";
import { requireAuth } from "./auth";
import {
  UpdateMyProfileBody,
  CompleteOnboardingBody,
  AddPatientBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Get or create user profile
router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const auth = req as any;

  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));

  if (!user) {
    // Auto-create profile on first access
    const clerkUser = auth.auth?.sessionClaims;
    const email = clerkUser?.email as string || "";
    const name = (clerkUser?.firstName && clerkUser?.lastName)
      ? `${clerkUser.firstName} ${clerkUser.lastName}`
      : (clerkUser?.firstName as string || "");

    [user] = await db
      .insert(usersTable)
      .values({ clerkId: userId, name, email })
      .returning();
  }

  res.json({
    id: user.id,
    clerkId: user.clerkId,
    role: user.role,
    name: user.name,
    email: user.email,
    dateOfBirth: user.dateOfBirth,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    conditions: user.conditions,
    qualifications: user.qualifications,
    specialty: user.specialty,
    createdAt: user.createdAt.toISOString(),
  });
});

// Update profile
router.put("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const parsed = UpdateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.dateOfBirth !== undefined) updateData.dateOfBirth = parsed.data.dateOfBirth;
  if (parsed.data.heightCm !== undefined) updateData.heightCm = parsed.data.heightCm;
  if (parsed.data.weightKg !== undefined) updateData.weightKg = parsed.data.weightKg;
  if (parsed.data.conditions !== undefined) updateData.conditions = parsed.data.conditions;
  if (parsed.data.qualifications !== undefined) updateData.qualifications = parsed.data.qualifications;
  if (parsed.data.specialty !== undefined) updateData.specialty = parsed.data.specialty;

  const [updated] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.clerkId, userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: updated.id,
    clerkId: updated.clerkId,
    role: updated.role,
    name: updated.name,
    email: updated.email,
    dateOfBirth: updated.dateOfBirth,
    heightCm: updated.heightCm,
    weightKg: updated.weightKg,
    conditions: updated.conditions,
    qualifications: updated.qualifications,
    specialty: updated.specialty,
    createdAt: updated.createdAt.toISOString(),
  });
});

// Complete onboarding
router.post("/users/me/complete-onboarding", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const parsed = CompleteOnboardingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {
    role: parsed.data.role,
    name: parsed.data.name,
  };
  if (parsed.data.dateOfBirth !== undefined) updateData.dateOfBirth = parsed.data.dateOfBirth;
  if (parsed.data.heightCm !== undefined) updateData.heightCm = parsed.data.heightCm;
  if (parsed.data.weightKg !== undefined) updateData.weightKg = parsed.data.weightKg;
  if (parsed.data.conditions !== undefined) updateData.conditions = parsed.data.conditions;
  if (parsed.data.qualifications !== undefined) updateData.qualifications = parsed.data.qualifications;
  if (parsed.data.specialty !== undefined) updateData.specialty = parsed.data.specialty;

  let [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));

  let user;
  if (existing) {
    [user] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.clerkId, userId))
      .returning();
  } else {
    [user] = await db
      .insert(usersTable)
      .values({ clerkId: userId, ...updateData } as any)
      .returning();
  }

  res.json({
    id: user.id,
    clerkId: user.clerkId,
    role: user.role,
    name: user.name,
    email: user.email,
    dateOfBirth: user.dateOfBirth,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    conditions: user.conditions,
    qualifications: user.qualifications,
    specialty: user.specialty,
    createdAt: user.createdAt.toISOString(),
  });
});

// Get all doctors
router.get("/users/doctors", requireAuth, async (req, res): Promise<void> => {
  const doctors = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "doctor"));

  const result = doctors.map(d => ({
    id: d.id,
    clerkId: d.clerkId,
    name: d.name,
    email: d.email,
    qualifications: d.qualifications,
    specialty: d.specialty,
    nextAppointment: null,
  }));

  res.json(result);
});

// Get my patients (doctor only)
router.get("/users/my-patients", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!doctor || doctor.role !== "doctor") {
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

  const patients = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "patient"));

  const myPatients = patients.filter(p => patientIds.includes(p.clerkId));

  res.json(myPatients.map(p => ({
    id: p.id,
    clerkId: p.clerkId,
    name: p.name,
    email: p.email,
    dateOfBirth: p.dateOfBirth,
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    conditions: p.conditions,
  })));
});

// Add patient (admin only)
router.post("/users/add-patient", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!doctor || doctor.role !== "admin") {
    res.status(403).json({ error: "Forbidden - admin only" });
    return;
  }

  const parsed = AddPatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [patient] = await db.select().from(usersTable).where(eq(usersTable.clerkId, parsed.data.patientClerkId));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  // Check if relationship already exists
  const [existing] = await db
    .select()
    .from(doctorPatientsTable)
    .where(
      and(
        eq(doctorPatientsTable.doctorClerkId, userId),
        eq(doctorPatientsTable.patientClerkId, parsed.data.patientClerkId)
      )
    );

  if (!existing) {
    await db.insert(doctorPatientsTable).values({
      doctorClerkId: userId,
      patientClerkId: parsed.data.patientClerkId,
    });
  }

  res.json({ success: true });
});

// Get my doctor (patient only)
router.get("/users/my-doctor", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [relationship] = await db
    .select()
    .from(doctorPatientsTable)
    .where(eq(doctorPatientsTable.patientClerkId, userId));

  if (!relationship) {
    res.status(404).json({ error: "No doctor assigned" });
    return;
  }

  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.clerkId, relationship.doctorClerkId));

  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  // Get next appointment
  const now = new Date().toISOString().split('T')[0];
  const nextAppts = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.patientClerkId, userId),
        eq(appointmentsTable.status, "accepted")
      )
    );

  const future = nextAppts
    .filter(a => a.requestedDate >= now)
    .sort((a, b) => a.requestedDate.localeCompare(b.requestedDate));

  res.json({
    id: doctor.id,
    clerkId: doctor.clerkId,
    name: doctor.name,
    email: doctor.email,
    qualifications: doctor.qualifications,
    specialty: doctor.specialty,
    nextAppointment: future[0] ? `${future[0].requestedDate} ${future[0].requestedTime}` : null,
  });
});

export default router;
