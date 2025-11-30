"use client";

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AvatarCircles } from "@/components/ui/avatar-circles";
import { Button } from "@/components/ui/button";
import { Highlighter } from "@/components/ui/highlighter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import { getEnabledAuthProviders } from "@/lib/auth-providers";

const VercelIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg
    aria-label="Vercel"
    className={className}
    fill="currentColor"
    role="img"
    viewBox="0 0 76 65"
  >
    <title>Vercel</title>
    <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
  </svg>
);

const GitHubIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg
    aria-label="GitHub"
    className={className}
    fill="currentColor"
    role="img"
    viewBox="0 0 24 24"
  >
    <title>GitHub</title>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const GoogleIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg aria-label="Google" className={className} role="img" viewBox="0 0 24 24">
    <title>Google</title>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="currentColor"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="currentColor"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="currentColor"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="currentColor"
    />
  </svg>
);

const LogoIcon = () => (
  <div className="flex size-16 items-center justify-center">
    <Image
      alt="Flowzipper"
      className="h-16 w-16 dark:hidden"
      height={64}
      src="/favicon.png"
      width={64}
    />
    <Image
      alt="Flowzipper"
      className="hidden h-16 w-16 dark:block"
      height={64}
      src="/favicon-dark.png"
      width={64}
    />
  </div>
);

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Login flow handles multiple auth providers and modes
export default function LoginPage() {
  const { data: session, isPending } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<
    "github" | "google" | "vercel" | null
  >(null);

  const enabledProviders = getEnabledAuthProviders();

  // Redirect if already logged in
  const isAnonymous =
    !session?.user ||
    session.user.name === "Anonymous" ||
    session.user.email?.startsWith("temp-");

  if (!isPending && session?.user && !isAnonymous) {
    redirect("/");
  }

  const handleSocialSignIn = async (
    provider: "github" | "google" | "vercel"
  ) => {
    try {
      setLoadingProvider(provider);
      await signIn.social({ provider, callbackURL: "/" });
    } catch {
      toast.error(`Failed to sign in with ${provider}`);
      setLoadingProvider(null);
    }
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Handles both signup and signin flows with validation
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const signUpResponse = await signUp.email({
          email,
          password,
          name,
        });
        if (signUpResponse.error) {
          setError(signUpResponse.error.message || "Sign up failed");
          return;
        }

        const signInResponse = await signIn.email({
          email,
          password,
        });
        if (signInResponse.error) {
          setError(signInResponse.error.message || "Sign in failed");
          return;
        }

        toast.success("Account created successfully!");
        redirect("/");
      } else {
        const response = await signIn.email({
          email,
          password,
        });
        if (response.error) {
          setError(response.error.message || "Sign in failed");
          return;
        }

        toast.success("Signed in successfully!");
        redirect("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  const hasSocialProviders =
    enabledProviders.vercel ||
    enabledProviders.github ||
    enabledProviders.google;

  const primaryButtonLabel = mode === "signin" ? "Log In" : "Sign Up";

  const avatarUrls = [
    {
      imageUrl: "https://avatars.githubusercontent.com/u/16860528",
      profileUrl: "#",
    },
    {
      imageUrl: "https://avatars.githubusercontent.com/u/20110627",
      profileUrl: "#",
    },
    {
      imageUrl: "https://avatars.githubusercontent.com/u/106103625",
      profileUrl: "#",
    },
    {
      imageUrl: "https://avatars.githubusercontent.com/u/59228569",
      profileUrl: "#",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      {/* Main content */}
      <div className="w-full max-w-md space-y-8 px-4">
        {/* Logo and title */}
        <div className="flex flex-col items-center space-y-4">
          <LogoIcon />
          <div className="space-y-2 text-center">
            <h1 className="font-semibold text-2xl tracking-tight">
              {mode === "signin"
                ? "Log in to Flowzipper"
                : "Create your account"}
            </h1>
          </div>
        </div>

        {/* Social proof and promotional message */}
        <div className="flex flex-col items-center space-y-4">
          <p className="text-center text-base text-muted-foreground">
            Join <Highlighter color="#d97706">thousands of teams</Highlighter>{" "}
            building{" "}
            <Highlighter color="#2563eb">powerful AI workflows</Highlighter>{" "}
            with Flowzipper
          </p>
          <AvatarCircles avatarUrls={avatarUrls} numPeople={1200} />
        </div>

        {/* Auth form */}
        <div className="space-y-4">
          {/* Social login buttons */}
          {hasSocialProviders && (
            <div className="space-y-3">
              {enabledProviders.google && (
                <Button
                  className="w-full"
                  disabled={loadingProvider !== null}
                  onClick={() => handleSocialSignIn("google")}
                  type="button"
                  variant="outline"
                >
                  {loadingProvider === "google" ? (
                    <Spinner className="mr-2 size-4" />
                  ) : (
                    <GoogleIcon className="mr-2" />
                  )}
                  Login with Google
                </Button>
              )}
              {enabledProviders.github && (
                <Button
                  className="w-full"
                  disabled={loadingProvider !== null}
                  onClick={() => handleSocialSignIn("github")}
                  type="button"
                  variant="outline"
                >
                  {loadingProvider === "github" ? (
                    <Spinner className="mr-2 size-4" />
                  ) : (
                    <GitHubIcon className="mr-2" />
                  )}
                  Login with GitHub
                </Button>
              )}
              {enabledProviders.vercel && (
                <Button
                  className="w-full"
                  disabled={loadingProvider !== null}
                  onClick={() => handleSocialSignIn("vercel")}
                  type="button"
                  variant="outline"
                >
                  {loadingProvider === "vercel" ? (
                    <Spinner className="mr-2 size-4" />
                  ) : (
                    <VercelIcon className="mr-2" />
                  )}
                  Login with Vercel
                </Button>
              )}
            </div>
          )}

          {/* Divider */}
          {enabledProviders.email && hasSocialProviders && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>
          )}

          {/* Email form */}
          {enabledProviders.email && (
            <form className="space-y-4" onSubmit={handleEmailAuth}>
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    autoComplete="name"
                    id="name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alan Turing"
                    required
                    type="text"
                    value={name}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  autoComplete="email"
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alan.turing@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <Link
                      className="text-muted-foreground text-sm hover:text-foreground"
                      href="/forgot-password"
                    >
                      Forgot your password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    autoComplete="current-password"
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    {showPassword ? (
                      <svg
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <title>Hide password</title>
                        <path
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    ) : (
                      <svg
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <title>Show password</title>
                        <path
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                        <path
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button className="w-full" disabled={loading} type="submit">
                {loading ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    Loading...
                  </>
                ) : (
                  primaryButtonLabel
                )}
              </Button>

              {/* Account toggle */}
              <p className="text-center text-muted-foreground text-sm">
                {mode === "signin" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      className="font-medium text-primary hover:underline"
                      onClick={() => setMode("signup")}
                      type="button"
                    >
                      Sign up
                    </button>
                    .
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      className="font-medium text-primary hover:underline"
                      onClick={() => setMode("signin")}
                      type="button"
                    >
                      Sign in
                    </button>
                    .
                  </>
                )}
              </p>
            </form>
          )}
        </div>

        {/* Terms and privacy */}
        <p className="text-center text-muted-foreground text-xs">
          By signing in, you agree to our{" "}
          <Link className="underline hover:text-foreground" href="/terms">
            Terms
          </Link>{" "}
          and{" "}
          <Link className="underline hover:text-foreground" href="/privacy">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
