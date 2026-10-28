import Link from "next/link";
import { Fragment } from "react";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
      {items.map((it, i) => (
        <Fragment key={it.label}>
          {i > 0 && <span aria-hidden> / </span>}
          {it.href ? (
            <Link href={it.href} className="hover:text-ink">
              {it.label}
            </Link>
          ) : (
            <span className="text-ink" aria-current="page">
              {it.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
