import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, doctorPatientsTable } from "@workspace/db";
import { requireAuth } from "./auth";

const router: IRouter = Router();

const requireAdmin = requireAuth;

async function assertAdmin(req: any, res: any): Promise<boolean> {
  const userId = req.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden - admin only" });
    return false;
  }
  return true;
}

// Get all patients
router.get("/admin/patients", requireAdmin, async (req, res): Promise<void> => {
  if (!(await assertAdmin(req, res))) return;

  const patients = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "patient"));

  const relationships = await db.select().from(doctorPatientsTable);
  const doctors = await db.select().from(usersTable).where(eq(usersTable.role, "doctor"));
  const doctorMap = new Map(doctors.map(d => [d.clerkId, d]));

  res.json(patients.map(p => {
    const rel = relationships.find(r => r.patientClerkId === p.clerkId);
    const assignedDoctor = rel ? doctorMap.get(rel.doctorClerkId) : null;
    return {
      clerkId: p.clerkId,
      name: p.name,
      email: p.email,
      dateOfBirth: p.dateOfBirth,
      conditions: p.conditions,
      assignedDoctorClerkId: assignedDoctor?.clerkId ?? null,
      assignedDoctorName: assignedDoctor?.name ?? null,
    };
  }));
});

// Get all doctors
router.get("/admin/doctors", requireAdmin, async (req, res): Promise<void> => {
  if (!(await assertAdmin(req, res))) return;

  const doctors = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "doctor"));

  const relationships = await db.select().from(doctorPatientsTable);

  res.json(doctors.map(d => {
    const patientCount = relationships.filter(r => r.doctorClerkId === d.clerkId).length;
    return {
      clerkId: d.clerkId,
      name: d.name,
      email: d.email,
      specialty: d.specialty,
      qualifications: d.qualifications,
      patientCount,
    };
  }));
});

// Assign a patient to a doctor
router.post("/admin/assign-patient", requireAdmin, async (req, res): Promise<void> => {
  if (!(await assertAdmin(req, res))) return;

  const { patientClerkId, doctorClerkId } = req.body;

  if (!patientClerkId || !doctorClerkId) {
    res.status(400).json({ error: "patientClerkId and doctorClerkId are required" });
    return;
  }

  const [patient] = await db.select().from(usersTable).where(eq(usersTable.clerkId, patientClerkId));
  if (!patient || patient.role !== "patient") {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.clerkId, doctorClerkId));
  if (!doctor || doctor.role !== "doctor") {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  // Remove any existing assignment for this patient
  await db
    .delete(doctorPatientsTable)
    .where(eq(doctorPatientsTable.patientClerkId, patientClerkId));

  // Create new assignment
  await db.insert(doctorPatientsTable).values({ doctorClerkId, patientClerkId });

  res.json({ success: true, patientName: patient.name, doctorName: doctor.name });
});

// Unassign a patient from their doctor
router.delete("/admin/unassign-patient/:patientClerkId", requireAdmin, async (req, res): Promise<void> => {
  if (!(await assertAdmin(req, res))) return;

  const { patientClerkId } = req.params;

  await db
    .delete(doctorPatientsTable)
    .where(eq(doctorPatientsTable.patientClerkId, patientClerkId));

  res.json({ success: true });
});

export default router;
