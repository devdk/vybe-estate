"use client";

import Link from "next/link";
import { btn } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">This page didn&apos;t load</h1>
      <p className="mt-3 text-muted">Something went wrong on our side. Your shortlist is saved on this device and nothing was lost.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className={btn.primary}>
          Try again
        </button>
        <Link href="/" className={btn.ghost}>
          Go to the home page
        </Link>
      </div>
    </div>
  );
}
