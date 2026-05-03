"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * `admin_token` が無い状態が確定したらログインへ送る（「ログイン情報がありません」相当のケース）。
 * `ready` が false の間は何もしない（ハイドレーション前の誤転送防止）。
 */
export function useRedirectIfMissingAdminToken(ready: boolean, token: string | null): void {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!ready) return;
    if (token) return;
    if (pathname === "/admin/login") return;
    router.replace("/admin/login");
  }, [ready, token, router, pathname]);
}
