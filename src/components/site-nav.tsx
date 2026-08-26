import Link from "next/link";

export function SiteNav({ active }: { active?: "home" | "studio" | "how" }) {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5">
        <Link href="/" className="text-[15px] font-medium tracking-[-0.02em]">
          Slate
        </Link>
        <nav className="flex items-center gap-1 text-[13px] text-[var(--mute)]">
          <Link href="/" className={`rounded-full px-3 py-1.5 ${active === "home" ? "text-[var(--ink)]" : ""}`}>
            Home
          </Link>
          <Link href="/how" className={`rounded-full px-3 py-1.5 ${active === "how" ? "text-[var(--ink)]" : ""}`}>
            How
          </Link>
          <Link href="/studio" className={`rounded-full px-3 py-1.5 ${active === "studio" ? "text-[var(--ink)]" : ""}`}>
            Studio
          </Link>
        </nav>
      </div>
    </header>
  );
}
