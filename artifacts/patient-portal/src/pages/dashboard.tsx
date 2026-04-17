import { useGetMyProfile, useGetPatientDashboardSummary, useGetDoctorDashboardSummary, useAddPatient, useGetDoctors } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Activity, Pill, Plus, ArrowRight, UserPlus, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { data: profile, isLoading: profileLoading } = useGetMyProfile();

  if (profileLoading) {
    return <div className="flex h-[100dvh] items-center justify-center"><Activity className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!profile) return null;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border/40 bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome, {profile.name}</h1>
              <p className="text-muted-foreground mt-1">
                {profile.role === "patient" ? "Patient Portal" : "Doctor Portal"}
              </p>
            </div>
            
            {profile.role === "patient" && (
              <div className="flex flex-wrap gap-4 text-sm bg-secondary/50 p-4 rounded-xl">
                <div>
                  <p className="text-muted-foreground font-medium">Date of Birth</p>
                  <p>{profile.dateOfBirth || "N/A"}</p>
                </div>
                <div className="w-px bg-border/50" />
                <div>
                  <p className="text-muted-foreground font-medium">Height/Weight</p>
                  <p>{profile.heightCm ? `${profile.heightCm}cm` : "N/A"} / {profile.weightKg ? `${profile.weightKg}kg` : "N/A"}</p>
                </div>
                {profile.conditions && (
                  <>
                    <div className="w-px bg-border/50" />
                    <div>
                      <p className="text-muted-foreground font-medium">Conditions</p>
                      <p className="max-w-[200px] truncate" title={profile.conditions}>{profile.conditions}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {profile.role === "doctor" && (
              <div className="flex items-center gap-4">
                <div className="text-sm bg-secondary/50 p-4 rounded-xl">
                  <p className="text-muted-foreground font-medium">Specialty</p>
                  <p>{profile.specialty || "General Practice"}</p>
                </div>
                <AddPatientDialog />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {profile.role === "patient" ? <PatientDashboard /> : <DoctorDashboard />}
      </main>
    </div>
  );
}

function AddPatientDialog() {
  const [clerkId, setClerkId] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const addPatient = useAddPatient({
    mutation: {
      onSuccess: () => {
        toast({ title: "Patient added successfully" });
        setOpen(false);
        setClerkId("");
      },
      onError: (err) => {
        toast({ title: "Failed to add patient", variant: "destructive" });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Patient</DialogTitle>
          <DialogDescription>
            Enter the patient's ID to add them to your roster.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input 
            placeholder="Patient ID..." 
            value={clerkId} 
            onChange={(e) => setClerkId(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => addPatient.mutate({ data: { patientClerkId: clerkId } })}
            disabled={!clerkId || addPatient.isPending}
          >
            {addPatient.isPending ? "Adding..." : "Add Patient"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PatientDashboard() {
  const { data: summary, isLoading } = useGetPatientDashboardSummary();

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted rounded-2xl" />)}
    </div>;
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Appointments Preview */}
      <Link href="/appointments">
        <Card className="hover-elevate cursor-pointer h-full transition-all hover:border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.upcomingAppointments?.length > 0 ? (
              <div className="space-y-4 mt-2">
                {summary.upcomingAppointments.slice(0, 3).map((apt, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="font-medium">{apt.doctorName}</p>
                      <p className="text-sm text-muted-foreground">{new Date(apt.requestedDate).toLocaleDateString()} at {apt.requestedTime}</p>
                    </div>
                    <Badge variant={apt.status === "accepted" ? "default" : apt.status === "pending" ? "secondary" : "destructive"}>
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">No upcoming appointments.</p>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Messages Preview */}
      <Link href="/messages">
        <Card className="hover-elevate cursor-pointer h-full transition-all hover:border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <MessageSquare className="mr-2 h-5 w-5 text-primary" />
              Recent Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.topConversations?.length > 0 ? (
              <div className="space-y-4 mt-2">
                {summary.topConversations.map((conv, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-medium truncate">{conv.contactName}</p>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-primary">{conv.unreadCount}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">No recent messages.</p>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Vitals Preview */}
      <Link href="/vitals">
        <Card className="hover-elevate cursor-pointer h-full transition-all hover:border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Latest Vitals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.latestVitals ? (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-4 rounded-xl bg-secondary/30">
                  <p className="text-sm text-muted-foreground">Heart Rate</p>
                  <p className="text-2xl font-semibold">{summary.latestVitals.heartRate || "--"} <span className="text-sm font-normal text-muted-foreground">bpm</span></p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30">
                  <p className="text-sm text-muted-foreground">Blood Pressure</p>
                  <p className="text-2xl font-semibold">{summary.latestVitals.systolicBp || "--"}/{summary.latestVitals.diastolicBp || "--"}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30">
                  <p className="text-sm text-muted-foreground">SpO2</p>
                  <p className="text-2xl font-semibold">{summary.latestVitals.spo2 || "--"}%</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30">
                  <p className="text-sm text-muted-foreground">Resp Rate</p>
                  <p className="text-2xl font-semibold">{summary.latestVitals.respirationRate || "--"}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">No vitals recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Medications Preview */}
      <Link href="/medications">
        <Card className="hover-elevate cursor-pointer h-full transition-all hover:border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Pill className="mr-2 h-5 w-5 text-primary" />
              Active Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.upcomingMedications?.length > 0 ? (
              <div className="space-y-3 mt-2">
                {summary.upcomingMedications.map((med, i) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <p className="font-medium text-primary">{med.medicationName}</p>
                    <p className="text-sm mt-1">{med.dosage} • {med.frequency}</p>
                    {med.timeToTake && <p className="text-xs text-muted-foreground mt-1">Take at: {med.timeToTake}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">No active medications.</p>
            )}
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function DoctorDashboard() {
  const { data: summary, isLoading } = useGetDoctorDashboardSummary();

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted rounded-2xl" />)}
    </div>;
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Appointments Preview */}
      <Link href="/appointments">
        <Card className="hover-elevate cursor-pointer h-full transition-all hover:border-primary/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Schedule
            </CardTitle>
            {summary.pendingRequests > 0 && (
              <Badge variant="destructive">{summary.pendingRequests} Pending</Badge>
            )}
          </CardHeader>
          <CardContent>
            {summary.upcomingAppointments?.length > 0 ? (
              <div className="space-y-4 mt-2">
                {summary.upcomingAppointments.slice(0, 3).map((apt, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="font-medium">{apt.patientName}</p>
                      <p className="text-sm text-muted-foreground">{new Date(apt.requestedDate).toLocaleDateString()} at {apt.requestedTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">No upcoming appointments.</p>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Messages Preview */}
      <Link href="/messages">
        <Card className="hover-elevate cursor-pointer h-full transition-all hover:border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <MessageSquare className="mr-2 h-5 w-5 text-primary" />
              Recent Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.topConversations?.length > 0 ? (
              <div className="space-y-4 mt-2">
                {summary.topConversations.map((conv, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-medium truncate">{conv.contactName}</p>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-primary">{conv.unreadCount}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">No recent messages.</p>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Vitals Preview */}
      <Link href="/vitals">
        <Card className="hover-elevate cursor-pointer h-full transition-all hover:border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg text-destructive">
              <Activity className="mr-2 h-5 w-5" />
              Critical Vitals Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.criticalVitals?.length > 0 ? (
              <div className="space-y-3 mt-2">
                {summary.criticalVitals.slice(0,3).map((vital, i) => (
                  <div key={i} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium">{vital.patientName}</p>
                      <span className="text-xs text-muted-foreground">{new Date(vital.loggedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-destructive flex gap-3">
                      {vital.heartRate && <span>HR: {vital.heartRate}</span>}
                      {vital.systolicBp && <span>BP: {vital.systolicBp}/{vital.diastolicBp}</span>}
                      {vital.spo2 && <span>SpO2: {vital.spo2}%</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center flex flex-col items-center text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mb-2 text-green-500/50" />
                <p>No critical vitals at this time.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Medications Preview */}
      <Link href="/medications">
        <Card className="hover-elevate cursor-pointer h-full transition-all hover:border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Pill className="mr-2 h-5 w-5 text-primary" />
              Recently Prescribed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.recentMedications?.length > 0 ? (
              <div className="space-y-3 mt-2">
                {summary.recentMedications.slice(0,3).map((med, i) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <p className="font-medium text-primary">{med.medicationName}</p>
                    <p className="text-sm">{med.dosage} • {med.frequency}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">No recent prescriptions.</p>
            )}
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
