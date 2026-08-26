import Link from "next/link";

export function SiteNav({ active }: { active?: "home" | "studio" | "how" }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#111318] ring-1 ring-white/10">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <rect x="1" y="2.5" width="12" height="9" rx="1.6" stroke="#2f6dff" strokeWidth="1.2" />
              <path d="M5.4 4.8v4.4L9.6 7 5.4 4.8z" fill="#2f6dff" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em]">Slate</span>
        </Link>
        <nav className="flex items-center gap-1 text-[13px]">
          <NavLink href="/" on={active === "home"}>
            Home
          </NavLink>
          <NavLink href="/how" on={active === "how"}>
            How
          </NavLink>
          <NavLink href="/studio" on={active === "studio"}>
            Studio
          </NavLink>
          <a
            href="https://github.com/arjunkshah12345-hash/slate"
            className="rounded-full px-3 py-1.5 text-[var(--mute)] hover:text-[var(--ink)]"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, on, children }: { href: string; on?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 ${on ? "bg-[var(--bg-hover)] text-[var(--ink)]" : "text-[var(--mute)] hover:text-[var(--ink)]"}`}
    >
      {children}
    </Link>
  );
}
