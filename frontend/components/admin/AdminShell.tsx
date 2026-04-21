"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiGet, type AuthMe } from "../../lib/api";

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
      aria-current={active ? "page" : undefined}
      className={[
        "block rounded-xl border px-3 py-2 text-sm font-medium transition",
        active
          ? "border-indigo-400/80 bg-indigo-500/20 text-white shadow-[inset_3px_0_0_0_rgb(129,140,250)] ring-1 ring-indigo-400/30"
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
  /** テナント／ユーザ権限時のみ。クーポン機能が有効か（シスアドは未使用） */
  const [tenantCouponsEnabled, setTenantCouponsEnabled] = useState<boolean | null>(null);

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

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    const raw = (localStorage.getItem("admin_role") ?? "").trim().toLowerCase();
    if (!t || raw === "sysadmin" || raw === "") {
      setTenantCouponsEnabled(null);
      return;
    }
    void (async () => {
      try {
        const me = await apiGet<AuthMe>("/auth/me", {
          headers: { Authorization: `Bearer ${t}` },
        });
        setTenantCouponsEnabled(me.tenant_coupons_enabled ?? false);
      } catch {
        setTenantCouponsEnabled(false);
      }
    })();
  }, [pathname, token]);

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
    if (role === "sysadmin") {
      items.push({ href: "/admin/coupons", label: "クーポン管理" });
    } else if ((role === "tenant" || role === "user") && tenantCouponsEnabled === true) {
      items.push({ href: "/admin/coupons", label: "クーポン管理" });
    }
    return items;
  }, [role, tenantScopeId, tenantCouponsEnabled]);

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

