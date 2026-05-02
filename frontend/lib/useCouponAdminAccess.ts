"use client";

import { useEffect, useState } from "react";

import { apiGet, type AuthMe } from "./api";

export type CouponAdminAccess = "loading" | "full" | "disabled";

/**
 * クーポン管理画面の表示可否。シスアドは常に full。テナント／ユーザは tenant_coupons_enabled のみ。
 */
export function useCouponAdminAccess(token: string | null, ready: boolean): CouponAdminAccess {
  const [access, setAccess] = useState<CouponAdminAccess>("loading");

  useEffect(() => {
    if (!ready || !token) {
      setAccess("loading");
      return;
    }

    let cancelled = false;
    setAccess("loading");
    void (async () => {
      try {
        const me = await apiGet<AuthMe>("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (me.role === "sysadmin") {
          setAccess("full");
          return;
        }
        if (
          (me.role === "tenant" || me.role === "user") &&
          me.tenant_coupons_enabled === true
        ) {
          setAccess("full");
          return;
        }
        if (me.role === "tenant" || me.role === "user") {
          setAccess("disabled");
          return;
        }
        setAccess("disabled");
      } catch {
        if (!cancelled) setAccess("disabled");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, token]);

  return access;
}
