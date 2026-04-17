import { useGetMyVitals, useAddVitalLog, useGetCriticalVitals, useDismissCriticalVital, useGetMyPatients, useGetPatientVitals, useGetMyProfile, getGetMyVitalsQueryKey, getGetCriticalVitalsQueryKey, getGetPatientVitalsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Activity, AlertTriangle, ChevronDown, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";

export default function VitalsPage() {
  const { data: profile, isLoading } = useGetMyProfile();

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border/40 bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              Vitals Tracker
            </h1>
          </div>
          {profile?.role === "patient" && <AddVitalDialog />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {profile?.role === "patient" ? <PatientVitalsView /> : <DoctorVitalsView />}
      </main>
    </div>
  );
}

function PatientVitalsView() {
  const { data: vitals, isLoading } = useGetMyVitals();

  if (isLoading) return <div className="animate-pulse space-y-4">
    {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
  </div>;

  if (!vitals?.length) {
    return (
      <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
        <Activity className="h-12 w-12 mx-auto mb-4 text-muted/50" />
        <p className="text-lg">No vitals logged yet.</p>
        <p className="text-sm mt-2">Click the Add New Log button to start tracking your health.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {vitals.map(vital => (
        <VitalLogCard key={vital.id} vital={vital} />
      ))}
    </div>
  );
}

function VitalLogCard({ vital }: { vital: any }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`overflow-hidden transition-colors ${vital.isCritical ? 'border-destructive/50 bg-destructive/5' : ''}`}>
        <CollapsibleTrigger asChild>
          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${vital.isCritical ? 'bg-destructive/20 text-destructive' : 'bg-primary/10 text-primary'}`}>
                {vital.isCritical ? <AlertTriangle className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-semibold text-base">{format(new Date(vital.loggedAt), 'MMMM d, yyyy')}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(vital.loggedAt), 'h:mm a')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {vital.isCritical && <span className="text-xs font-bold uppercase tracking-wider text-destructive hidden sm:block">Attention Required</span>}
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 border-t border-border/50 bg-card">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Heart Rate</p>
                <p className="text-xl font-medium">{vital.heartRate || "--"} <span className="text-xs text-muted-foreground">bpm</span></p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Blood Pressure</p>
                <p className="text-xl font-medium">{vital.systolicBp || "--"}/{vital.diastolicBp || "--"}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">SpO2</p>
                <p className="text-xl font-medium">{vital.spo2 || "--"} <span className="text-xs text-muted-foreground">%</span></p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Respiration</p>
                <p className="text-xl font-medium">{vital.respirationRate || "--"} <span className="text-xs text-muted-foreground">bpm</span></p>
              </div>
            </div>
            {vital.notes && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm">
                <span className="font-medium text-muted-foreground mb-1 block">Notes:</span>
                {vital.notes}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function DoctorVitalsView() {
  const { data: criticalVitals } = useGetCriticalVitals();
  const { data: patients } = useGetMyPatients();
  const dismissVital = useDismissCriticalVital();
  const queryClient = useQueryClient();

  const handleDismiss = (id: number) => {
    dismissVital.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCriticalVitalsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {criticalVitals && criticalVitals.length > 0 && (
        <section>
          <h2 className="text-xl font-bold flex items-center text-destructive mb-4">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Critical Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalVitals.map(vital => (
              <Card key={vital.logId} className="border-destructive/30 bg-destructive/5 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-lg">{vital.patientName}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(vital.loggedAt), 'MMM d, h:mm a')}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-destructive/20 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDismiss(vital.logId)}
                      disabled={dismissVital.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" /> Dismiss
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {vital.heartRate && <span className="bg-background px-2 py-1 rounded-md border border-border">HR: <strong className="text-destructive">{vital.heartRate}</strong></span>}
                    {vital.systolicBp && <span className="bg-background px-2 py-1 rounded-md border border-border">BP: <strong className="text-destructive">{vital.systolicBp}/{vital.diastolicBp}</strong></span>}
                    {vital.spo2 && <span className="bg-background px-2 py-1 rounded-md border border-border">SpO2: <strong className="text-destructive">{vital.spo2}%</strong></span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold mb-4">Patient Records</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients?.map(patient => (
            <PatientVitalsDialog key={patient.id} patient={patient} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PatientVitalsDialog({ patient }: { patient: any }) {
  const [open, setOpen] = useState(false);
  const { data: vitals, isLoading } = useGetPatientVitals(patient.clerkId, {
    query: { enabled: open, queryKey: getGetPatientVitalsQueryKey(patient.clerkId) }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="hover-elevate cursor-pointer transition-colors hover:border-primary/50">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="font-medium">{patient.name}</span>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{patient.name}'s Vitals History</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading records...</div>
          ) : !vitals?.length ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">No records found for this patient.</div>
          ) : (
            vitals.map((vital: any) => <VitalLogCard key={vital.id} vital={vital} />)
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddVitalDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    heartRate: "", respirationRate: "", systolicBp: "", diastolicBp: "", spo2: "", notes: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addVital = useAddVitalLog({
    mutation: {
      onSuccess: () => {
        toast({ title: "Vitals logged successfully" });
        setOpen(false);
        setFormData({ heartRate: "", respirationRate: "", systolicBp: "", diastolicBp: "", spo2: "", notes: "" });
        queryClient.invalidateQueries({ queryKey: getGetMyVitalsQueryKey() });
      }
    }
  });

  const handleSubmit = () => {
    addVital.mutate({
      data: {
        heartRate: formData.heartRate ? Number(formData.heartRate) : null,
        respirationRate: formData.respirationRate ? Number(formData.respirationRate) : null,
        systolicBp: formData.systolicBp ? Number(formData.systolicBp) : null,
        diastolicBp: formData.diastolicBp ? Number(formData.diastolicBp) : null,
        spo2: formData.spo2 ? Number(formData.spo2) : null,
        notes: formData.notes || null
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Add New Log
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Vitals</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Heart Rate (bpm)</label>
            <Input type="number" value={formData.heartRate} onChange={e => setFormData({...formData, heartRate: e.target.value})} placeholder="e.g. 72" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">SpO2 (%)</label>
            <Input type="number" value={formData.spo2} onChange={e => setFormData({...formData, spo2: e.target.value})} placeholder="e.g. 98" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Systolic BP</label>
            <Input type="number" value={formData.systolicBp} onChange={e => setFormData({...formData, systolicBp: e.target.value})} placeholder="e.g. 120" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Diastolic BP</label>
            <Input type="number" value={formData.diastolicBp} onChange={e => setFormData({...formData, diastolicBp: e.target.value})} placeholder="e.g. 80" />
          </div>
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Respiration Rate</label>
            <Input type="number" value={formData.respirationRate} onChange={e => setFormData({...formData, respirationRate: e.target.value})} placeholder="e.g. 16" />
          </div>
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Any symptoms or context..." />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={addVital.isPending}>Save Log</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
