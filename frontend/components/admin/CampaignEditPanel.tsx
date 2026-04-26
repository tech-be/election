"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ProductModal,
  parseProductsJson,
  productsToJson,
  type ProductDraft,
} from "../../components/admin/ProductModal";
import { apiGet, apiPatch, type Campaign } from "../../lib/api";
import { LP_BACKGROUND_OPTIONS } from "../../lib/lpBackgrounds";
import { resolveMediaUrl } from "../../lib/products";
import { DEFAULT_NO_LANDING_END_MESSAGE } from "../../lib/noLandingEndMessage";
import {
  DEFAULT_VOTE_CONFIRM_BODY_TEMPLATE,
  DEFAULT_VOTE_CONFIRM_TITLE,
} from "../../lib/voteConfirmModal";
import { clampVoteMaxProducts } from "../../lib/voteSelection";

const EDIT_TABS = [
  { id: "basic" as const, label: "基本情報" },
  { id: "intro" as const, label: "説明モーダル" },
  { id: "products" as const, label: "アイテム登録" },
  { id: "confirm" as const, label: "確認モーダル" },
  { id: "landing" as const, label: "最終ランディング" },
];

export function CampaignEditPanel({
  code,
  token,
  onClose,
  onSaved,
}: {
  code: string;
  token: string | null;
  onClose: () => void;
  onSaved?: (updated: Partial<Campaign> & { code: string }) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [voteConfirmTitle, setVoteConfirmTitle] = useState("");
  const [voteConfirmBody, setVoteConfirmBody] = useState("");
  const [emailRequired, setEmailRequired] = useState(true);

  const [keyVisualUploading, setKeyVisualUploading] = useState(false);
  const [keyVisualInputNonce, setKeyVisualInputNonce] = useState(0);
  const [lpIntroUploading, setLpIntroUploading] = useState(false);
  const [lpIntroInputNonce, setLpIntroInputNonce] = useState(0);
  const [saveSuccessOpen, setSaveSuccessOpen] = useState(false);
  const [editTab, setEditTab] = useState<(typeof EDIT_TABS)[number]["id"]>("basic");

  const uploadImage = useCallback(
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

  useEffect(() => {
    if (!code) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const c = await apiGet<Campaign>(`/campaigns/${encodeURIComponent(code)}`);
        setName(c.name ?? "");
        setKeyVisualUrl(c.key_visual_url ?? "");
        setKeyText(c.key_text ?? "");
        setProducts(parseProductsJson(c.products_json));
        setThankYouMessage(c.thank_you_message ?? "");
        setLandingUrl(c.landing_url ?? "");
        setNoLandingEndMessage(c.no_landing_end_message ?? "");
        setLpBackgroundKey(c.lp_background_key?.trim() || "pastel_lavender");
        setLpIntroTitle(c.lp_intro_title ?? "");
        setLpIntroImageUrl(c.lp_intro_image_url ?? "");
        setLpIntroText(c.lp_intro_text ?? "");
        setVoteMaxProducts(clampVoteMaxProducts(c.vote_max_products ?? 3));
        setVoteConfirmTitle(c.vote_confirm_title ?? "");
        setVoteConfirmBody(c.vote_confirm_body ?? "");
        setEmailRequired(c.email_required ?? true);
      } catch {
        setError("取得に失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  const saveCampaign = useCallback(
    async (after: "close" | "notice") => {
      if (!token) return;
      setSaving(true);
      setError(null);
      try {
        await apiPatch<Campaign>(
          `/admin/campaigns/${encodeURIComponent(code)}`,
          {
            name,
            key_visual_url: keyVisualUrl || null,
            key_text: keyText || null,
            products_json: productsToJson(products),
            thank_you_message: thankYouMessage || null,
            landing_url: landingUrl.trim() ? landingUrl : null,
            no_landing_end_message: noLandingEndMessage.trim() ? noLandingEndMessage.trim() : null,
            lp_background_key: lpBackgroundKey,
            lp_intro_title: lpIntroTitle.trim() ? lpIntroTitle.trim() : null,
            lp_intro_image_url: lpIntroImageUrl.trim() ? lpIntroImageUrl.trim() : null,
            lp_intro_text: lpIntroText.trim() ? lpIntroText.trim() : null,
            vote_max_products: voteMaxProducts,
            vote_confirm_title: voteConfirmTitle.trim() ? voteConfirmTitle.trim() : null,
            vote_confirm_body: voteConfirmBody.trim() ? voteConfirmBody.trim() : null,
            email_required: emailRequired,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        onSaved?.({ code, name });
        if (after === "close") onClose();
        else setSaveSuccessOpen(true);
      } catch {
        setError("更新に失敗しました（データ形式エラーの可能性）");
      } finally {
        setSaving(false);
      }
    },
    [
      token,
      code,
      name,
      keyVisualUrl,
      keyText,
      products,
      thankYouMessage,
      landingUrl,
      noLandingEndMessage,
      lpBackgroundKey,
      lpIntroTitle,
      lpIntroImageUrl,
      lpIntroText,
      voteMaxProducts,
      voteConfirmTitle,
      voteConfirmBody,
      emailRequired,
      onClose,
      onSaved,
    ],
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-slate-400">
          企画コード: <span className="font-mono text-slate-200">{code}</span>
        </div>
      </div>

      {!token ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          ログイン情報がありません。先にログインしてください。
        </div>
      ) : null}

      {loading ? <div className="text-sm text-slate-300">読み込み中...</div> : null}
      {error ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="mb-1 flex flex-wrap gap-1 border-b border-slate-800 pb-0" role="tablist" aria-label="企画編集の区分">
          {EDIT_TABS.map((t) => {
            const active = editTab === t.id;
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
                onClick={() => setEditTab(t.id)}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {editTab === "basic" ? (
          <div className="space-y-4">
            <label className="text-sm text-slate-200">
              企画名
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

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
              <p className="mt-1 text-xs text-slate-500">公開LPではこの件数まで選べます（登録アイテムが少ない場合はその件数まで）。</p>
            </label>

            <div className="space-y-2">
              <div className="text-sm text-slate-200">KeyVisual</div>
              <p className="text-xs text-slate-500">画像ファイルをアップロードすると、保存用URLが設定されます（「更新」でDBに反映）。</p>
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
                    const url = await uploadImage(file);
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
        ) : editTab === "intro" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-700/80 bg-slate-950/30 p-4">
              <div className="text-sm font-medium text-slate-200">LP説明モーダル</div>
              <p className="mt-1 text-xs text-slate-500">
                公開LPを開いたときに一度表示される案内です。タイトル・画像・説明文のいずれかを入れると表示されます（閉じた後は同一ブラウザセッションでは再表示されません）。
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
                      const url = await uploadImage(file);
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
        ) : editTab === "confirm" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-700/80 bg-slate-950/30 p-4">
              <div className="text-sm font-medium text-slate-200">投票前の確認モーダル</div>
              <p className="mt-1 text-xs text-slate-500">「投票する」を押したあと、メールアドレス入力の前に表示される確認画面の文言です。</p>

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
                <p className="mt-1 text-xs text-slate-500">未入力のときは「{DEFAULT_VOTE_CONFIRM_TITLE}」を表示します。</p>
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
        ) : editTab === "landing" ? (
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
        ) : editTab === "products" ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              アイテムの追加・並べ替え・編集・削除は下の一覧で行います。操作のたびにアイテムデータはDBへ保存されます（企画の他項目はページ下部の「更新」で保存されます）。
            </p>
            <ProductModal
              open
              embedded
              onClose={() => {}}
              products={products}
              onProductsChange={setProducts}
              token={token}
              campaignCode={code}
            />
          </div>
        ) : null}

        <div className="space-y-3 border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-500">
            保存せずに閉じる場合は左の「閉じる」。変更を反映する場合は「更新」または「更新して閉じる」を押してください。
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-600 bg-transparent px-4 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:bg-slate-900/60 disabled:opacity-50"
              disabled={saving}
              onClick={onClose}
            >
              閉じる
            </button>
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-600 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-500 hover:bg-slate-900 disabled:opacity-60"
              disabled={!token || saving || name.length === 0}
              onClick={() => void saveCampaign("notice")}
            >
              更新
            </button>
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
              disabled={!token || saving || name.length === 0}
              onClick={() => void saveCampaign("close")}
            >
              更新して閉じる
            </button>
          </div>
        </div>
      </div>

      {saveSuccessOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="save-success-title">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <h2 id="save-success-title" className="text-lg font-semibold text-slate-50">
              お知らせ
            </h2>
            <p className="mt-3 text-sm text-slate-300">更新しました</p>
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
              onClick={() => setSaveSuccessOpen(false)}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

