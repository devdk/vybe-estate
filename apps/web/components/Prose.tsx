import type { ReactNode } from "react";

/** Layout for text pages: one readable column, plain headings. */
export function Prose({ title, intro, children, notice }: { title: string; intro?: ReactNode; notice?: ReactNode; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-[760px] px-4 pt-8">
      <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-bold leading-[1.1] tracking-tight">{title}</h1>
      {intro && <p className="mt-3 text-[16.5px] text-muted">{intro}</p>}
      {notice && <div className="mt-5 rounded-xl border border-hold/50 bg-hold/10 px-4 py-3 text-[14px] text-hold-ink">{notice}</div>}
      <div className="mt-8 grid gap-8 text-[15px] leading-relaxed [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h3]:font-bold [&_li]:mt-1.5 [&_p+p]:mt-3 [&_section>*+*]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
