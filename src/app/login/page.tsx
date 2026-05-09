import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";

// "Photo of a white truck with lights" — cargo truck on the Altai road at
// twilight (Pexels, 11053643). Free for commercial use; committed to
// /public so the login page doesn't pay for an external fetch.
const HERO_IMAGE = "/login-bg.jpg";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh bg-surface-1 lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <Link href="/login" aria-label="Damm">
            {/* Official wordmark from Wikimedia Commons (File:Damm_logo.svg). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/damm-logo.svg" alt="Damm" className="h-7 w-auto" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-surface-2 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt="Cargo truck on a mountain road at twilight"
          className="absolute inset-0 h-full w-full object-cover object-[30%_50%]"
        />
        {/* Vignette to keep the brand chrome legible against the photo. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/10 to-transparent"
        />
      </div>
    </div>
  );
}
