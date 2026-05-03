"use client";

import { useEffect, useState } from "react";

import { apiGet, apiPatch, apiPost, type Tenant } from "../../../lib/api";
import { Modal } from "../../../components/admin/Modal";
import { TenantUsersPanel } from "../../../components/admin/TenantUsersPanel";

function parseApiErrorDetail(err: unknown): string | null {
  if (!(err instanceof Error) || !err.message.trim()) return null;
  try {
    const j = JSON.parse(err.message) as { detail?: unknown };
    if (typeof j.detail === "string") return j.detail;
    return null;
  } catch {
    return null;
  }
}

export default function AdminTenantsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingCouponsId, setUpdatingCouponsId] = useState<number | null>(null);
  const [updatingActiveId, setUpdatingActiveId] = useState<number | null>(null);
  const [viewerRole, setViewerRole] = useState<string>("");
  const [usersModalTenantId, setUsersModalTenantId] = useState<number | null>(null);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  /** クーポンON時の不足項目など */
  const [couponGateModalMessage, setCouponGateModalMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
    setViewerRole((localStorage.getItem("admin_role") ?? "").trim().toLowerCase());
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await apiGet<Tenant[]>("/admin/tenants", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTenants(rows);
      } catch {
        setError("取得に失敗しました（権限不足の可能性）");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <main className="w-full max-w-none space-y-6">
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

      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-sm font-medium text-slate-200">テナント作成</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm text-slate-200">
            テナント名
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例）株式会社〇〇"
            />
          </label>
          <button
            type="button"
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
            disabled={!token || creating || name.trim().length === 0}
            onClick={async () => {
              if (!token) return;
              setCreating(true);
              setError(null);
              try {
                const t = await apiPost<Tenant>(
                  "/admin/tenants",
                  { name: name.trim() },
                  { headers: { Authorization: `Bearer ${token}` } },
                );
                setTenants((prev) => [t, ...prev]);
                setName("");
              } catch {
                setError("作成に失敗しました");
              } finally {
                setCreating(false);
              }
            }}
          >
            {creating ? "作成中…" : "作成"}
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-slate-200">テナント一覧</div>
          {loading ? <div className="text-xs text-slate-400">読み込み中…</div> : null}
        </div>
        {tenants.length === 0 && !loading ? (
          <div className="text-sm text-slate-400">まだありません</div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {tenants.map((t) => (
              <li
                key={t.id}
                className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-100">{t.name}</div>
                  <div className="text-xs text-slate-500">ID: {t.id}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:justify-end">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                    <span className="inline-block w-16 whitespace-nowrap text-right text-slate-400">テナント</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={t.active}
                      disabled={!token || updatingActiveId === t.id}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                        t.active ? "bg-emerald-600" : "bg-slate-600"
                      } disabled:opacity-50`}
                      onClick={() => {
                        if (!token || updatingActiveId !== null) return;
                        const next = !t.active;
                        setUpdatingActiveId(t.id);
                        setError(null);
                        void (async () => {
                          try {
                            const updated = await apiPatch<Tenant>(
                              `/admin/tenants/${t.id}`,
                              { active: next },
                              { headers: { Authorization: `Bearer ${token}` } },
                            );
                            setTenants((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
                          } catch {
                            setError("テナント状態の更新に失敗しました");
                          } finally {
                            setUpdatingActiveId(null);
                          }
                        })();
                      }}
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                          t.active ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                    <span className="inline-block w-12 text-xs text-slate-500">
                      {updatingActiveId === t.id ? "更新中…" : t.active ? "有効" : "無効"}
                    </span>
                  </label>
                  <label
                    className={`flex items-center gap-2 text-sm text-slate-300 ${t.active ? "cursor-pointer" : "cursor-not-allowed"}`}
                  >
                    <span className="inline-block w-20 whitespace-nowrap text-right text-slate-400">クーポン機能</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={t.coupons_enabled}
                      aria-disabled={!t.active}
                      disabled={!token || updatingCouponsId === t.id || !t.active}
                      title={
                        !t.active ? "テナントが無効のときはクーポン設定を変更できません" : undefined
                      }
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                        t.coupons_enabled ? "bg-emerald-600" : "bg-slate-600"
                      } disabled:opacity-50`}
                      onClick={() => {
                        if (!token || updatingCouponsId !== null || !t.active) return;
                        const next = !t.coupons_enabled;
                        if (next) {
                          const phoneOk = (t.phone ?? "").trim().length > 0;
                          const addrOk = (t.address ?? "").trim().length > 0;
                          if (!phoneOk || !addrOk) {
                            setCouponGateModalMessage(
                              "クーポン機能を有効にするには、電話番号と住所の両方が必要です。\n\nテナント編集から入力してください。",
                            );
                            return;
                          }
                        }
                        setUpdatingCouponsId(t.id);
                        setError(null);
                        void (async () => {
                          try {
                            const updated = await apiPatch<Tenant>(
                              `/admin/tenants/${t.id}`,
                              { coupons_enabled: next },
                              { headers: { Authorization: `Bearer ${token}` } },
                            );
                            setTenants((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
                          } catch (e) {
                            const detail = parseApiErrorDetail(e);
                            if (detail) {
                              setCouponGateModalMessage(detail);
                            } else {
                              setError("クーポン設定の更新に失敗しました");
                            }
                          } finally {
                            setUpdatingCouponsId(null);
                          }
                        })();
                      }}
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                          t.coupons_enabled ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                    <span className="inline-block w-12 text-xs text-slate-500">
                      {updatingCouponsId === t.id ? "更新中…" : t.coupons_enabled ? "利用可" : "オフ"}
                    </span>
                  </label>
                  <button
                    type="button"
                    className="shrink-0 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                    disabled={!token}
                    onClick={() => {
                      setEditTenant(t);
                      setEditName(t.name);
                      setEditPhone((t.phone ?? "").trim());
                      setEditAddress((t.address ?? "").trim());
                      setError(null);
                    }}
                  >
                    テナント編集
                  </button>
                  <button
                    type="button"
                    className="shrink-0 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                    disabled={!token}
                    onClick={() => setUsersModalTenantId(t.id)}
                  >
                    ユーザ管理
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editTenant != null && token ? (
        <Modal
          title="テナント編集"
          onClose={() => {
            if (editSaving) return;
            setEditTenant(null);
          }}
          maxWidthClassName="max-w-lg"
        >
          <div className="space-y-4">
            <label className="block text-sm text-slate-200">
              テナント名
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={200}
                autoComplete="organization"
              />
            </label>
            <label className="block text-sm text-slate-200">
              電話番号（任意）
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                maxLength={64}
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <label className="block text-sm text-slate-200">
              住所（任意）
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                maxLength={2000}
                rows={4}
              />
            </label>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                disabled={editSaving}
                onClick={() => setEditTenant(null)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
                disabled={editSaving || editName.trim().length === 0}
                onClick={async () => {
                  if (!token || !editTenant) return;
                  setEditSaving(true);
                  setError(null);
                  try {
                    const phoneTrim = editPhone.trim();
                    const addrTrim = editAddress.trim();
                    const updated = await apiPatch<Tenant>(
                      `/admin/tenants/${editTenant.id}`,
                      {
                        name: editName.trim(),
                        phone: phoneTrim ? phoneTrim : null,
                        address: addrTrim ? addrTrim : null,
                      },
                      { headers: { Authorization: `Bearer ${token}` } },
                    );
                    setTenants((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                    setEditTenant(null);
                  } catch (e) {
                    setError(parseApiErrorDetail(e) ?? "テナントの更新に失敗しました");
                  } finally {
                    setEditSaving(false);
                  }
                }}
              >
                {editSaving ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {couponGateModalMessage ? (
        <Modal
          title="エラー"
          onClose={() => setCouponGateModalMessage(null)}
          maxWidthClassName="max-w-md"
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-rose-100">{couponGateModalMessage}</p>
        </Modal>
      ) : null}

      {usersModalTenantId != null && token ? (
        <Modal
          title="ユーザ管理"
          onClose={() => setUsersModalTenantId(null)}
          maxWidthClassName="max-w-6xl"
        >
          <TenantUsersPanel tenantId={usersModalTenantId} token={token} viewerRole={viewerRole} />
        </Modal>
      ) : null}
    </main>
  );
}
