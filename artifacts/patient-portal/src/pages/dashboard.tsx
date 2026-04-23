import { useGetMyProfile, useGetPatientDashboardSummary, useGetDoctorDashboardSummary, useGetAbnormalVitals } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Activity, Pill, ArrowRight, CheckCircle2, Copy, Check, ShieldCheck, UserRound, Stethoscope, X, Users, Camera, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@clerk/react";

export default function DashboardPage() {
  const { data: profile, isLoading: profileLoading } = useGetMyProfile();

  if (profileLoading) {
    return <div className="flex h-[100dvh] items-center justify-center"><Activity className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!profile) return null;

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Teal gradient header */}
      <header className="border-b border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                name={profile.name}
                role={profile.role}
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                <p className="text-sm text-primary font-medium capitalize">
                  {profile.role === "admin" ? "Administrator" : profile.role === "doctor" ? `Dr. · ${profile.specialty || "General Practice"}` : "Patient Portal"}
                </p>
              </div>
            </div>

            {profile.role === "patient" && (
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <div className="flex flex-wrap gap-3 text-sm">
                  {profile.dateOfBirth && (
                    <div className="bg-background/80 border border-primary/20 px-3 py-2 rounded-lg">
                      <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">DOB</p>
                      <p className="font-medium">{profile.dateOfBirth}</p>
                    </div>
                  )}
                  {(profile.heightCm || profile.weightKg) && (
                    <div className="bg-background/80 border border-primary/20 px-3 py-2 rounded-lg">
                      <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">Height / Weight</p>
                      <p className="font-medium">{profile.heightCm ? `${profile.heightCm}cm` : "—"} / {profile.weightKg ? `${profile.weightKg}kg` : "—"}</p>
                    </div>
                  )}
                  {profile.conditions && (
                    <div className="bg-background/80 border border-primary/20 px-3 py-2 rounded-lg max-w-[200px]">
                      <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">Conditions</p>
                      <p className="font-medium truncate" title={profile.conditions}>{profile.conditions}</p>
                    </div>
                  )}
                </div>
                <PatientIdCard clerkId={profile.clerkId} />
              </div>
            )}

            {profile.role === "doctor" && (
              <div className="flex flex-wrap gap-3 text-sm">
                {profile.specialty && (
                  <div className="bg-background/80 border border-primary/20 px-3 py-2 rounded-lg">
                    <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">Specialty</p>
                    <p className="font-medium">{profile.specialty}</p>
                  </div>
                )}
                {profile.qualifications && (
                  <div className="bg-background/80 border border-primary/20 px-3 py-2 rounded-lg">
                    <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">Qualifications</p>
                    <p className="font-medium">{profile.qualifications}</p>
                  </div>
                )}
              </div>
            )}

            {profile.role === "admin" && (
              <div className="bg-primary/10 border border-primary/30 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">Full System Access</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {profile.role === "patient" && <PatientDashboard />}
        {profile.role === "doctor" && <DoctorDashboard />}
        {profile.role === "admin" && <AdminDashboard />}
      </main>
    </div>
  );
}

