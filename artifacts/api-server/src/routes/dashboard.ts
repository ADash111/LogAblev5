import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  usersTable,
  doctorPatientsTable,
  appointmentsTable,
  messagesTable,
  vitalLogsTable,
  medicationsTable,
} from "@workspace/db";
import { requireAuth } from "./auth";

const router: IRouter = Router();

// Patient dashboard summary
router.get("/dashboard/patient-summary", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user || user.role !== "patient") {
    res.status(403).json({ error: "Forbidden - not a patient" });
    return;
  }

  // Get doctor
  const [relationship] = await db
    .select()
    .from(doctorPatientsTable)
    .where(eq(doctorPatientsTable.patientClerkId, userId));

  let doctorData = null;
  if (relationship) {
    const [doc] = await db.select().from(usersTable).where(eq(usersTable.clerkId, relationship.doctorClerkId));
    if (doc) {
      const now = new Date().toISOString().split('T')[0];
      const futureAppts = await db
        .select()
        .from(appointmentsTable)
        .where(
          and(
            eq(appointmentsTable.patientClerkId, userId),
            eq(appointmentsTable.status, "accepted")
          )
        );
      const nextAppt = futureAppts
        .filter(a => a.requestedDate >= now)
        .sort((a, b) => a.requestedDate.localeCompare(b.requestedDate))[0];

      doctorData = {
        id: doc.id,
        clerkId: doc.clerkId,
        name: doc.name,
        email: doc.email,
        qualifications: doc.qualifications,
        specialty: doc.specialty,
        nextAppointment: nextAppt ? `${nextAppt.requestedDate} ${nextAppt.requestedTime}` : null,
      };
    }
  }

  // Get upcoming appointments
  const now = new Date().toISOString().split('T')[0];
  const allAppts = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.patientClerkId, userId));

  const upcomingAppts = allAppts
    .filter(a => a.requestedDate >= now && a.status === "accepted")
    .sort((a, b) => a.requestedDate.localeCompare(b.requestedDate))
    .slice(0, 3)
    .map(a => ({
      id: a.id,
      patientId: a.patientClerkId,
      patientName: user.name,
      doctorId: a.doctorClerkId,
      doctorName: doctorData?.name || "Unknown",
      requestedDate: a.requestedDate,
      requestedTime: a.requestedTime,
      status: a.status,
      doctorNote: a.doctorNote,
      createdAt: a.createdAt.toISOString(),
    }));

  // Top conversations
  const allMessages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.senderId, userId))
    .orderBy(desc(messagesTable.sentAt));

  const allRecvMessages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.receiverId, userId))
    .orderBy(desc(messagesTable.sentAt));

  const combined = [...allMessages, ...allRecvMessages].sort(
    (a, b) => b.sentAt.getTime() - a.sentAt.getTime()
  );

  const contactMap = new Map<string, typeof combined[0]>();
  for (const msg of combined) {
    const cid = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!contactMap.has(cid)) contactMap.set(cid, msg);
  }

  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.clerkId, u]));

  const topConversations = Array.from(contactMap.entries())
    .slice(0, 3)
    .map(([cid, lastMsg]) => {
      const contact = userMap.get(cid);
      return {
        contactId: cid,
        contactName: contact?.name || "Unknown",
        contactRole: contact?.role || "unknown",
        lastMessage: lastMsg.content,
        lastMessageAt: lastMsg.sentAt.toISOString(),
        unreadCount: combined.filter(m => m.senderId === cid && m.receiverId === userId && !m.isRead).length,
      };
    });

  // Latest vitals
  const [latestVital] = await db
    .select()
    .from(vitalLogsTable)
    .where(eq(vitalLogsTable.patientClerkId, userId))
    .orderBy(desc(vitalLogsTable.loggedAt))
    .limit(1);

  const latestVitals = latestVital ? {
    id: latestVital.id,
    patientId: latestVital.patientClerkId,
    heartRate: latestVital.heartRate,
    respirationRate: latestVital.respirationRate,
    systolicBp: latestVital.systolicBp,
    diastolicBp: latestVital.diastolicBp,
    spo2: latestVital.spo2,
    isCritical: latestVital.isCritical,
    isDismissed: latestVital.isDismissed,
    loggedAt: latestVital.loggedAt.toISOString(),
    notes: latestVital.notes,
  } : null;

  // Upcoming medications
  const meds = await db
    .select()
    .from(medicationsTable)
    .where(
      and(
        eq(medicationsTable.patientClerkId, userId),
        eq(medicationsTable.isCurrent, true)
      )
    )
    .orderBy(medicationsTable.prescribedAt);

  const upcomingMeds = meds.slice(0, 5).map(m => ({
    id: m.id,
    patientId: m.patientClerkId,
    doctorId: m.doctorClerkId,
    doctorName: userMap.get(m.doctorClerkId)?.name || "Unknown",
    medicationName: m.medicationName,
    dosage: m.dosage,
    frequency: m.frequency,
    timeToTake: m.timeToTake,
    conditionInfo: m.conditionInfo,
    additionalInfo: m.additionalInfo,
    isCurrent: m.isCurrent,
    prescribedAt: m.prescribedAt.toISOString(),
  }));

  res.json({
    profile: {
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
    },
    doctor: doctorData,
    upcomingAppointments: upcomingAppts,
    topConversations,
    latestVitals,
    upcomingMedications: upcomingMeds,
  });
});

