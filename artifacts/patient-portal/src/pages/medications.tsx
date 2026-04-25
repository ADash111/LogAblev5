import { useGetMyMedications, useGetMyPatients, useGetPatientMedications, useAddMedication, useUpdateMedication, useGetMyProfile, getGetMyMedicationsQueryKey, getGetPatientMedicationsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pill, Plus, Clock, Info, Ban, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function MedicationsPage() {
  const { data: profile, isLoading } = useGetMyProfile();

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="border-b border-border/40 bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold flex items-center">
              <Pill className="h-5 w-5 mr-2 text-primary" />
              Medications
            </h1>
          </div>
          {profile?.role === "doctor" && (
            <div className="flex items-center gap-2">
              <ViewPatientMedicationsDialog />
              <AddMedicationDialog />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {profile?.role === "patient" ? <PatientMedicationsView /> : <DoctorMedicationsView />}
      </main>
    </div>
  );
}

function PatientMedicationsView() {
  const { data: medications, isLoading } = useGetMyMedications();

  if (isLoading) return <div className="animate-pulse space-y-8">
    <div className="h-40 bg-muted rounded-xl" />
    <div className="h-40 bg-muted rounded-xl" />
  </div>;

  if (!medications?.current.length && !medications?.past.length) {
    return (
      <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-2xl max-w-3xl mx-auto">
        <Pill className="h-12 w-12 mx-auto mb-4 text-muted/50" />
        <p className="text-lg">No medications found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          Current Medications
          <Badge className="ml-3 bg-primary">{medications.current.length}</Badge>
        </h2>
        {medications.current.length === 0 ? (
          <p className="text-muted-foreground">No active medications.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.current.map(med => (
              <MedicationCard key={med.id} med={med} />
            ))}
          </div>
        )}
      </section>

      {medications.past.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Past Medications</h2>
          <div className="flex overflow-x-auto pb-4 gap-4 snap-x">
            {medications.past.map(med => (
              <div key={med.id} className="snap-start shrink-0 w-[300px]">
                <Card className="opacity-70 hover:opacity-100 transition-opacity bg-muted/30">
                  <CardContent className="p-4">
                    <p className="font-semibold text-lg line-through text-muted-foreground">{med.medicationName}</p>
                    <p className="text-sm mt-1">{med.dosage}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MedicationCard({ med }: { med: any }) {
  return (
    <Card className="border-l-4 border-l-primary hover-elevate">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-xl text-primary">{med.medicationName}</h3>
            <p className="text-muted-foreground font-medium">{med.dosage}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          {med.frequency && (
            <div className="bg-secondary/40 p-2 rounded-md">
              <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">Frequency</span>
              <span className="font-medium">{med.frequency}</span>
            </div>
          )}
          {med.timeToTake && (
            <div className="bg-secondary/40 p-2 rounded-md flex items-center">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              <span className="font-medium">{med.timeToTake}</span>
            </div>
          )}
          {med.conditionInfo && (
            <div className="col-span-2 mt-2 flex items-start text-muted-foreground bg-muted/30 p-2 rounded-md">
              <Info className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
              <span>For: {med.conditionInfo}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DoctorMedicationsView() {
  return (
    <div className="max-w-4xl mx-auto text-center py-20">
      <div className="bg-secondary/20 p-8 rounded-2xl border border-border inline-block">
        <Pill className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Medication Management</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Use the actions in the header to prescribe new medications or view existing patient records.
        </p>
        <div className="flex justify-center gap-4">
          <AddMedicationDialog variant="default" />
          <ViewPatientMedicationsDialog variant="outline" />
        </div>
      </div>
    </div>
  );
}

function DiscontinueButton({ med, patientId }: { med: any; patientId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const updateMed = useUpdateMedication({
    mutation: {
      onSuccess: async () => {
        toast({
          title: "Prescription discontinued",
          description: `${med.medicationName} moved to past medications.`,
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetPatientMedicationsQueryKey(patientId) }),
          queryClient.invalidateQueries({ queryKey: getGetMyMedicationsQueryKey() }),
        ]);
        setOpen(false);
      },
      onError: () => {
        toast({
          title: "Could not discontinue",
          description: "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          data-testid={`button-discontinue-${med.id}`}
        >
          <Ban className="h-4 w-4 mr-1.5" />
          Discontinue
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discontinue {med.medicationName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the prescription as no longer active. It will still
            be kept in the patient's medical record under <strong>Past Medications</strong> for
            both you and the patient to reference.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={updateMed.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={updateMed.isPending}
            onClick={(e) => {
              e.preventDefault();
              updateMed.mutate({ id: med.id, data: { isCurrent: false } });
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {updateMed.isPending ? "Discontinuing…" : "Yes, discontinue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ViewPatientMedicationsDialog({ variant = "outline" }: { variant?: "default" | "outline" }) {
  const [open, setOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const { data: patients } = useGetMyPatients();
  
  const { data: patientMeds, isLoading } = useGetPatientMedications(selectedPatientId, {
    query: { enabled: !!selectedPatientId, queryKey: getGetPatientMedicationsQueryKey(selectedPatientId) }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className="rounded-full">View Records</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Patient Medications</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select patient to view" />
            </SelectTrigger>
            <SelectContent>
              {patients?.map(p => (
                <SelectItem key={p.clerkId} value={p.clerkId}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1 overflow-y-auto pr-2">
            {selectedPatientId && isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : selectedPatientId && patientMeds ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    Current Medications
                    <Badge variant="secondary">{patientMeds.current.length}</Badge>
                  </h3>
                  {patientMeds.current.length === 0 ? (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg text-center">None</p>
                  ) : (
                    <div className="grid gap-3">
                      {patientMeds.current.map(med => (
                        <div key={med.id} className="p-3 border rounded-lg bg-card text-sm flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-primary">{med.medicationName}</div>
                            <div className="text-muted-foreground mt-1">
                              {[med.dosage, med.frequency].filter(Boolean).join(" • ") || "No dosage info"}
                            </div>
                            {med.conditionInfo && (
                              <div className="text-xs text-muted-foreground mt-1">For: {med.conditionInfo}</div>
                            )}
                          </div>
                          <DiscontinueButton med={med} patientId={selectedPatientId} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                    <History className="h-4 w-4" />
                    Past Medications
                    <Badge variant="outline">{patientMeds.past.length}</Badge>
                  </h3>
                  {patientMeds.past.length === 0 ? (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg text-center">No past prescriptions on record.</p>
                  ) : (
                    <div className="grid gap-3">
                      {patientMeds.past.map(med => (
                        <div key={med.id} className="p-3 border rounded-lg bg-muted/30 text-sm">
                          <div className="font-medium line-through text-muted-foreground">{med.medicationName}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {[med.dosage, med.frequency].filter(Boolean).join(" • ") || "No dosage info"}
                          </div>
                          {med.conditionInfo && (
                            <div className="text-xs text-muted-foreground mt-1">For: {med.conditionInfo}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">Select a patient above.</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddMedicationDialog({ variant = "default" }: { variant?: "default" | "outline" }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "", medicationName: "", dosage: "", frequency: "", timeToTake: "", conditionInfo: "", additionalInfo: ""
  });
  const { data: patients } = useGetMyPatients();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addMed = useAddMedication({
    mutation: {
      onSuccess: () => {
        toast({ title: "Prescription added" });
        setOpen(false);
        setFormData({ patientId: "", medicationName: "", dosage: "", frequency: "", timeToTake: "", conditionInfo: "", additionalInfo: "" });
        if (formData.patientId) {
          queryClient.invalidateQueries({ queryKey: getGetPatientMedicationsQueryKey(formData.patientId) });
        }
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className="rounded-full shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Prescribe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New Prescription</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium text-foreground">Patient</label>
            <Select value={formData.patientId} onValueChange={v => setFormData({...formData, patientId: v})}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients?.map(p => (
                  <SelectItem key={p.clerkId} value={p.clerkId}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Medication Name</label>
            <Input value={formData.medicationName} onChange={e => setFormData({...formData, medicationName: e.target.value})} placeholder="e.g. Amoxicillin" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dosage</label>
            <Input value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})} placeholder="e.g. 500mg" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Frequency</label>
            <Input value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})} placeholder="e.g. Twice daily" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Time to Take</label>
            <Input value={formData.timeToTake} onChange={e => setFormData({...formData, timeToTake: e.target.value})} placeholder="e.g. Morning, with food" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">For Condition</label>
            <Input value={formData.conditionInfo} onChange={e => setFormData({...formData, conditionInfo: e.target.value})} placeholder="e.g. Infection" />
          </div>

          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Additional Instructions</label>
            <Input value={formData.additionalInfo} onChange={e => setFormData({...formData, additionalInfo: e.target.value})} placeholder="Complete full course..." />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            disabled={!formData.patientId || !formData.medicationName || addMed.isPending}
            onClick={() => addMed.mutate({ data: formData })}
          >
            Create Prescription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
