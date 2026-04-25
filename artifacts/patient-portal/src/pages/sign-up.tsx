import { SignUp, Show, useUser } from "@clerk/react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function SignedInRedirect() {
  const [, setLocation] = useLocation();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation("/dashboard");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-lg p-8 text-center space-y-5">
      <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
        <CheckCircle2 className="h-7 w-7 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">You're signed in</h2>
        <p className="text-sm text-muted-foreground">
          Taking you to your dashboard now…
        </p>
      </div>
      <Button
        className="w-full"
        onClick={() => setLocation("/dashboard")}
      >
        Take me to the dashboard
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

export default function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      <div className="relative z-10 w-full max-w-[400px]">
        <Show when="signed-out">
          <SignUp
            routing="path"
            path={`${basePath}/sign-up`}
            signInUrl={`${basePath}/sign-in`}
            forceRedirectUrl={`${basePath}/dashboard`}
            fallbackRedirectUrl={`${basePath}/dashboard`}
          />
        </Show>
        <Show when="signed-in">
          <SignedInRedirect />
        </Show>
      </div>
    </div>
  );
}
