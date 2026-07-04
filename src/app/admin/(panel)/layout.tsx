import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { th } from "@/lib/i18n/th";

const NAV = [
  { href: "/admin", label: th.admin.nav.dashboard, icon: "📊" },
  { href: "/admin/questions", label: th.admin.nav.questions, icon: "📝" },
  { href: "/admin/passages", label: th.admin.nav.passages, icon: "📄" },
  { href: "/admin/attempts", label: th.admin.nav.attempts, icon: "🎓" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-slate-900 text-white flex flex-col">
        <div className="px-4 py-5 border-b border-slate-800">
          <p className="font-bold">ACT Test</p>
          <p className="text-xs text-slate-400">{th.admin.login.title}</p>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-2 py-3 border-t border-slate-800">
          <LogoutButton />
        </div>
      </aside>
      <div className="flex-1 min-w-0 bg-slate-50">{children}</div>
    </div>
  );
}
