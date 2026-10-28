import { listCities } from "@vybe/core/catalog";
import Link from "next/link";
import { btn } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">This page isn&apos;t here</h1>
      <p className="mt-3 text-muted">The listing may have been sold, rented or taken down by the seller. Pick a city to keep looking.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {listCities().map((c) => (
          <Link key={c.id} href={`/${c.id}`} className={`${btn.ghost} ${btn.small}`}>
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
