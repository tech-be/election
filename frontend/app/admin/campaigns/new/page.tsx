"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  ProductModal,
  type ProductDraft,
} from "../../../../components/admin/ProductModal";
import { apiGet, apiPost, type Campaign } from "../../../../lib/api";
import { LP_BACKGROUND_OPTIONS } from "../../../../lib/lpBackgrounds";
import { DEFAULT_NO_LANDING_END_MESSAGE } from "../../../../lib/noLandingEndMessage";

type TenantRow = { id: number; name: string };
import { resolveMediaUrl } from "../../../../lib/products";

export default function AdminCampaignNewPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [tenantIdForCreate, setTenantIdForCreate] = useState("");

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [productsModalOpen, setProductsModalOpen] = useState(false);

  const [keyVisualUploading, setKeyVisualUploading] = useState(false);
  const [keyVisualInputNonce, setKeyVisualInputNonce] = useState(0);
  const [lpIntroUploading, setLpIntroUploading] = useState(false);
  const [lpIntroInputNonce, setLpIntroInputNonce] = useState(0);

  const uploadKeyVisual = useCallback(
    async (file: File) => {
      if (!token) throw new Error("not logged in");
      const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${base}/admin/uploads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { url: string };
      return `${base}${data.url}`;
    },
    [token],
  );

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">管理画面</div>
          <h1 className="text-2xl font-semibold tracking-tight">企画新規登録</h1>
        </div>
        <button
          type="button"
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
          onClick={() => router.push("/admin/campaigns")}
        >
          一覧へ戻る
        </button>
      </header>

      {mounted && !token ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          ログイン情報がありません。先にログインしてください。
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
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
          {keyVisualUploading ? (
            <div className="text-xs text-slate-400">アップロード中…</div>
          ) : null}
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
            {lpIntroUploading ? (
              <div className="text-xs text-slate-400">アップロード中…</div>
            ) : null}
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
          <p className="mt-1 text-xs text-slate-500">
            LPの背景デザイン（パステル系プリセット）。公開ページに反映されます。
          </p>
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
          <p className="mt-1 text-xs text-slate-500">
            投票後の誘導先など。複数行で複数URLをメモしても構いません。
          </p>
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
            ランディング先URLが未設定のとき、投票完了後の全画面に表示します。未入力の場合は「
            {DEFAULT_NO_LANDING_END_MESSAGE}
            」を表示します。
          </p>
        </label>

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

        <label className="text-sm text-slate-200">
          サンキューメッセージ
          <textarea
            className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
            value={thankYouMessage}
            onChange={(e) => setThankYouMessage(e.target.value)}
          />
        </label>

        {error ? (
          <div className="rounded-xl border border-rose-800/60 bg-rose-950/20 p-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
          disabled={
            !token ||
            loading ||
            code.length === 0 ||
            name.length === 0 ||
            (role === "sysadmin" && tenantIdForCreate.length === 0)
          }
          onClick={async () => {
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
              };
              if (role === "sysadmin") body.tenant_id = Number(tenantIdForCreate);
              await apiPost<Campaign>(
                "/admin/campaigns",
                body,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );
              router.push("/admin/campaigns");
            } catch {
              setError("登録に失敗しました（コード重複 or データ形式エラーの可能性）");
            } finally {
              setLoading(false);
            }
          }}
        >
          登録する
        </button>
      </section>

      <ProductModal
        open={productsModalOpen}
        onClose={() => setProductsModalOpen(false)}
        products={products}
        onProductsChange={setProducts}
        token={token}
      />
    </main>
  );
}
