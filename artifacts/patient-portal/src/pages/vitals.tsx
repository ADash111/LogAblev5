import { useGetMyVitals, useAddVitalLog, useGetCriticalVitals, useDismissCriticalVital, useGetMyPatients, useGetPatientVitals, useGetMyProfile, useGetAbnormalVitals, getGetMyVitalsQueryKey, getGetCriticalVitalsQueryKey, getGetAbnormalVitalsQueryKey, getGetPatientVitalsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Activity, AlertTriangle, ChevronDown, Check, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";

// ── Vital classification helpers ──────────────────────────────────────────────
type VitalStatus = "normal" | "abnormal" | "critical";

function classifyHeartRate(hr: number): VitalStatus {
  if (hr < 40 || hr > 130) return "critical";
  if (hr < 60 || hr > 100) return "abnormal";
  return "normal";
}

function classifyRespiration(resp: number): VitalStatus {
  if (resp < 8 || resp > 30) return "critical";
  if (resp < 12 || resp > 20) return "abnormal";
  return "normal";
}

function classifySpO2(spo2: number): VitalStatus {
  if (spo2 < 90) return "critical";
  if (spo2 < 95) return "abnormal";
  return "normal";
}

function classifyBP(systolic: number, diastolic: number): VitalStatus {
  if (systolic < 80 || systolic > 180 || diastolic < 50 || diastolic > 120) return "critical";
  if (systolic < 90 || systolic > 120 || diastolic < 60 || diastolic > 80) return "abnormal";
  return "normal";
}

function overallVitalStatus(vital: any): VitalStatus {
  if (vital.isCritical) return "critical";
  const statuses: VitalStatus[] = [];
  if (vital.heartRate != null) statuses.push(classifyHeartRate(vital.heartRate));
  if (vital.respirationRate != null) statuses.push(classifyRespiration(vital.respirationRate));
  if (vital.spo2 != null) statuses.push(classifySpO2(vital.spo2));
  if (vital.systolicBp != null && vital.diastolicBp != null) statuses.push(classifyBP(vital.systolicBp, vital.diastolicBp));
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("abnormal")) return "abnormal";
  return "normal";
}

const statusConfig = {
  normal:   { bg: "bg-green-50",  border: "border-green-200",  icon: "bg-green-100 text-green-600",  badge: "text-green-700",   label: "Normal"   },
  abnormal: { bg: "bg-amber-50",  border: "border-amber-200",  icon: "bg-amber-100 text-amber-600",  badge: "text-amber-700",   label: "Abnormal" },
  critical: { bg: "bg-red-50",    border: "border-red-300",    icon: "bg-red-100 text-red-600",      badge: "text-red-700",     label: "Critical" },
};

