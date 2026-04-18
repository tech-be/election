"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiDelete, apiGet, apiPatch, apiPost } from "../../../../lib/api";

type UserRow = {
  id: number;
  email: string;
  role: "sysadmin" | "tenant" | "user" | string;
  tenant_id?: number | null;
  created_at: string;
  updated_at: string;
};

export default function AdminTenantUsersPage() {
  const router = useRouter();
  const params = useParams<{ tenantId: string }>();
  const tenantId = useMemo(() => Number(params.tenantId), [params.tenantId]);

  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminCreating, setAdminCreating] = useState(false);

  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userCreating, setUserCreating] = useState(false);
  const [viewerRole, setViewerRole] = useState<string>("");

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteDoing, setDeleteDoing] = useState(false);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
    setViewerRole((localStorage.getItem("admin_role") ?? "").trim().toLowerCase());
  }, [tenantId]);

  useEffect(() => {
    if (!mounted) return;
    if (viewerRole !== "tenant") return;
    const own = localStorage.getItem("admin_tenant_id")?.trim();
    if (own && /^\d+$/.test(own) && Number(own) !== tenantId) {
      router.replace(`/admin/tenants/${own}`);
    }
  }, [mounted, viewerRole, tenantId, router]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const me = await apiGet<{ id: number }>("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (typeof me.id === "number" && me.id >= 0) {
          setCurrentUserId(me.id);
        }
      } catch {
        setCurrentUserId(null);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token || !Number.isFinite(tenantId)) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await apiGet<UserRow[]>(`/admin/tenants/${tenantId}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(rows);
      } catch {
        setError("取得に失敗しました（権限不足の可能性）");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, tenantId]);

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-slate-400">
            {viewerRole === "tenant" ? "管理画面（テナント権限）" : "管理画面（シスアド）"}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">テナント配下ユーザ</h1>
          <div className="text-xs text-slate-500">Tenant ID: {tenantId}</div>
        </div>
        <button
          type="button"
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
          onClick={() =>
            router.push(viewerRole === "tenant" ? "/admin/campaigns" : "/admin/tenants")
          }
        >
          戻る
        </button>
      </header>

      {mounted && !token ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          ログイン情報がありません。先にログインしてください。
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-sm font-medium text-slate-200">テナント権限アカウント作成</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-200">
            メールアドレス
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="tenant-admin@example.com"
            />
          </label>
          <label className="text-sm text-slate-200">
            パスワード
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="password"
            />
          </label>
        </div>
        <button
          type="button"
          className="w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
          disabled={!token || adminCreating || adminEmail.trim().length === 0 || adminPassword.length === 0}
          onClick={async () => {
            if (!token) return;
            setAdminCreating(true);
            setError(null);
            try {
              const u = await apiPost<UserRow>(
                `/admin/tenants/${tenantId}/admins`,
                { email: adminEmail.trim(), password: adminPassword },
                { headers: { Authorization: `Bearer ${token}` } },
              );
              setUsers((prev) => [u, ...prev]);
              setAdminEmail("");
              setAdminPassword("");
            } catch {
              setError("作成に失敗しました（メール重複の可能性）");
            } finally {
              setAdminCreating(false);
            }
          }}
        >
          {adminCreating ? "作成中…" : "テナント権限を作成"}
        </button>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-sm font-medium text-slate-200">ユーザ権限アカウント作成</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-200">
            メールアドレス
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </label>
          <label className="text-sm text-slate-200">
            パスワード
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
              type="password"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="password"
            />
          </label>
        </div>
        <button
          type="button"
          className="w-full rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-50 hover:bg-slate-700 disabled:opacity-60"
          disabled={!token || userCreating || userEmail.trim().length === 0 || userPassword.length === 0}
          onClick={async () => {
            if (!token) return;
            setUserCreating(true);
            setError(null);
            try {
              const u = await apiPost<UserRow>(
                `/admin/tenants/${tenantId}/users`,
                { email: userEmail.trim(), password: userPassword },
                { headers: { Authorization: `Bearer ${token}` } },
              );
              setUsers((prev) => [u, ...prev]);
              setUserEmail("");
              setUserPassword("");
            } catch {
              setError("作成に失敗しました（メール重複の可能性）");
            } finally {
              setUserCreating(false);
            }
          }}
        >
          {userCreating ? "作成中…" : "ユーザ権限を作成"}
        </button>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-slate-200">ユーザ一覧</div>
          {loading ? <div className="text-xs text-slate-400">読み込み中…</div> : null}
        </div>
        {users.length === 0 && !loading ? (
          <div className="text-sm text-slate-400">まだありません</div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-100">{u.email}</div>
                  <div className="text-xs text-slate-500">
                    role: <span className="font-mono text-slate-300">{u.role}</span> / id:{" "}
                    <span className="font-mono text-slate-300">{u.id}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-900"
                    onClick={() => {
                      setEditingUser(u);
                      setEditEmail(u.email);
                      setEditPassword("");
                      setError(null);
                    }}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-rose-800/70 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-950/40 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={currentUserId != null && u.id === currentUserId}
                    title={currentUserId != null && u.id === currentUserId ? "自身のアカウントは削除できません" : undefined}
                    onClick={() => {
                      setDeleteTarget(u);
                      setError(null);
                    }}
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editingUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingUser(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-user-title" className="text-lg font-semibold text-slate-50">
              ユーザを編集
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              role: <span className="font-mono text-slate-400">{editingUser.role}</span>（ロール変更はできません）
            </p>
            <div className="mt-4 space-y-4">
              <label className="block text-sm text-slate-200">
                メールアドレス
                <input
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
              <label className="block text-sm text-slate-200">
                パスワード（変更する場合のみ入力）
                <input
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="空欄のままなら変更しません"
                  autoComplete="new-password"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                disabled={editSaving}
                onClick={() => setEditingUser(null)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
                disabled={editSaving || !token || editEmail.trim().length === 0}
                onClick={async () => {
                  if (!token || !editingUser) return;
                  setEditSaving(true);
                  setError(null);
                  try {
                    const body: { email: string; password?: string } = {
                      email: editEmail.trim().toLowerCase(),
                    };
                    if (editPassword.length > 0) {
                      body.password = editPassword;
                    }
                    const updated = await apiPatch<UserRow>(
                      `/admin/tenants/${tenantId}/users/${editingUser.id}`,
                      body,
                      { headers: { Authorization: `Bearer ${token}` } },
                    );
                    setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                    setEditingUser(null);
                  } catch {
                    setError("更新に失敗しました（メール重複の可能性）");
                  } finally {
                    setEditSaving(false);
                  }
                }}
              >
                {editSaving ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-user-title" className="text-lg font-semibold text-slate-50">
              ユーザを削除
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              次のユーザを削除します。この操作は取り消せません。
            </p>
            <p className="mt-2 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 font-mono text-sm text-slate-200">
              {deleteTarget.email}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                disabled={deleteDoing}
                onClick={() => setDeleteTarget(null)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                disabled={deleteDoing || !token}
                onClick={async () => {
                  if (!token) return;
                  setDeleteDoing(true);
                  setError(null);
                  try {
                    await apiDelete<{ ok: boolean }>(
                      `/admin/tenants/${tenantId}/users/${deleteTarget.id}`,
                      { headers: { Authorization: `Bearer ${token}` } },
                    );
                    setUsers((prev) => prev.filter((x) => x.id !== deleteTarget.id));
                    setDeleteTarget(null);
                  } catch {
                    setError("削除に失敗しました（自身の削除はできません）");
                    setDeleteTarget(null);
                  } finally {
                    setDeleteDoing(false);
                  }
                }}
              >
                {deleteDoing ? "削除中…" : "削除する"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

