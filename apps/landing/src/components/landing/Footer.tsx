export function Footer() {
  return (
    <footer className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-4 px-6 py-[26px]">
      <p className="text-sm text-subtle">© 2026 Eventsnare</p>
      <div className="flex gap-5">
        <a href="#" className="text-sm text-subtle hover:text-foreground">
          Privacy
        </a>
        <a href="#" className="text-sm text-subtle hover:text-foreground">
          Terms
        </a>
      </div>
    </footer>
  )
}
