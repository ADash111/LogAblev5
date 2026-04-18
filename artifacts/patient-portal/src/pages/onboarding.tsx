import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useCompleteOnboarding } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Activity, Loader2, User, Stethoscope, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  role: z.enum(["patient", "doctor", "admin"], {
    required_error: "Please select a role.",
  }),
  name: z.string().min(2, "Name must be at least 2 characters."),
  // Patient fields
  dateOfBirth: z.string().optional(),
  heightCm: z.coerce.number().optional(),
  weightKg: z.coerce.number().optional(),
  conditions: z.string().optional(),
  // Doctor fields
  qualifications: z.string().optional(),
  specialty: z.string().optional(),
});

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      conditions: "",
      qualifications: "",
      specialty: "",
    },
  });

  const selectedRole = form.watch("role");

  const completeOnboarding = useCompleteOnboarding({
    mutation: {
      onSuccess: () => {
        toast({ title: "Profile setup complete", description: "Welcome to LogAble." });
        setLocation("/dashboard");
      },
      onError: (err) => {
        toast({ title: "Error", description: "Failed to setup profile.", variant: "destructive" });
      }
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    completeOnboarding.mutate({
      data: {
        role: values.role,
        name: values.name,
        dateOfBirth: values.role === "patient" ? values.dateOfBirth : null,
        heightCm: values.role === "patient" ? values.heightCm : null,
        weightKg: values.role === "patient" ? values.weightKg : null,
        conditions: values.role === "patient" ? values.conditions : null,
        qualifications: values.role === "doctor" ? values.qualifications : null,
        specialty: values.role === "doctor" ? values.specialty : null,
      }
    });
  }

  const showPatientFields = selectedRole === "patient";
  const showDoctorFields = selectedRole === "doctor";

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Activity className="h-8 w-8 text-primary" />
          </div>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>Tell us a bit about yourself to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-base">I am a...</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-3 gap-4"
                        >
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <RadioGroupItem value="patient" className="peer sr-only" id="role-patient" />
                                <Label htmlFor="role-patient" className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                                  <User className="mb-3 h-6 w-6 text-primary" />
                                  <span className="font-semibold">Patient</span>
                                </Label>
                              </div>
                            </FormControl>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <RadioGroupItem value="doctor" className="peer sr-only" id="role-doctor" />
                                <Label htmlFor="role-doctor" className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                                  <Stethoscope className="mb-3 h-6 w-6 text-primary" />
                                  <span className="font-semibold">Doctor</span>
                                </Label>
                              </div>
                            </FormControl>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <RadioGroupItem value="admin" className="peer sr-only" id="role-admin" />
                                <Label htmlFor="role-admin" className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                                  <ShieldCheck className="mb-3 h-6 w-6 text-primary" />
                                  <span className="font-semibold">Admin</span>
                                </Label>
                              </div>
                            </FormControl>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedRole && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="h-px bg-border/50 my-6" />
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedRole === "patient" && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="heightCm"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Height (cm)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="175" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="weightKg"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Weight (kg)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="70" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <FormField
                          control={form.control}
                          name="conditions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Medical Conditions</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Any known medical conditions or allergies..." className="resize-none h-24" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {selectedRole === "doctor" && (
                      <>
                        <FormField
                          control={form.control}
                          name="specialty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Specialty</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Cardiology, General Practice" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="qualifications"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qualifications</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. MD, PhD" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={completeOnboarding.isPending || !selectedRole}>
                  {completeOnboarding.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Complete Setup
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Simple label wrapper
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />
}
