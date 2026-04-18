import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMyProfile } from "@workspace/api-client-react";

// Pages
import HomePage from "@/pages/home";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import MessagesPage from "@/pages/messages";
import AppointmentsPage from "@/pages/appointments";
import VitalsPage from "@/pages/vitals";
import MedicationsPage from "@/pages/medications";
import NotFound from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(185, 60%, 30%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInputBackground: "hsl(214, 20%, 96%)",
    colorText: "hsl(220, 50%, 15%)",
    colorTextSecondary: "hsl(215, 15%, 45%)",
    colorInputText: "hsl(220, 50%, 15%)",
    colorNeutral: "hsl(214, 20%, 90%)",
    borderRadius: "0.75rem",
    fontFamily: "'Inter', sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "shadow-lg border border-border rounded-2xl w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "hsl(220, 50%, 15%)" },
    headerSubtitle: { color: "hsl(215, 15%, 45%)" },
    socialButtonsBlockButtonText: { color: "hsl(220, 50%, 15%)" },
    formFieldLabel: { color: "hsl(220, 50%, 15%)" },
    footerActionLink: { color: "hsl(185, 60%, 30%)" },
    footerActionText: { color: "hsl(215, 15%, 45%)" },
    dividerText: { color: "hsl(215, 15%, 45%)" },
    formFieldSuccessText: { color: "hsl(185, 60%, 30%)" },
    alertText: { color: "hsl(0, 84%, 60%)" },
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <HomePage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: any }) {
  const { isLoaded, isSignedIn } = useUser();
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfile();

  if (!isLoaded || isProfileLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isSignedIn) {
    return <Redirect to="/" />;
  }

  if (profile && profile.role === null && window.location.pathname !== `${basePath}/onboarding`) {
    return <Redirect to="/onboarding" />;
  }

  return <Component />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={{
        signIn: {
          start: {
            title: "Welcome to LogAble",
            subtitle: "Sign in to access your portal",
          },
        },
        signUp: {
          start: {
            title: "Join LogAble",
            subtitle: "Create your secure account",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/onboarding">
              <ProtectedRoute component={OnboardingPage} />
            </Route>
            <Route path="/dashboard">
              <ProtectedRoute component={DashboardPage} />
            </Route>
            <Route path="/messages">
              <ProtectedRoute component={MessagesPage} />
            </Route>
            <Route path="/appointments">
              <ProtectedRoute component={AppointmentsPage} />
            </Route>
            <Route path="/vitals">
              <ProtectedRoute component={VitalsPage} />
            </Route>
            <Route path="/medications">
              <ProtectedRoute component={MedicationsPage} />
            </Route>
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
