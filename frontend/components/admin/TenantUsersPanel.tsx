"use client";

import { useEffect, useMemo, useState } from "react";

import { apiDelete, apiGet, apiPatch, apiPost } from "../../lib/api";
import { formatUserSaveApiError } from "../../lib/formatApiError";
import {
  registrationEmailViolation,
  registrationPasswordViolation,
} from "../../lib/userCredentials";
import { Modal } from "./Modal";

type UserRow = {
  id: number;
  email: string;
  role: "sysadmin" | "tenant" | "user" | string;
  tenant_id?: number | null;
  created_at: string;
  updated_at: string;
};

type CreateRole = "tenant" | "user";

export function TenantUsersPanel({
  tenantId,
  token,
  viewerRole,
}: {
  tenantId: number;
  token: string;
  viewerRole: string;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteDoing, setDeleteDoing] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createRole, setCreateRole] = useState<CreateRole>("user");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [createErrorDialog, setCreateErrorDialog] = useState<string | null>(null);
  const [createSuccessDialogOpen, setCreateSuccessDialogOpen] = useState(false);

  const canCreateTenantAdmin = viewerRole === "sysadmin";

  const createTitle = useMemo(() => {
    if (createRole === "tenant") return "テナント権限を追加";
    return "ユーザ権限を追加";
  }, [createRole]);

  const formatCreatedAt = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return (iso: string) => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "—";
      return fmt.format(d);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiGet<{ id: number }>("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (typeof me.id === "number" && me.id >= 0) setCurrentUserId(me.id);
        else setCurrentUserId(null);
      } catch {
        setCurrentUserId(null);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!Number.isFinite(tenantId)) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await apiGet<UserRow[]>(`/admin/tenants/${tenantId}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(rows);
      } catch {
        setUsers([]);
        setError("取得に失敗しました（権限不足の可能性）");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, tenantId]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="text-lg font-semibold tracking-tight text-slate-100">テナント配下ユーザ</div>

          <button
            type="button"
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
            disabled={creating}
            onClick={() => {
              setCreateOpen(true);
              setCreateRole("user");
              setCreateEmail("");
              setCreatePassword("");
              setError(null);
              setCreateErrorDialog(null);
              setCreateSuccessDialogOpen(false);
            }}
          >
            ユーザ追加
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/20 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-slate-200">ユーザ一覧</div>
          {loading ? <div className="text-xs text-slate-400">読み込み中…</div> : null}
        </div>
        {users.length === 0 && !loading ? (
          <div className="text-sm text-slate-400">まだありません</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <div className="grid grid-cols-12 gap-0 bg-slate-900/50 px-4 py-3 text-xs text-slate-300">
              <div className="col-span-6">ユーザ名</div>
              <div className="col-span-2">権限</div>
              <div className="col-span-3">登録日時</div>
              <div className="col-span-1 text-right">操作</div>
            </div>
            <div className="divide-y divide-slate-800 bg-slate-950/40">
              {users.map((u) => (
                <div key={u.id} className="grid grid-cols-12 items-center gap-0 px-4 py-3 text-sm">
                  <div className="col-span-6 min-w-0">
                    <div className="truncate font-medium text-slate-100" title={u.email}>
                      {u.email}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 font-mono text-xs text-slate-200">
                      {u.role}
                    </span>
                  </div>
                  <div className="col-span-3 font-mono text-xs text-slate-400">
                    {formatCreatedAt(u.created_at)}
                  </div>
                  <div className="col-span-1 flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-600 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-900"
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
                      className="rounded-lg border border-rose-800/70 px-2 py-1 text-xs font-medium text-rose-200 hover:bg-rose-950/40 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={currentUserId != null && u.id === currentUserId}
                      title={
                        currentUserId != null && u.id === currentUserId
                          ? "自身のアカウントは削除できません"
                          : undefined
                      }
                      onClick={() => {
                        setDeleteTarget(u);
                        setError(null);
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {createOpen ? (
        <Modal
          title={createTitle}
          maxWidthClassName="max-w-lg"
          closeOnEscape={!createErrorDialog}
          onClose={() => {
            if (creating) return;
            setCreateOpen(false);
            setCreateErrorDialog(null);
          }}
        >
          <div className="space-y-4">
            {canCreateTenantAdmin ? (
              <label className="block text-sm text-slate-200">
                権限
                <select
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as CreateRole)}
                  disabled={creating}
                >
                  <option value="user">ユーザ権限</option>
                  <option value="tenant">テナント権限</option>
                </select>
              </label>
            ) : (
              <div className="text-xs text-slate-400">権限: ユーザ権限</div>
            )}

            <label className="block text-sm text-slate-200">
              メールアドレス
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="user@example.com"
                autoComplete="email"
                disabled={creating}
              />
            </label>
            <label className="block text-sm text-slate-200">
              パスワード
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="password"
                disabled={creating}
              />
              <span className="mt-1 block text-xs text-slate-500">
                英数記号を組み合わせ最低8文字以上
              </span>
            </label>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                disabled={creating}
                onClick={() => {
                  setCreateOpen(false);
                  setCreateErrorDialog(null);
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
                disabled={creating || createEmail.trim().length === 0 || createPassword.length === 0}
                onClick={async () => {
                  const em = createEmail.trim().toLowerCase();
                  const emailErr = registrationEmailViolation(em);
                  if (emailErr) {
                    setCreateErrorDialog(emailErr);
                    return;
                  }
                  const pwErr = registrationPasswordViolation(createPassword);
                  if (pwErr) {
                    setCreateErrorDialog(pwErr);
                    return;
                  }
                  setCreating(true);
                  setCreateErrorDialog(null);
                  try {
                    const roleToCreate: CreateRole = canCreateTenantAdmin ? createRole : "user";
                    const path =
                      roleToCreate === "tenant"
                        ? `/admin/tenants/${tenantId}/admins`
                        : `/admin/tenants/${tenantId}/users`;
                    const u = await apiPost<UserRow>(
                      path,
                      { email: em, password: createPassword },
                      { headers: { Authorization: `Bearer ${token}` } },
                    );
                    setUsers((prev) => [u, ...prev]);
                    setCreateOpen(false);
                    setCreateSuccessDialogOpen(true);
                  } catch (e) {
                    setCreateErrorDialog(
                      formatUserSaveApiError(e, "作成に失敗しました（権限不足の可能性があります）"),
                    );
                  } finally {
                    setCreating(false);
                  }
                }}
              >
                {creating ? "作成中…" : "作成"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {createErrorDialog ? (
        <Modal
          title="エラー"
          maxWidthClassName="max-w-md"
          onClose={() => setCreateErrorDialog(null)}
        >
          <p className="whitespace-pre-wrap text-sm text-rose-200">{createErrorDialog}</p>
        </Modal>
      ) : null}

      {createSuccessDialogOpen ? (
        <Modal
          title="お知らせ"
          maxWidthClassName="max-w-md"
          onClose={() => setCreateSuccessDialogOpen(false)}
        >
          <div className="space-y-3 text-sm text-slate-200">
            <p>正常に登録しました。</p>
            <p>登録ユーザにログイン情報をメールで送信しました</p>
          </div>
        </Modal>
      ) : null}

      {editingUser ? (
        <Modal
          title="ユーザを編集"
          maxWidthClassName="max-w-lg"
          onClose={() => {
            if (editSaving) return;
            setEditingUser(null);
          }}
        >
          <p className="text-xs text-slate-500">
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
              <span className="mt-1 block text-xs text-slate-500">
                英数記号を組み合わせ最低8文字以上
              </span>
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
              disabled={editSaving || editEmail.trim().length === 0}
              onClick={async () => {
                if (!editingUser) return;
                const em = editEmail.trim().toLowerCase();
                const emailErr = registrationEmailViolation(em);
                if (emailErr) {
                  setError(emailErr);
                  return;
                }
                if (editPassword.length > 0) {
                  const pwErr = registrationPasswordViolation(editPassword);
                  if (pwErr) {
                    setError(pwErr);
                    return;
                  }
                }
                setEditSaving(true);
                setError(null);
                try {
                  const body: { email: string; password?: string } = { email: em };
                  if (editPassword.length > 0) body.password = editPassword;
                  const updated = await apiPatch<UserRow>(
                    `/admin/tenants/${tenantId}/users/${editingUser.id}`,
                    body,
                    { headers: { Authorization: `Bearer ${token}` } },
                  );
                  setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                  setEditingUser(null);
                } catch {
                  setError("更新に失敗しました（メール重複/権限不足の可能性）");
                } finally {
                  setEditSaving(false);
                }
              }}
            >
              {editSaving ? "保存中…" : "保存"}
            </button>
          </div>
        </Modal>
      ) : null}

      {deleteTarget ? (
        <Modal
          title="ユーザを削除"
          maxWidthClassName="max-w-lg"
          onClose={() => {
            if (deleteDoing) return;
            setDeleteTarget(null);
          }}
        >
          <p className="text-sm text-slate-300">次のユーザを削除します。この操作は取り消せません。</p>
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
              disabled={deleteDoing}
              onClick={async () => {
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
        </Modal>
      ) : null}
    </div>
  );
}

