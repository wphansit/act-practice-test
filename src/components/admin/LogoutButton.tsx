"use client";

import { useRouter } from "next/navigation";
import { th } from "@/lib/i18n/th";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/session", { method: "DELETE" });
        router.replace("/admin/login");
      }}
      className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
    >
      🚪 {th.admin.nav.logout}
    </button>
  );
}