// Doctor dashboard summary
router.get("/dashboard/doctor-summary", requireAuth, async (req, res): Promise<void> => {
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

  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.clerkId, u]));

  // Upcoming appointments
  const now = new Date().toISOString().split('T')[0];
  const appts = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.doctorClerkId, userId));

  const upcomingAppts = appts
    .filter(a => a.requestedDate >= now && a.status === "accepted")
    .sort((a, b) => a.requestedDate.localeCompare(b.requestedDate))
    .slice(0, 3)
    .map(a => ({
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
    }));

  // Pending requests count
  const pendingCount = appts.filter(a => a.status === "pending").length;

  // Top conversations
  const allMessages = await db
    .select()
    .from(messagesTable)
    .orderBy(desc(messagesTable.sentAt));

  const myMessages = allMessages.filter(m => m.senderId === userId || m.receiverId === userId);
  const contactMap = new Map<string, typeof myMessages[0]>();
  for (const msg of myMessages) {
    const cid = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!contactMap.has(cid)) contactMap.set(cid, msg);
  }

  const topConversations = Array.from(contactMap.entries())
    .slice(0, 3)
    .map(([cid, lastMsg]) => {
      const contact = userMap.get(cid);
      return {
        contactId: cid,
        contactName: contact?.name || "Unknown",
        contactRole: contact?.role || "unknown",
        lastMessage: lastMsg.content,
        lastMessageAt: lastMsg.sentAt.toISOString(),
        unreadCount: myMessages.filter(m => m.senderId === cid && m.receiverId === userId && !m.isRead).length,
      };
    });

  // Critical vitals
  let criticalVitals: any[] = [];
  if (patientIds.length > 0) {
    const allVitals = await db
      .select()
      .from(vitalLogsTable)
      .where(eq(vitalLogsTable.isCritical, true))
      .orderBy(desc(vitalLogsTable.loggedAt));

    criticalVitals = allVitals
      .filter(v => patientIds.includes(v.patientClerkId))
      .map(v => ({
        logId: v.id,
        patientId: v.patientClerkId,
        patientName: userMap.get(v.patientClerkId)?.name || "Unknown",
        heartRate: v.heartRate,
        respirationRate: v.respirationRate,
        systolicBp: v.systolicBp,
        diastolicBp: v.diastolicBp,
        spo2: v.spo2,
        isDismissed: v.isDismissed,
        loggedAt: v.loggedAt.toISOString(),
      }));
  }

  // Recent medications (last 3 prescribed by this doctor)
  const recentMeds = await db
    .select()
    .from(medicationsTable)
    .where(eq(medicationsTable.doctorClerkId, userId))
    .orderBy(desc(medicationsTable.prescribedAt))
    .limit(3);

  const recentMedications = recentMeds.map(m => ({
    id: m.id,
    patientId: m.patientClerkId,
    doctorId: m.doctorClerkId,
    doctorName: user.name,
    medicationName: m.medicationName,
    dosage: m.dosage,
    frequency: m.frequency,
    timeToTake: m.timeToTake,
    conditionInfo: m.conditionInfo,
    additionalInfo: m.additionalInfo,
    isCurrent: m.isCurrent,
    prescribedAt: m.prescribedAt.toISOString(),
  }));

  res.json({
    profile: {
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
    },
    upcomingAppointments: upcomingAppts,
    topConversations,
    criticalVitals,
    recentMedications,
    pendingRequests: pendingCount,
  });
});

export default router;