// Inline colored metric badge
function VitalBadge({ label, value, unit, status, normalRange }: {
  label: string;
  value: string | number | null | undefined;
  unit: string;
  status?: VitalStatus;
  normalRange: string;
}) {
  const s = status ?? "normal";
  const colors = {
    normal:   "bg-green-50  border-green-200  text-green-800",
    abnormal: "bg-amber-50  border-amber-200  text-amber-800",
    critical: "bg-red-50    border-red-300    text-red-800 font-bold",
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[s]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-xl font-semibold leading-none">
        {value ?? "—"} <span className="text-xs font-normal opacity-60">{value != null ? unit : ""}</span>
      </p>
      <p className="text-[10px] opacity-50 mt-1">Normal: {normalRange}</p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function VitalsPage() {
  const { data: profile, isLoading } = useGetMyProfile();

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent sticky top-0 z-10">
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

// ── Patient view ───────────────────────────────────────────────────────────────
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

// ── Vital log card (patient & doctor detail) ───────────────────────────────────
function VitalLogCard({ vital }: { vital: any }) {
  const [open, setOpen] = useState(false);
  const status = overallVitalStatus(vital);
  const cfg = statusConfig[status];

  const hrStatus  = vital.heartRate != null     ? classifyHeartRate(vital.heartRate)                                   : undefined;
  const spStatus  = vital.spo2 != null          ? classifySpO2(vital.spo2)                                             : undefined;
  const bpStatus  = vital.systolicBp != null && vital.diastolicBp != null ? classifyBP(vital.systolicBp, vital.diastolicBp) : undefined;
  const respStatus = vital.respirationRate != null ? classifyRespiration(vital.respirationRate)                        : undefined;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`overflow-hidden transition-colors border ${cfg.border} ${cfg.bg}`}>
        <CollapsibleTrigger asChild>
          <div className="p-4 flex items-center justify-between cursor-pointer hover:brightness-95 transition-all">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${cfg.icon}`}>
                {status === "critical" ? <AlertTriangle className="h-5 w-5" /> :
                 status === "abnormal" ? <AlertCircle className="h-5 w-5" /> :
                 <Activity className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-semibold text-base">{format(new Date(vital.loggedAt), "MMMM d, yyyy")}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(vital.loggedAt), "h:mm a")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-xs font-bold uppercase tracking-wider hidden sm:block ${cfg.badge}`}>
                {cfg.label}
              </span>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 border-t border-black/5 bg-white/60">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <VitalBadge label="Heart Rate"    value={vital.heartRate}       unit="bpm"  status={hrStatus}   normalRange="60–100" />
              <VitalBadge label="Blood Pressure" value={vital.systolicBp != null ? `${vital.systolicBp}/${vital.diastolicBp}` : null} unit="mmHg" status={bpStatus} normalRange="90/60–120/80" />
              <VitalBadge label="SpO₂"           value={vital.spo2}            unit="%"    status={spStatus}   normalRange="95–100%" />
              <VitalBadge label="Respiration"   value={vital.respirationRate}  unit="br/m" status={respStatus} normalRange="12–20" />
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

// ── Doctor view ────────────────────────────────────────────────────────────────
function DoctorVitalsView() {
  const { data: criticalVitals } = useGetCriticalVitals();
  const { data: abnormalVitals } = useGetAbnormalVitals();
  const { data: patients } = useGetMyPatients();
  const dismissVital = useDismissCriticalVital();
  const queryClient = useQueryClient();

  const handleDismiss = (id: number) => {
    dismissVital.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCriticalVitalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAbnormalVitalsQueryKey() });
      }
    });
  };

  const activeCritical = criticalVitals?.filter(v => !v.isDismissed) ?? [];
  const activeAbnormal = abnormalVitals?.filter(v => !v.isDismissed) ?? [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Critical Alerts */}
      {activeCritical.length > 0 && (
        <section>
          <h2 className="text-xl font-bold flex items-center gap-2 text-red-700 mb-4">
            <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
            Critical Alerts
            <span className="ml-1 text-xs font-bold bg-red-600 text-white rounded-full px-2 py-0.5">{activeCritical.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCritical.map(vital => (
              <AlertCard key={vital.logId} vital={vital} type="critical" onDismiss={handleDismiss} isPending={dismissVital.isPending} />
            ))}
          </div>
        </section>
      )}

      {/* Abnormal Alerts */}
      {activeAbnormal.length > 0 && (
        <section>
          <h2 className="text-xl font-bold flex items-center gap-2 text-amber-700 mb-4">
            <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
            Abnormal Readings
            <span className="ml-1 text-xs font-bold bg-amber-500 text-white rounded-full px-2 py-0.5">{activeAbnormal.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAbnormal.map(vital => (
              <AlertCard key={vital.logId} vital={vital} type="abnormal" onDismiss={() => {}} isPending={false} />
            ))}
          </div>
        </section>
      )}

      {activeCritical.length === 0 && activeAbnormal.length === 0 && (
        <div className="py-10 text-center flex flex-col items-center text-muted-foreground bg-green-50 border border-green-100 rounded-2xl">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <p className="font-semibold text-green-800">All clear</p>
          <p className="text-sm mt-1 text-green-700/70">No abnormal or critical vitals at this time.</p>
        </div>
      )}

      {/* Patient records */}
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

