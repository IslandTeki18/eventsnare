const ROWS = [
  { type: 'charge.succeeded', source: 'Stripe production', status: 'Delivered', tone: 'ok', attempts: 2, code: '200' },
  { type: 'invoice.payment_failed', source: 'Stripe production', status: 'Retrying', tone: 'warn', attempts: 3, code: '500' },
  { type: 'orders/create', source: 'Shopify storefront', status: 'Gave up', tone: 'bad', attempts: 6, code: '502' },
  { type: 'user.created', source: 'Clerk app', status: 'Delivered', tone: 'ok', attempts: 1, code: '200' },
] as const

function codeTone(code: string): string {
  const n = Number(code)
  if (n >= 200 && n < 300) return 'hsl(var(--ok))'
  if (n >= 500) return 'hsl(var(--bad))'
  return 'hsl(var(--warn))'
}

const CELL = 'border-b border-border-soft px-3.5 py-[7px] text-sm'
const HEAD = 'border-b border-border px-3.5 py-2 text-2xs font-medium text-subtle whitespace-nowrap'

export function ProductPeek() {
  return (
    <section aria-label="Product preview" className="border-b border-border bg-panel">
      <div className="mx-auto max-w-[1080px] px-6 pb-[60px] pt-14">
        <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-subtle">
          In the dashboard
        </p>
        <h2 className="mt-3 max-w-[20em] text-[24px] font-semibold tracking-[-0.02em]">
          Every event, its delivery history, and a replay button
        </h2>

        <div className="mt-6 overflow-hidden rounded-[7px] border border-border bg-background">
          <div className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-2.5">
            <span className="text-sm font-medium">Events</span>
            <span className="text-xs tabular-nums text-subtle">12,481 total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className={HEAD}>Status</th>
                  <th className={HEAD}>Event</th>
                  <th className={HEAD}>Source</th>
                  <th className={`${HEAD} text-right`}>Attempts</th>
                  <th className={`${HEAD} text-right`}>Response</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(row => {
                  const tone = `hsl(var(--${row.tone}))`
                  return (
                    <tr key={row.type}>
                      <td
                        className={`${CELL} whitespace-nowrap`}
                        style={{ boxShadow: `inset 2px 0 0 ${tone}` }}
                      >
                        <span className="inline-flex items-center gap-[7px]" style={{ color: tone }}>
                          <span className="h-1.5 w-1.5" style={{ background: tone }} aria-hidden />
                          {row.status}
                        </span>
                      </td>
                      <td className={`${CELL} whitespace-nowrap font-mono`}>{row.type}</td>
                      <td className={`${CELL} whitespace-nowrap text-muted-foreground`}>{row.source}</td>
                      <td className={`${CELL} text-right tabular-nums text-muted-foreground`}>
                        {row.attempts}
                      </td>
                      <td
                        className={`${CELL} text-right font-mono tabular-nums`}
                        style={{ color: codeTone(row.code) }}
                      >
                        {row.code}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
