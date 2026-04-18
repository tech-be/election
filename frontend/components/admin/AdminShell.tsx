"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AdminRole = "sysadmin" | "tenant" | "user" | "";

function roleLabel(role: AdminRole) {
  if (role === "sysadmin") return "シスアド";
  if (role === "tenant") return "テナント権限";
  if (role === "user") return "ユーザ権限";
  return "未ログイン";
}

function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "block rounded-xl border px-3 py-2 text-sm transition",
        active
          ? "border-indigo-400/60 bg-indigo-500/10 text-indigo-100"
          : "border-slate-800 bg-slate-950/40 text-slate-200 hover:border-slate-700 hover:bg-slate-950/70",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<AdminRole>("");
  const [tenantScopeId, setTenantScopeId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ログイン直後の router.push では同一レイアウトのまま遷移するため、ルートが変わるたびに再同期する
  useEffect(() => {
    setToken(localStorage.getItem("admin_token"));
    const raw = (localStorage.getItem("admin_role") ?? "").trim().toLowerCase();
    if (raw === "sysadmin" || raw === "tenant" || raw === "user") {
      setRole(raw as AdminRole);
    } else {
      setRole("" as AdminRole);
    }
    const tidRaw = (localStorage.getItem("admin_tenant_id") ?? "").trim();
    const tid = tidRaw.length > 0 && /^\d+$/.test(tidRaw) ? Number(tidRaw) : null;
    setTenantScopeId(Number.isFinite(tid) ? tid : null);
  }, [pathname]);

  const nav = useMemo(() => {
    const items: Array<{ href: string; label: string }> = [];
    // テナント管理はシスアドのみ（ユーザ権限・テナント権限では出さない）
    if (role === "sysadmin") {
      items.push({ href: "/admin/tenants", label: "テナント管理" });
    }
    if (role === "tenant" && tenantScopeId != null) {
      items.push({ href: `/admin/tenants/${tenantScopeId}`, label: "ユーザー管理" });
    }
    items.push({ href: "/admin/campaigns", label: "企画管理" });
    return items;
  }, [role, tenantScopeId]);

  const isLogin = pathname === "/admin/login";
  if (isLogin) return <>{children}</>;

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <aside className="w-full shrink-0 border-slate-800 bg-slate-900/40 px-4 py-6 lg:w-[240px] lg:border-r lg:py-10 lg:pl-6 lg:pr-4">
        <div className="space-y-1">
          <div className="text-xs text-slate-400">管理メニュー</div>
          <div className="text-sm font-semibold text-slate-100">{roleLabel(role)}</div>
          {mounted && !token ? (
            <div className="text-xs text-rose-300">未ログイン</div>
          ) : (
            <div className="text-xs text-slate-500">ログイン中</div>
          )}
        </div>

        <nav className="mt-4 space-y-2">
          {nav.map((i) => {
            const active =
              i.href === "/admin/tenants"
                ? pathname === "/admin/tenants"
                : pathname === i.href || pathname.startsWith(`${i.href}/`);
            return <NavItem key={i.href} href={i.href} label={i.label} active={active} />;
          })}
        </nav>

        <div className="mt-6 border-t border-slate-800 pt-4">
          <button
            type="button"
            className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:border-slate-700 hover:bg-slate-950/70"
            onClick={() => {
              localStorage.removeItem("admin_token");
              localStorage.removeItem("admin_role");
              localStorage.removeItem("admin_tenant_id");
              router.push("/admin/login");
            }}
          >
            ログアウト
          </button>
        </div>
      </aside>

      <section className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-10">{children}</section>
    </div>
  );
}

