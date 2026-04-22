import { useGetMyAppointments, useGetAvailableSlots, useRequestAppointment, useAddAppointmentSlot, useGetAppointmentRequests, useRespondToAppointment, useCancelAppointment, useGetMyProfile, getGetAppointmentRequestsQueryKey, getGetMyAppointmentsQueryKey, getGetAvailableSlotsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar as CalendarIcon, Clock, Plus, Bell, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AppointmentsPage() {
  const { data: profile, isLoading } = useGetMyProfile();

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border/40 bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Appointments</h1>
          </div>

          <div className="flex items-center gap-2">
            {profile?.role === "patient" ? (
              <RequestAppointmentDialog />
            ) : (
              <>
                <AddSlotDialog />
                <PendingRequestsSheet />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="shadow-sm">
              <CardContent className="p-2">
                <Calendar
                  mode="single"
                  className="w-full [&>div]:w-full [&_table]:w-full [&_td]:p-1 [&_th]:p-1"
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Your Schedule</h2>
            <AppointmentList role={profile?.role} />
          </div>
        </div>
      </main>
    </div>
  );
}

// Parse a 'YYYY-MM-DD' string as a local date (avoids UTC midnight → previous-day shift).
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function AppointmentList({ role }: { role?: string | null }) {
  const { data: appointments, isLoading } = useGetMyAppointments();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const cancel = useCancelAppointment({
    mutation: {
      onSuccess: () => {
        toast({ title: "Appointment cancelled" });
        queryClient.invalidateQueries({ queryKey: getGetMyAppointmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAppointmentRequestsQueryKey() });
      },
      onError: () => {
        toast({ title: "Could not cancel appointment", variant: "destructive" });
      },
    },
  });

  if (isLoading) return <div className="animate-pulse space-y-4">
    {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
  </div>;

  if (!appointments?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center">
          <CalendarIcon className="h-12 w-12 mb-4 text-muted/50" />
          <p>No appointments scheduled.</p>
        </CardContent>
      </Card>
    );
  }

  const handleCancel = (id: number, status: string) => {
    const verb = status === "pending" ? "Cancel this pending request?" : "Cancel this scheduled appointment?";
    if (!window.confirm(verb)) return;
    cancel.mutate({ id });
  };

  return (
    <div className="space-y-4">
      {appointments.map((apt) => {
        const dt = parseLocalDate(apt.requestedDate);
        const canCancel = apt.status === "pending" || apt.status === "accepted";
        return (
          <Card key={apt.id} className="hover-elevate overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="bg-secondary/50 p-4 flex flex-col justify-center items-center sm:w-32 border-b sm:border-b-0 sm:border-r border-border/50">
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">{format(dt, 'MMM')}</span>
                <span className="text-3xl font-bold">{format(dt, 'dd')}</span>
              </div>
              <div className="p-4 sm:p-6 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-2 gap-3">
                  <div>
                    <h3 className="font-semibold text-lg">{role === 'patient' ? apt.doctorName : apt.patientName}</h3>
                    <div className="flex items-center text-muted-foreground mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{apt.requestedTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={apt.status === "accepted" ? "default" : apt.status === "pending" ? "secondary" : "destructive"}>
                      {apt.status}
                    </Badge>
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                        onClick={() => handleCancel(apt.id, apt.status)}
                        disabled={cancel.isPending}
                        aria-label="Cancel appointment"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
                {apt.doctorNote && (
                  <div className="mt-3 text-sm bg-muted/50 p-3 rounded-lg border border-border/50">
                    <span className="font-medium text-xs uppercase tracking-wider text-muted-foreground block mb-1">Note from Doctor</span>
                    {apt.doctorNote}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function RequestAppointmentDialog() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: slots } = useGetAvailableSlots();

  const requestAppointment = useRequestAppointment({
    mutation: {
      onSuccess: () => {
        toast({ title: "Appointment requested", description: "Waiting for doctor's approval." });
        setOpen(false);
        setDate(undefined);
        setTime("");
        queryClient.invalidateQueries({ queryKey: getGetMyAppointmentsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not request appointment. Make sure you have an assigned doctor.", variant: "destructive" });
      }
    }
  });

  const availableTimesForDate = date
    ? slots?.filter(s => s.slotDate === format(date, 'yyyy-MM-dd') && s.isAvailable).map(s => s.slotTime)
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="h-4 w-4 mr-2" /> Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Appointment</DialogTitle>
          <DialogDescription>Pick a date to see available time slots.</DialogDescription>
        </DialogHeader>
        <div className="py-2 grid gap-5">
          <div className="border border-border rounded-xl p-2 bg-secondary/20">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => { setDate(d); setTime(""); }}
              disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
              className="w-full [&>div]:w-full [&_table]:w-full [&_td]:p-1 [&_th]:p-1"
            />
          </div>

          {date && (
            <div className="space-y-3 animate-in fade-in">
              <label className="text-sm font-medium">Available Times</label>
              <div className="grid grid-cols-3 gap-2">
                {availableTimesForDate?.length ? (
                  availableTimesForDate.map(t => (
                    <Button
                      key={t}
                      variant={time === t ? "default" : "outline"}
                      onClick={() => setTime(t)}
                    >
                      {t}
                    </Button>
                  ))
                ) : (
                  <p className="col-span-3 text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">No slots available on this date.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!date || !time || requestAppointment.isPending}
            onClick={() => requestAppointment.mutate({
              data: {
                requestedDate: format(date!, 'yyyy-MM-dd'),
                requestedTime: time
              }
            })}
          >
            {requestAppointment.isPending ? "Requesting..." : "Send Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddSlotDialog() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addSlot = useAddAppointmentSlot({
    mutation: {
      onSuccess: () => {
        toast({ title: "Slot added", description: `${date ? format(date, 'MMM d') : ''} at ${formatTime(time)} is now available.` });
        setOpen(false);
        setTime("");
        setDate(undefined);
        queryClient.invalidateQueries({ queryKey: getGetAvailableSlotsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add slot — it may already exist.", variant: "destructive" });
      }
    }
  });

  const formatTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <Plus className="h-4 w-4 mr-2" /> Add Slot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Availability</DialogTitle>
          <DialogDescription>Choose a date and time to open for patient bookings.</DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <div className="border border-border rounded-xl p-2 bg-secondary/20">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
              className="w-full [&>div]:w-full [&_table]:w-full [&_td]:p-1 [&_th]:p-1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Time</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {time && (
              <p className="text-xs text-muted-foreground">Will be saved as: {formatTime(time)}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!date || !time || addSlot.isPending}
            onClick={() => addSlot.mutate({
              data: { slotDate: format(date!, 'yyyy-MM-dd'), slotTime: formatTime(time) }
            })}
          >
            {addSlot.isPending ? "Saving..." : "Add Slot"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PendingRequestsSheet() {
  const { data: requests } = useGetAppointmentRequests();
  const respond = useRespondToAppointment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRespond = (id: number, status: 'accepted'|'declined') => {
    respond.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Appointment ${status}` });
        queryClient.invalidateQueries({ queryKey: getGetAppointmentRequestsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyAppointmentsQueryKey() });
      }
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full relative">
          <Bell className="h-4 w-4" />
          {requests && requests.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
              {requests.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="mb-6">
          <SheetTitle>Pending Requests</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          {!requests?.length ? (
            <p className="text-muted-foreground text-center py-8">No pending requests.</p>
          ) : (
            requests.map(req => (
              <Card key={req.id}>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <p className="font-semibold">{req.patientName}</p>
                    <p className="text-sm text-muted-foreground">{new Date(req.requestedDate).toLocaleDateString()} at {req.requestedTime}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleRespond(req.id, 'accepted')}
                      disabled={respond.isPending}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleRespond(req.id, 'declined')}
                      disabled={respond.isPending}
                    >
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