function AlertCard({ vital, type, onDismiss, isPending }: {
  vital: any;
  type: "critical" | "abnormal";
  onDismiss: (id: number) => void;
  isPending: boolean;
}) {
  const isCritical = type === "critical";
  const cardBg = isCritical ? "bg-red-50 border-red-300" : "bg-amber-50 border-amber-200";
  const labelColor = isCritical ? "text-red-800" : "text-amber-800";
  const valueColor = isCritical ? "text-red-700 font-bold" : "text-amber-700 font-semibold";

  const metrics = [
    vital.heartRate    != null && { key: "HR",   val: `${vital.heartRate} bpm`,              status: classifyHeartRate(vital.heartRate) },
    vital.systolicBp   != null && { key: "BP",   val: `${vital.systolicBp}/${vital.diastolicBp}`, status: classifyBP(vital.systolicBp, vital.diastolicBp) },
    vital.spo2         != null && { key: "SpO₂", val: `${vital.spo2}%`,                      status: classifySpO2(vital.spo2) },
    vital.respirationRate != null && { key: "Resp", val: `${vital.respirationRate} br/m`,    status: classifyRespiration(vital.respirationRate) },
  ].filter(Boolean) as Array<{ key: string; val: string; status: VitalStatus }>;

  return (
    <Card className={`border shadow-sm ${cardBg}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className={`font-bold text-lg ${labelColor}`}>{vital.patientName}</p>
            <p className="text-sm text-muted-foreground">{format(new Date(vital.loggedAt), "MMM d, h:mm a")}</p>
          </div>
          {isCritical && (
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-100"
              onClick={() => onDismiss(vital.logId)}
              disabled={isPending}
            >
              <Check className="h-4 w-4 mr-1" /> Dismiss
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {metrics.map(({ key, val, status }) => (
            <span
              key={key}
              className={`px-2 py-1 rounded-md border text-xs font-medium ${
                status === "critical" ? "bg-red-100 border-red-300 text-red-800" :
                status === "abnormal" ? "bg-amber-100 border-amber-300 text-amber-800" :
                "bg-white border-border text-foreground"
              }`}
            >
              {key}: <strong>{val}</strong>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Heart Rate (bpm)</label>
            <p className="text-[10px] text-muted-foreground">Normal: 60–100</p>
            <Input type="number" value={formData.heartRate} onChange={e => setFormData({...formData, heartRate: e.target.value})} placeholder="e.g. 72" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">SpO₂ (%)</label>
            <p className="text-[10px] text-muted-foreground">Normal: 95–100%</p>
            <Input type="number" value={formData.spo2} onChange={e => setFormData({...formData, spo2: e.target.value})} placeholder="e.g. 98" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Systolic BP</label>
            <p className="text-[10px] text-muted-foreground">Normal: 90–120</p>
            <Input type="number" value={formData.systolicBp} onChange={e => setFormData({...formData, systolicBp: e.target.value})} placeholder="e.g. 115" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Diastolic BP</label>
            <p className="text-[10px] text-muted-foreground">Normal: 60–80</p>
            <Input type="number" value={formData.diastolicBp} onChange={e => setFormData({...formData, diastolicBp: e.target.value})} placeholder="e.g. 75" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="text-sm font-medium">Respiration Rate (br/min)</label>
            <p className="text-[10px] text-muted-foreground">Normal: 12–20</p>
            <Input type="number" value={formData.respirationRate} onChange={e => setFormData({...formData, respirationRate: e.target.value})} placeholder="e.g. 16" />
          </div>
          <div className="space-y-1.5 col-span-2">
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
