export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <p className="text-sm text-muted-foreground">© 2026 Eventsnare</p>
        <div className="flex gap-6">
          <a
            href="#"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy
          </a>
          <a
            href="#"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Terms
          </a>
        </div>
      </div>
    </footer>
  )
}