function PatientIdCard({ clerkId }: { clerkId: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(clerkId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-3 bg-primary/5 border border-primary/25 rounded-xl px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Your Patient ID</p>
        <p className="text-[10px] text-muted-foreground mb-1">Share with your doctor to get added to their roster.</p>
        <p className="font-mono text-xs font-medium truncate text-foreground">{clerkId}</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10 text-xs">
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}

function FeatureCard({ href, icon: Icon, title, accent, children }: { href: string; icon: any; title: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <Card className={`cursor-pointer h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${accent ? 'border-destructive/30 hover:border-destructive/60' : 'hover:border-primary/40'}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`flex items-center text-lg gap-2 ${accent ? 'text-destructive' : ''}`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accent ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              <Icon className={`h-4 w-4 ${accent ? 'text-destructive' : 'text-primary'}`} />
            </div>
            {title}
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground/50" />
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </Link>
  );
}

function PatientDashboard() {
  const { data: summary, isLoading } = useGetPatientDashboardSummary();

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted rounded-2xl" />)}
    </div>
  );
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FeatureCard href="/appointments" icon={Calendar} title="Appointments">
        {summary.upcomingAppointments?.length > 0 ? (
          <div className="space-y-3 mt-2">
            {summary.upcomingAppointments.slice(0, 3).map((apt, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div>
                  <p className="font-medium text-sm">{apt.doctorName}</p>
                  <p className="text-xs text-muted-foreground">{new Date(apt.requestedDate).toLocaleDateString()} at {apt.requestedTime}</p>
                </div>
                <Badge variant={apt.status === "accepted" ? "default" : apt.status === "pending" ? "secondary" : "destructive"} className="text-xs">
                  {apt.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">No upcoming appointments.</p>
        )}
      </FeatureCard>

      <FeatureCard href="/messages" icon={MessageSquare} title="Messages">
        {summary.topConversations?.length > 0 ? (
          <div className="space-y-3 mt-2">
            {summary.topConversations.map((conv, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="font-medium text-sm truncate">{conv.contactName}</p>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
                {conv.unreadCount > 0 && <Badge className="bg-primary text-xs">{conv.unreadCount}</Badge>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">No recent messages.</p>
        )}
      </FeatureCard>

      <FeatureCard href="/vitals" icon={Activity} title="Latest Vitals">
        {summary.latestVitals ? (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[
              { label: "Heart Rate", value: summary.latestVitals.heartRate, unit: "bpm" },
              { label: "Blood Pressure", value: summary.latestVitals.systolicBp ? `${summary.latestVitals.systolicBp}/${summary.latestVitals.diastolicBp}` : null, unit: "mmHg" },
              { label: "SpO2", value: summary.latestVitals.spo2, unit: "%" },
              { label: "Resp Rate", value: summary.latestVitals.respirationRate, unit: "br/m" },
            ].map(({ label, value, unit }) => (
              <div key={label} className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{value ?? "—"} <span className="text-xs font-normal text-muted-foreground">{unit}</span></p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">No vitals recorded yet.</p>
        )}
      </FeatureCard>

      <FeatureCard href="/medications" icon={Pill} title="Active Medications">
        {summary.upcomingMedications?.length > 0 ? (
          <div className="space-y-3 mt-2">
            {summary.upcomingMedications.map((med, i) => (
              <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="font-semibold text-sm text-primary">{med.medicationName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{med.dosage} · {med.frequency}</p>
                {med.timeToTake && <p className="text-xs text-muted-foreground">Take at: {med.timeToTake}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">No active medications.</p>
        )}
      </FeatureCard>
    </div>
  );
}

function DoctorDashboard() {
  const { data: summary, isLoading } = useGetDoctorDashboardSummary();
  const { data: abnormalVitals } = useGetAbnormalVitals();

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted rounded-2xl" />)}
    </div>
  );
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FeatureCard href="/appointments" icon={Calendar} title="Schedule">
        <div className="flex justify-between items-center mt-1 mb-3">
          {summary.pendingRequests > 0 && (
            <Badge variant="destructive" className="text-xs">{summary.pendingRequests} Pending</Badge>
          )}
        </div>
        {summary.upcomingAppointments?.length > 0 ? (
          <div className="space-y-3">
            {summary.upcomingAppointments.slice(0, 3).map((apt, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div>
                  <p className="font-medium text-sm">{apt.patientName}</p>
                  <p className="text-xs text-muted-foreground">{new Date(apt.requestedDate).toLocaleDateString()} at {apt.requestedTime}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-6 text-center text-sm">No upcoming appointments.</p>
        )}
      </FeatureCard>

      <FeatureCard href="/messages" icon={MessageSquare} title="Messages">
        {summary.topConversations?.length > 0 ? (
          <div className="space-y-3 mt-2">
            {summary.topConversations.map((conv, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="font-medium text-sm truncate">{conv.contactName}</p>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
                {conv.unreadCount > 0 && <Badge className="bg-primary text-xs">{conv.unreadCount}</Badge>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">No recent messages.</p>
        )}
      </FeatureCard>

      <FeatureCard href="/vitals" icon={Activity} title="Critical Vitals Alert" accent>
        {summary.criticalVitals?.length > 0 ? (
          <div className="space-y-3 mt-2">
            {summary.criticalVitals.slice(0,3).map((vital, i) => (
              <div key={i} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium text-sm">{vital.patientName}</p>
                  <span className="text-[10px] text-muted-foreground">{new Date(vital.loggedAt).toLocaleDateString()}</span>
                </div>
                <div className="text-xs text-destructive flex gap-3">
                  {vital.heartRate && <span>HR: {vital.heartRate}</span>}
                  {vital.systolicBp && <span>BP: {vital.systolicBp}/{vital.diastolicBp}</span>}
                  {vital.spo2 && <span>SpO2: {vital.spo2}%</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mb-2 text-green-500/70" />
            <p className="text-sm">No critical vitals at this time.</p>
          </div>
        )}
      </FeatureCard>

      <FeatureCard href="/vitals" icon={Activity} title="Abnormal Readings">
        {abnormalVitals && abnormalVitals.length > 0 ? (
          <div className="space-y-3 mt-2">
            {abnormalVitals.slice(0,3).map((vital, i) => (
              <div key={i} className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/40">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium text-sm">{vital.patientName}</p>
                  <span className="text-[10px] text-muted-foreground">{new Date(vital.loggedAt).toLocaleDateString()}</span>
                </div>
                <div className="text-xs text-amber-800 dark:text-amber-300 flex flex-wrap gap-3">
                  {vital.heartRate != null && <span>HR: {vital.heartRate}</span>}
                  {vital.respirationRate != null && <span>RR: {vital.respirationRate}</span>}
                  {vital.systolicBp != null && <span>BP: {vital.systolicBp}/{vital.diastolicBp}</span>}
                  {vital.spo2 != null && <span>SpO2: {vital.spo2}%</span>}
                </div>
              </div>
            ))}
            {abnormalVitals.length > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-1">+{abnormalVitals.length - 3} more</p>
            )}
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mb-2 text-green-500/70" />
            <p className="text-sm">No abnormal readings.</p>
          </div>
        )}
      </FeatureCard>

      <FeatureCard href="/medications" icon={Pill} title="Recently Prescribed">
        {summary.recentMedications?.length > 0 ? (
          <div className="space-y-3 mt-2">
            {summary.recentMedications.slice(0,3).map((med, i) => (
              <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="font-semibold text-sm text-primary">{med.medicationName}</p>
                <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">No recent prescriptions.</p>
        )}
      </FeatureCard>
    </div>
  );
}

type AdminPatient = { clerkId: string; name: string; email: string; assignedDoctorClerkId: string | null; assignedDoctorName: string | null; };
type AdminDoctor = { clerkId: string; name: string; email: string; specialty: string | null; patientCount: number; };

function AdminDashboard() {
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        fetch("/api/admin/patients"),
        fetch("/api/admin/doctors"),
      ]);
      if (pRes.ok) setPatients(await pRes.json());
      if (dRes.ok) setDoctors(await dRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const assign = async (patientClerkId: string) => {
    const doctorClerkId = selectedDoctor[patientClerkId];
    if (!doctorClerkId) return;
    setAssigning(patientClerkId);
    try {
      const res = await fetch("/api/admin/assign-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientClerkId, doctorClerkId }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: "Patient assigned", description: `${data.patientName} → ${data.doctorName}` });
        await fetchData();
        setSelectedDoctor(prev => ({ ...prev, [patientClerkId]: "" }));
      } else {
        toast({ title: "Error", description: "Assignment failed.", variant: "destructive" });
      }
    } finally {
      setAssigning(null);
    }
  };

  const unassign = async (patientClerkId: string) => {
    setAssigning(patientClerkId);
    try {
      const res = await fetch(`/api/admin/unassign-patient/${patientClerkId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Patient unassigned" });
        await fetchData();
      }
    } finally {
      setAssigning(null);
    }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Patients", value: patients.length, icon: UserRound },
          { label: "Total Doctors", value: doctors.length, icon: Stethoscope },
          { label: "Assigned", value: patients.filter(p => p.assignedDoctorClerkId).length, icon: CheckCircle2 },
          { label: "Unassigned", value: patients.filter(p => !p.assignedDoctorClerkId).length, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Doctors summary */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" /> Doctors
        </h2>
        {doctors.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No doctors registered yet.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map(d => (
              <div key={d.clerkId} className="border border-primary/20 bg-primary/5 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.specialty || "General Practice"}</p>
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs">{d.patientCount} patients</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patients + assignment */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <UserRound className="h-5 w-5 text-primary" /> Patients
        </h2>
        {patients.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No patients registered yet.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {patients.map(p => (
              <div key={p.clerkId} className="border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                  {p.assignedDoctorName ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <p className="text-xs text-primary font-medium">Assigned to {p.assignedDoctorName}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">Unassigned</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {doctors.length > 0 && (
                    <>
                      <Select
                        value={selectedDoctor[p.clerkId] || ""}
                        onValueChange={val => setSelectedDoctor(prev => ({ ...prev, [p.clerkId]: val }))}
                      >
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <SelectValue placeholder="Pick a doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map(d => (
                            <SelectItem key={d.clerkId} value={d.clerkId} className="text-xs">{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="h-8 text-xs px-3"
                        disabled={!selectedDoctor[p.clerkId] || assigning === p.clerkId}
                        onClick={() => assign(p.clerkId)}
                      >
                        Assign
                      </Button>
                    </>
                  )}
                  {p.assignedDoctorClerkId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={assigning === p.clerkId}
                      onClick={() => unassign(p.clerkId)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileAvatar({ name, role }: { name: string; role: string | null | undefined }) {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5 MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      await user.setProfileImage({ file });
      await user.reload();
      toast({ title: "Profile photo updated" });
    } catch (err) {
      toast({ title: "Could not update photo", description: "Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const RoleIcon = role === "doctor" ? Stethoscope : role === "admin" ? ShieldCheck : UserRound;

  return (
    <div className="relative group">
      <Avatar className="h-14 w-14 border-2 border-primary/30 shadow-sm bg-primary/15">
        {user?.imageUrl && <AvatarImage src={user.imageUrl} alt={name} />}
        <AvatarFallback className="bg-primary/15 text-primary">
          {user?.imageUrl ? (
            initials
          ) : (
            <RoleIcon className="h-6 w-6" />
          )}
        </AvatarFallback>
      </Avatar>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground border-2 border-background shadow flex items-center justify-center hover:bg-primary/90 disabled:opacity-50"
        aria-label="Change profile photo"
        title="Change profile photo"
      >
        <Camera className="h-3.5 w-3.5" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  );
}

