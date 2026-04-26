"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProductModal, type ProductDraft } from "../../components/admin/ProductModal";
import { apiGet, apiPost, type Campaign } from "../../lib/api";
import { LP_BACKGROUND_OPTIONS } from "../../lib/lpBackgrounds";
import { DEFAULT_NO_LANDING_END_MESSAGE } from "../../lib/noLandingEndMessage";
import { resolveMediaUrl } from "../../lib/products";
import { DEFAULT_VOTE_CONFIRM_BODY_TEMPLATE, DEFAULT_VOTE_CONFIRM_TITLE } from "../../lib/voteConfirmModal";

type TenantRow = { id: number; name: string };

const NEW_TABS = [
  { id: "basic" as const, label: "基本情報" },
  { id: "intro" as const, label: "説明モーダル" },
  { id: "products" as const, label: "アイテム登録" },
  { id: "confirm" as const, label: "確認モーダル" },
  { id: "landing" as const, label: "最終ランディング" },
];

export function CampaignCreatePanel({
  token,
  onClose,
  onCreated,
}: {
  token: string | null;
  onClose: () => void;
  onCreated?: (campaign: Campaign) => void;
}) {
  const [role, setRole] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [tenantIdForCreate, setTenantIdForCreate] = useState("");

  useEffect(() => {
    setMounted(true);
    setRole(localStorage.getItem("admin_role") ?? "");
  }, []);

  useEffect(() => {
    if (!token || role !== "sysadmin") return;
    (async () => {
      try {
        const rows = await apiGet<TenantRow[]>("/admin/tenants", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTenants(rows);
        if (rows.length === 1) setTenantIdForCreate(String(rows[0].id));
      } catch {
        setTenants([]);
      }
    })();
  }, [token, role]);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [keyVisualUrl, setKeyVisualUrl] = useState("");
  const [keyText, setKeyText] = useState("");
  const [products, setProducts] = useState<ProductDraft[]>([]);
  const [thankYouMessage, setThankYouMessage] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [noLandingEndMessage, setNoLandingEndMessage] = useState("");
  const [lpBackgroundKey, setLpBackgroundKey] = useState("pastel_lavender");
  const [lpIntroTitle, setLpIntroTitle] = useState("");
  const [lpIntroImageUrl, setLpIntroImageUrl] = useState("");
  const [lpIntroText, setLpIntroText] = useState("");
  const [voteMaxProducts, setVoteMaxProducts] = useState(3);
  const [emailRequired, setEmailRequired] = useState(true);
  const [voteConfirmTitle, setVoteConfirmTitle] = useState("");
  const [voteConfirmBody, setVoteConfirmBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [newTab, setNewTab] = useState<(typeof NEW_TABS)[number]["id"]>("basic");
  const [productsModalOpen, setProductsModalOpen] = useState(false);

  const [keyVisualUploading, setKeyVisualUploading] = useState(false);
  const [keyVisualInputNonce, setKeyVisualInputNonce] = useState(0);
  const [lpIntroUploading, setLpIntroUploading] = useState(false);
  const [lpIntroInputNonce, setLpIntroInputNonce] = useState(0);

  const uploadKeyVisual = useCallback(
    async (file: File) => {
      if (!token) throw new Error("not logged in");
      const base =
        (process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL.trim()) ||
        (typeof window !== "undefined" && window.location ? window.location.origin : "") ||
        "http://localhost:8001";
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${base}/api/admin/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { url: string };
      return `${base}${data.url}`;
    },
    [token],
  );

  return (
    <div className="space-y-6">
      {mounted && !token ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          ログイン情報がありません。先にログインしてください。
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="mb-1 flex flex-wrap gap-1 border-b border-slate-800 pb-0" role="tablist" aria-label="企画新規の区分">
          {NEW_TABS.map((t) => {
            const active = newTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={[
                  "relative -mb-px rounded-t-lg border px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "border-slate-700 border-b-transparent bg-slate-900/40 text-indigo-100"
                    : "border-transparent text-slate-400 hover:text-slate-200",
                ].join(" ")}
                onClick={() => setNewTab(t.id)}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {newTab === "basic" ? (
          <div className="space-y-4">
            {role === "sysadmin" ? (
              <label className="block text-sm text-slate-200">
                紐づけるテナント
                <select
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                  value={tenantIdForCreate}
                  onChange={(e) => setTenantIdForCreate(e.target.value)}
                >
                  <option value="">選択してください</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name}（ID: {t.id}）
                    </option>
                  ))}
                </select>
                {tenants.length === 0 && token ? (
                  <p className="mt-2 text-xs text-amber-200">
                    テナントがありません。先に{" "}
                    <Link className="underline" href="/admin/tenants">
                      テナント管理
                    </Link>{" "}
                    から作成してください。
                  </p>
                ) : null}
              </label>
            ) : null}

            <label className="text-sm text-slate-200">
              投票で選べるアイテムの最大数
              <select
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                value={voteMaxProducts}
                onChange={(e) => setVoteMaxProducts(Number(e.target.value))}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} 件まで
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                公開LPではこの件数まで選べます（登録アイテムが少ない場合はその件数まで）。
              </p>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-200">
                コード番号（URL サブディレクトリ）
                <input
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ABC001"
                />
              </label>
              <label className="text-sm text-slate-200">
                企画名
                <input
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="春のファン投票企画"
                />
              </label>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-slate-200">KeyVisual</div>
              <p className="text-xs text-slate-500">
                画像ファイルをアップロードすると、保存用URLが設定されます（「登録する」でDBに反映）。
              </p>
              <input
                key={`kv-${keyVisualInputNonce}`}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={!token || keyVisualUploading}
                className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-100 hover:file:bg-slate-700 disabled:opacity-50"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !token) return;
                  setKeyVisualUploading(true);
                  setError(null);
                  try {
                    const url = await uploadKeyVisual(file);
                    setKeyVisualUrl(url);
                    setKeyVisualInputNonce((n) => n + 1);
                  } catch {
                    setError("KeyVisual のアップロードに失敗しました");
                  } finally {
                    setKeyVisualUploading(false);
                  }
                }}
              />
              {keyVisualUploading ? <div className="text-xs text-slate-400">アップロード中…</div> : null}
              {keyVisualUrl ? (
                <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-xs text-slate-400">プレビュー</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveMediaUrl(keyVisualUrl)}
                    alt="Key Visual"
                    className="max-h-48 w-auto max-w-full rounded-lg border border-slate-800 object-contain"
                  />
                  <button
                    type="button"
                    className="text-xs text-rose-300 underline hover:text-rose-200"
                    onClick={() => {
                      setKeyVisualUrl("");
                      setKeyVisualInputNonce((n) => n + 1);
                    }}
                  >
                    KeyVisual を外す
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500">未設定</div>
              )}
            </div>

            <label className="text-sm text-slate-200">
              KeyText
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                value={keyText}
                onChange={(e) => setKeyText(e.target.value)}
                placeholder="企画説明テキスト"
              />
            </label>

            <label className="text-sm text-slate-200">
              LP背景（クリエイティブ）
              <select
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                value={lpBackgroundKey}
                onChange={(e) => setLpBackgroundKey(e.target.value)}
              >
                {LP_BACKGROUND_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">LPの背景デザイン（パステル系プリセット）。公開ページに反映されます。</p>
            </label>
          </div>
        ) : newTab === "intro" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-700/80 bg-slate-950/30 p-4">
              <div className="text-sm font-medium text-slate-200">LP説明モーダル</div>
              <p className="mt-1 text-xs text-slate-500">
                公開LPを開いたときに一度表示される案内です。タイトル・画像・説明文のいずれかを入れると表示されます。
              </p>
              <label className="mt-4 block text-sm text-slate-200">
                モーダルタイトル
                <input
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                  value={lpIntroTitle}
                  onChange={(e) => setLpIntroTitle(e.target.value)}
                  placeholder="例：この投票について"
                />
              </label>
              <div className="mt-4 space-y-2">
                <div className="text-sm text-slate-200">モーダル画像（1枚）</div>
                <input
                  key={`lp-intro-${lpIntroInputNonce}`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={!token || lpIntroUploading}
                  className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-100 hover:file:bg-slate-700 disabled:opacity-50"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !token) return;
                    setLpIntroUploading(true);
                    setError(null);
                    try {
                      const url = await uploadKeyVisual(file);
                      setLpIntroImageUrl(url);
                      setLpIntroInputNonce((n) => n + 1);
                    } catch {
                      setError("モーダル画像のアップロードに失敗しました");
                    } finally {
                      setLpIntroUploading(false);
                    }
                  }}
                />
                {lpIntroUploading ? <div className="text-xs text-slate-400">アップロード中…</div> : null}
                {lpIntroImageUrl ? (
                  <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <div className="text-xs text-slate-400">プレビュー</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveMediaUrl(lpIntroImageUrl)}
                      alt="LP説明モーダル"
                      className="max-h-48 w-auto max-w-full rounded-lg border border-slate-800 object-contain"
                    />
                    <button
                      type="button"
                      className="text-xs text-rose-300 underline hover:text-rose-200"
                      onClick={() => {
                        setLpIntroImageUrl("");
                        setLpIntroInputNonce((n) => n + 1);
                      }}
                    >
                      画像を外す
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">未設定</div>
                )}
              </div>
              <label className="mt-4 block text-sm text-slate-200">
                説明文
                <textarea
                  className="mt-2 min-h-28 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                  value={lpIntroText}
                  onChange={(e) => setLpIntroText(e.target.value)}
                  placeholder="投票の流れや注意事項など"
                />
              </label>
            </div>
          </div>
        ) : newTab === "products" ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-sm text-slate-200">アイテム</div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                  onClick={() => {
                    setProductsModalOpen(true);
                    setError(null);
                  }}
                >
                  アイテム一覧
                </button>
                <span className="text-sm text-slate-400">
                  登録件数: <span className="font-mono text-slate-200">{products.length}</span> 件
                </span>
              </div>
              <p className="text-xs text-slate-500">
                「アイテム一覧」でアイテム名・説明・写真をフォーム入力します（JSONは直接編集しません）。
              </p>
            </div>
          </div>
        ) : newTab === "confirm" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-700/80 bg-slate-950/30 p-4">
              <div className="text-sm font-medium text-slate-200">投票前の確認モーダル</div>
              <p className="mt-1 text-xs text-slate-500">
                「投票する」を押したあと、メールアドレス入力の前に表示される確認画面の文言です。
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">メールアドレス取得</div>
                    <span
                      className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
                        emailRequired
                          ? "border-emerald-700/60 bg-emerald-950/30 text-emerald-200"
                          : "border-slate-700 bg-slate-950/40 text-slate-300"
                      }`}
                    >
                      {emailRequired ? "必須" : "任意"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">投票時にメールアドレス入力を必須にするか</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailRequired}
                  disabled={!token}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    emailRequired ? "bg-emerald-600" : "bg-slate-600"
                  } disabled:opacity-50`}
                  onClick={() => setEmailRequired((v) => !v)}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                      emailRequired ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
              <label className="mt-4 block text-sm text-slate-200">
                見出し
                <input
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                  value={voteConfirmTitle}
                  onChange={(e) => setVoteConfirmTitle(e.target.value)}
                  placeholder={DEFAULT_VOTE_CONFIRM_TITLE}
                />
                <p className="mt-1 text-xs text-slate-500">
                  未入力のときは「{DEFAULT_VOTE_CONFIRM_TITLE}」を表示します。
                </p>
              </label>
              <label className="mt-4 block text-sm text-slate-200">
                本文
                <textarea
                  className="mt-2 min-h-28 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-400"
                  value={voteConfirmBody}
                  onChange={(e) => setVoteConfirmBody(e.target.value)}
                  placeholder={DEFAULT_VOTE_CONFIRM_BODY_TEMPLATE}
                  spellCheck={true}
                />
                <p className="mt-1 text-xs text-slate-500">
                  選択必須件数は{" "}
                  <code className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[11px] text-slate-300">
                    {"{need}"}
                  </code>{" "}
                  と書くと自動で置き換わります。未入力のときは既定の案内文を表示します。
                </p>
              </label>
            </div>
          </div>
        ) : newTab === "landing" ? (
          <div className="space-y-4">
            <label className="text-sm text-slate-200">
              サンキューメッセージ
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">投票完了モーダルなどで表示するメッセージです。</p>
            </label>

            <label className="text-sm text-slate-200">
              ランディング先URL
              <textarea
                className="mt-2 min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-50 outline-none focus:border-indigo-400"
                value={landingUrl}
                onChange={(e) => setLandingUrl(e.target.value)}
                placeholder="https://example.com/..."
                spellCheck={false}
              />
              <p className="mt-1 text-xs text-slate-500">投票後の誘導先など。複数行で複数URLをメモしても構いません。</p>
            </label>

            <label className="text-sm text-slate-200">
              ランディングURL未登録時の終了メッセージ
              <textarea
                className="mt-2 min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-400"
                value={noLandingEndMessage}
                onChange={(e) => setNoLandingEndMessage(e.target.value)}
                placeholder={DEFAULT_NO_LANDING_END_MESSAGE}
                spellCheck={true}
              />
              <p className="mt-1 text-xs text-slate-500">
                ランディング先URLが未設定のとき、投票完了後の全画面に表示します。未入力の場合は「{DEFAULT_NO_LANDING_END_MESSAGE}」を表示します。
              </p>
            </label>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-rose-800/60 bg-rose-950/20 p-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-600 bg-transparent px-4 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:bg-slate-900/60 disabled:opacity-50"
            disabled={loading}
            onClick={onClose}
          >
            閉じる
          </button>
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
            disabled={!token || loading || code.length === 0 || name.length === 0 || (role === "sysadmin" && tenantIdForCreate.length === 0)}
            onClick={async () => {
              if (!token) return;
              setLoading(true);
              setError(null);
              try {
                const body: Record<string, unknown> = {
                  code,
                  name,
                  key_visual_url: keyVisualUrl || null,
                  key_text: keyText || null,
                  products_json: JSON.stringify(products),
                  thank_you_message: thankYouMessage || null,
                  landing_url: landingUrl.trim() ? landingUrl : null,
                  no_landing_end_message: noLandingEndMessage.trim() ? noLandingEndMessage.trim() : null,
                  lp_background_key: lpBackgroundKey,
                  lp_intro_title: lpIntroTitle.trim() ? lpIntroTitle.trim() : null,
                  lp_intro_image_url: lpIntroImageUrl.trim() ? lpIntroImageUrl.trim() : null,
                  lp_intro_text: lpIntroText.trim() ? lpIntroText.trim() : null,
                  vote_max_products: voteMaxProducts,
                  email_required: emailRequired,
                  vote_confirm_title: voteConfirmTitle.trim() ? voteConfirmTitle.trim() : null,
                  vote_confirm_body: voteConfirmBody.trim() ? voteConfirmBody.trim() : null,
                };
                if (role === "sysadmin") body.tenant_id = Number(tenantIdForCreate);
                const created = await apiPost<Campaign>("/admin/campaigns", body, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                onCreated?.(created);
                onClose();
              } catch {
                setError("登録に失敗しました（コード重複 or データ形式エラーの可能性）");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "登録中…" : "登録する"}
          </button>
        </div>
      </section>

      <ProductModal open={productsModalOpen} onClose={() => setProductsModalOpen(false)} products={products} onProductsChange={setProducts} token={token} />
    </div>
  );
}

