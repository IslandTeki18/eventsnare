export function SectionHeading({
  eyebrow,
  title,
  id,
  sub,
}: {
  eyebrow: string
  title: string
  id?: string
  sub?: string
}) {
  return (
    <>
      <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-subtle">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-[28px] font-semibold tracking-[-0.025em]">
        {title}
      </h2>
      {sub && <p className="mt-2.5 text-lg text-muted-foreground">{sub}</p>}
    </>
  )
}
