"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackupMenu } from "./BackupMenu";

const LINKS = [
  { href: "/atlas", label: "Atlas" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plan", label: "Plan" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0d12]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4">
        <Link href="/atlas" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-sky-400 to-violet-500 text-xs font-bold text-black">
            SA
          </span>
          Skill Atlas
        </Link>
        <nav className="flex gap-1">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  active ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">
          <BackupMenu />
        </div>
      </div>
    </header>
  );
}
