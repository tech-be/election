"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { TenantUsersPanel } from "../../../../components/admin/TenantUsersPanel";
import { useRedirectIfMissingAdminToken } from "../../../../lib/useRedirectIfMissingAdminToken";

export default function AdminTenantUsersPage() {
  // NOTE: This page is kept for direct navigation (and for tenant-role users via side menu).
  // The same contents are used in a modal from the tenants list.
  const router = useRouter();
  const params = useParams<{ tenantId: string }>();
  const tenantId = useMemo(() => Number(params.tenantId), [params.tenantId]);

  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [viewerRole, setViewerRole] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
    setViewerRole((localStorage.getItem("admin_role") ?? "").trim().toLowerCase());
  }, [tenantId]);

  useRedirectIfMissingAdminToken(mounted, token);

  useEffect(() => {
    if (!mounted) return;
    if (viewerRole !== "tenant") return;
    const own = localStorage.getItem("admin_tenant_id")?.trim();
    if (own && /^\d+$/.test(own) && Number(own) !== tenantId) {
      router.replace(`/admin/tenants/${own}`);
    }
  }, [mounted, viewerRole, tenantId, router]);

  return (
    <main className="w-full max-w-none space-y-6">
      {mounted && token && Number.isFinite(tenantId) ? (
        <TenantUsersPanel tenantId={tenantId} token={token} viewerRole={viewerRole} />
      ) : null}
    </main>
  );
}

