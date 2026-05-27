import {
  ClerkProvider,
  SignIn,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/clerk-react";
import Dashboard from "./pages/Dashboard";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables.");
}

function Router() {
  const path = window.location.pathname;

  if (path === "/dashboard") {
    return (
      <>
        <SignedIn>
          <Dashboard />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </>
    );
  }

  // Root and all other paths → sign-in page
  return (
    <>
      <SignedIn>
        {/* Already signed in at "/" → redirect to dashboard */}
        <meta httpEquiv="refresh" content="0;url=/dashboard" />
        <script
          dangerouslySetInnerHTML={{
            __html: "window.location.replace('/dashboard')",
          }}
        />
      </SignedIn>
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <SignIn routing="hash" afterSignInUrl="/dashboard" />
        </div>
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router />
    </ClerkProvider>
  );
}
