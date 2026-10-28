import { STATUS_LABEL, type PartnerType, type Sourced, type UnitStatus } from "@vybe/core";
import clsx from "clsx";
import Link from "next/link";
import type { ReactNode, SVGProps } from "react";

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition-transform duration-150 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-raised px-4 py-2.5 text-sm font-bold text-ink transition-colors duration-150 hover:border-ink disabled:cursor-not-allowed disabled:opacity-50",
  small: "!px-3 !py-1.5 !text-[13px] !rounded-lg",
};

export const chip = (on: boolean) =>
  clsx(
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors duration-150",
    on ? "border-ink bg-ink text-bg" : "border-line bg-raised text-ink hover:border-ink",
  );

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx("font-mono text-[11.5px] uppercase tracking-[.12em] text-muted", className)}>{children}</p>;
}

/** Any figure shown to buyers takes a source; the type makes it impossible to omit. */
export function Stat({ label, value, source }: { label: string; value: ReactNode; source: Sourced }) {
  return (
    <div>
      <b className="block font-display text-xl tabular">{value}</b>
      <span className="text-[12.5px] text-muted">{label}</span>
      <span className="block font-mono text-[10.5px] text-muted">
        {source.source}, {source.asOf}
      </span>
    </div>
  );
}

const STATUS_CLASS: Record<UnitStatus, string> = {
  available: "bg-avail/15 text-avail-ink",
  on_hold: "bg-hold/20 text-hold-ink",
  booked: "bg-booked/20 text-muted",
  sold: "bg-sold/25 text-muted",
};

export function StatusBadge({ status }: { status: UnitStatus }) {
  return <span className={clsx("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", STATUS_CLASS[status])}>{STATUS_LABEL[status]}</span>;
}

const PARTNER_LABEL: Record<PartnerType, string> = { developer: "Developer", broker: "Broker", owner: "Owner" };

/** Seller line. Developers and brokers link to their profile; owners stay private. */
export function PartnerLine({ id, name, type, verified }: { id?: string; name: string; type: PartnerType; verified: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
      {verified && <CheckIcon className="size-3.5 rounded-full bg-avail p-0.5 text-white" aria-label="Verified" />}
      <span>
        {PARTNER_LABEL[type]} ·{" "}
        {id && type !== "owner" ? (
          <Link href={`/partners/${id}`} className="relative z-[1] text-ink underline decoration-line underline-offset-2 hover:decoration-ink">
            {name}
          </Link>
        ) : (
          <span className="text-ink">{name}</span>
        )}
        {verified ? <span className="sr-only"> (verified)</span> : null}
      </span>
    </span>
  );
}

export function DemoTag({ className }: { className?: string }) {
  return <span className={clsx("rounded-full border border-dashed border-line px-2 py-0.5 font-mono text-[10.5px] text-muted", className)}>Demo data</span>;
}

type IconProps = SVGProps<SVGSVGElement>;
const icon = (d: ReactNode) =>
  function Icon({ className, ...rest }: IconProps) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={clsx("size-4 shrink-0", className)} aria-hidden={rest["aria-label"] ? undefined : true} {...rest}>
        {d}
      </svg>
    );
  };

export const CheckIcon = icon(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const HeartIcon = icon(<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />);
export const CloseIcon = icon(<path d="M6 6l12 12M18 6L6 18" />);
export const ArrowIcon = icon(<path d="M5 12h14M13 6l6 6-6 6" />);
export const CubeIcon = icon(<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18M4 7.5l8 4.5 8-4.5" />);
