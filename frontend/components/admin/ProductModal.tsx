"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";

import { apiPatch, type Campaign } from "../../lib/api";
import { parseProductsJson, productsToJson, resolveMediaUrl, type ProductDraft } from "../../lib/products";

export type { ProductDraft } from "../../lib/products";
export { parseProductsJson, productsToJson } from "../../lib/products";

type Props = {
  open: boolean;
  onClose: () => void;
  products: ProductDraft[];
  onProductsChange: (next: ProductDraft[]) => void;
  token: string | null;
  /** 設定時は「保存」で DB の products_json を更新 */
  campaignCode?: string | null;
  /** true のとき全画面オーバーレイではなく、親（例: タブ）内に表示 */
  embedded?: boolean;
};

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

export function ProductModal({
  open,
  onClose,
  products,
  onProductsChange,
  token,
  campaignCode = null,
  embedded = false,
}: Props) {
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pImg1, setPImg1] = useState<File | null>(null);
  const [pImg2, setPImg2] = useState<File | null>(null);
  const [pImg3, setPImg3] = useState<File | null>(null);
  const [addSlotKey1, setAddSlotKey1] = useState(0);
  const [addSlotKey2, setAddSlotKey2] = useState(0);
  const [addSlotKey3, setAddSlotKey3] = useState(0);
  const [addingOpen, setAddingOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [eName, setEName] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eImg1, setEImg1] = useState<File | null>(null);
  const [eImg2, setEImg2] = useState<File | null>(null);
  const [eImg3, setEImg3] = useState<File | null>(null);
  const [editSlotKey1, setEditSlotKey1] = useState(0);
  const [editSlotKey2, setEditSlotKey2] = useState(0);
  const [editSlotKey3, setEditSlotKey3] = useState(0);
  /** 登録済みURLを保存時に null にする予定 */
  const [eRemoveServer1, setERemoveServer1] = useState(false);
  const [eRemoveServer2, setERemoveServer2] = useState(false);
  const [eRemoveServer3, setERemoveServer3] = useState(false);
  const [editUploading, setEditUploading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingList, setSavingList] = useState(false);
  const [inlineSaved, setInlineSaved] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;

  const addPreview1 = useObjectUrl(pImg1);
  const addPreview2 = useObjectUrl(pImg2);
  const addPreview3 = useObjectUrl(pImg3);
  const editPreview1 = useObjectUrl(eImg1);
  const editPreview2 = useObjectUrl(eImg2);
  const editPreview3 = useObjectUrl(eImg3);

  useEffect(() => {
    if (!open || products.length === 0) return;
    if (products.every((p) => p.sortId != null && String(p.sortId).trim().length > 0)) return;
    const next = products.map((p) => ({
      ...p,
      sortId:
        p.sortId != null && String(p.sortId).trim().length > 0
          ? String(p.sortId)
          : crypto.randomUUID(),
    }));
    if (openRef.current) onProductsChange(next);
  }, [open, products, onProductsChange]);

  /** `campaignCode` があるとき DB の products_json を更新し、一覧を応答で同期する */
  async function saveProductsJsonToDb(list: ProductDraft[]): Promise<boolean> {
    if (!token || !campaignCode) return false;
    setSavingList(true);
    setModalError(null);
    setInlineSaved(false);
    try {
      const updated = await apiPatch<Campaign>(
        `/admin/campaigns/${encodeURIComponent(campaignCode)}`,
        { products_json: productsToJson(list) },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!openRef.current) return true;
      onProductsChange(parseProductsJson(updated.products_json));
      if (embedded) {
        setInlineSaved(true);
        window.setTimeout(() => setInlineSaved(false), 3500);
      }
      return true;
    } catch {
      setModalError("アイテム一覧の保存に失敗しました");
      return false;
    } finally {
      setSavingList(false);
    }
  }

  async function reorderProducts(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= products.length || to >= products.length) return;
    const next = [...products];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onProductsChange(next);
    if (campaignCode) {
      await saveProductsJsonToDb(next);
    }
  }

  function onHandleDragStart(e: DragEvent, index: number) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }

  function onRowDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onRowDrop(e: DragEvent, dropIndex: number) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    const from = Number.parseInt(raw, 10);
    if (Number.isNaN(from)) return;
    void reorderProducts(from, dropIndex);
  }

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
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

  useEffect(() => {
    if (!open) return;
    setModalError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editingIndex !== null) {
        setEditingIndex(null);
        return;
      }
      if (addingOpen) {
        setAddingOpen(false);
        return;
      }
      if (!embedded) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, editingIndex, addingOpen, embedded]);

  useEffect(() => {
    if (!open) {
      setEditingIndex(null);
      setAddingOpen(false);
    }
  }, [open]);

  function resetAddForm() {
    setPName("");
    setPDesc("");
    setPImg1(null);
    setPImg2(null);
    setPImg3(null);
    setAddSlotKey1((k) => k + 1);
    setAddSlotKey2((k) => k + 1);
    setAddSlotKey3((k) => k + 1);
  }

  function openAdd() {
    resetAddForm();
    setAddingOpen(true);
  }

  async function addProduct() {
    if (!token) {
      setModalError("ログインしてください");
      return;
    }
    if (!pName.trim()) {
      setModalError("アイテム名を入力してください");
      return;
    }
    setUploading(true);
    setModalError(null);
    try {
      const [u1, u2, u3] = await Promise.all([
        pImg1 ? uploadImage(pImg1) : Promise.resolve(null),
        pImg2 ? uploadImage(pImg2) : Promise.resolve(null),
        pImg3 ? uploadImage(pImg3) : Promise.resolve(null),
      ]);
      const next: ProductDraft[] = [
        ...products,
        {
          name: pName.trim(),
          description: pDesc,
          image1Url: u1,
          image2Url: u2,
          image3Url: u3,
          sortId: crypto.randomUUID(),
        },
      ];
      onProductsChange(next);
      setAddingOpen(false);
      resetAddForm();
      if (campaignCode) {
        await saveProductsJsonToDb(next);
      }
    } catch {
      setModalError("写真のアップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  function openEdit(index: number) {
    const p = products[index];
    if (!p) return;
    setEditingIndex(index);
    setEName(p.name);
    setEDesc(p.description);
    setEImg1(null);
    setEImg2(null);
    setEImg3(null);
    setEditSlotKey1((k) => k + 1);
    setEditSlotKey2((k) => k + 1);
    setEditSlotKey3((k) => k + 1);
    setERemoveServer1(false);
    setERemoveServer2(false);
    setERemoveServer3(false);
    setEditError(null);
  }

  async function saveEditedProduct() {
    if (editingIndex === null || !token) return;
    if (!eName.trim()) {
      setEditError("アイテム名を入力してください");
      return;
    }
    setEditUploading(true);
    setEditError(null);
    try {
      const cur = products[editingIndex];
      const u1 = eImg1 ? await uploadImage(eImg1) : eRemoveServer1 ? null : (cur.image1Url ?? null);
      const u2 = eImg2 ? await uploadImage(eImg2) : eRemoveServer2 ? null : (cur.image2Url ?? null);
      const u3 = eImg3 ? await uploadImage(eImg3) : eRemoveServer3 ? null : (cur.image3Url ?? null);
      const next = [...products];
      next[editingIndex] = {
        ...cur,
        name: eName.trim(),
        description: eDesc,
        image1Url: u1,
        image2Url: u2,
        image3Url: u3,
      };
      onProductsChange(next);
      setEditingIndex(null);
      if (campaignCode) {
        await saveProductsJsonToDb(next);
      }
    } catch {
      setEditError("写真のアップロードに失敗しました");
    } finally {
      setEditUploading(false);
    }
  }

  async function removeProduct(index: number) {
    const next = products.filter((_, i) => i !== index);
    onProductsChange(next);
    if (campaignCode) {
      await saveProductsJsonToDb(next);
    }
  }

  if (!open) return null;

  const editingProduct = editingIndex !== null ? products[editingIndex] : null;

  const titleId = "products-modal-title";

  const mainShell = (
    <div
      className={
        embedded
          ? "flex w-full max-h-[min(75vh,720px)] min-h-[200px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950"
          : "flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-xl"
      }
      role={embedded ? "region" : undefined}
      aria-labelledby={embedded ? titleId : undefined}
      onClick={embedded ? undefined : (e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 id={titleId} className="text-lg font-semibold text-slate-100">
          アイテム一覧
        </h2>
        <button
          type="button"
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-amber-950 shadow-sm hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-400 disabled:opacity-70"
          disabled={!token || savingList}
          onClick={() => openAdd()}
        >
          追加
        </button>
      </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {inlineSaved ? (
            <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/25 p-3 text-sm text-emerald-200">
              アイテム一覧をDBに保存しました
            </div>
          ) : null}
          {modalError ? (
            <div className="rounded-xl border border-rose-800/60 bg-rose-950/20 p-3 text-sm text-rose-200">
              {modalError}
            </div>
          ) : null}

          {!token ? (
            <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-3 text-sm text-amber-100">
              ログインが必要です。先に管理ログインしてください。
            </div>
          ) : null}

          <div>
            <div className="mb-2 text-sm font-medium text-slate-300">登録済みアイテム</div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40">
              {products.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-400">
                  まだありません。上のフォームから登録してください。
                </div>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {products.map((p, idx) => (
                    <li
                      key={p.sortId ?? `row-${idx}`}
                      className="px-4 py-3"
                      onDragOver={onRowDragOver}
                      onDrop={(e) => onRowDrop(e, idx)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex shrink-0 flex-col items-center pt-0.5">
                          <div
                            className="cursor-grab rounded border border-transparent p-1 text-slate-500 hover:border-slate-600 hover:bg-slate-800/80 hover:text-slate-300 active:cursor-grabbing"
                            draggable={!savingList}
                            onDragStart={(e) => onHandleDragStart(e, idx)}
                            aria-label="ドラッグして並び替え"
                            title="ドラッグして並び替え"
                          >
                            <svg width="14" height="18" viewBox="0 0 14 18" aria-hidden className="block">
                              <circle cx="4" cy="3.5" r="1.25" fill="currentColor" />
                              <circle cx="10" cy="3.5" r="1.25" fill="currentColor" />
                              <circle cx="4" cy="9" r="1.25" fill="currentColor" />
                              <circle cx="10" cy="9" r="1.25" fill="currentColor" />
                              <circle cx="4" cy="14.5" r="1.25" fill="currentColor" />
                              <circle cx="10" cy="14.5" r="1.25" fill="currentColor" />
                            </svg>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-100">{p.name}</div>
                          {p.description ? (
                            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-400">{p.description}</p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {[p.image1Url, p.image2Url, p.image3Url].map((u, i) =>
                              u ? (
                                <a
                                  key={i}
                                  className="text-xs text-indigo-300 underline"
                                  href={u}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  写真{i + 1}
                                </a>
                              ) : null,
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <button
                            type="button"
                            className="text-xs text-indigo-300 hover:underline disabled:opacity-50"
                            disabled={savingList}
                            onClick={() => openEdit(idx)}
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            className="text-xs text-rose-300 hover:underline disabled:opacity-50"
                            disabled={savingList}
                            onClick={() => void removeProduct(idx)}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {embedded ? (
          campaignCode && token ? (
            <div className="shrink-0 border-t border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-500">
              アイテムの追加・編集・並べ替え・削除のたびにDBへ保存されます。企画の他項目はページ下部の「更新」で保存されます。
            </div>
          ) : null
        ) : (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950 px-4 py-3">
            <div className="min-w-0 flex-1 text-xs text-slate-500">
              {campaignCode && token ? (
                <span>変更は操作のたびにDBへ保存されます。</span>
              ) : token ? (
                <span>まだ企画が保存されていないためDBには書き込まれません。閉じると内容はこの画面のフォームに反映されたままです。</span>
              ) : null}
            </div>
            <button
              type="button"
              className="shrink-0 rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
              disabled={savingList}
              onClick={() => onClose()}
            >
              閉じる
            </button>
          </div>
        )}
    </div>
  );

  return (
    <>
      {embedded ? (
        mainShell
      ) : (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {mainShell}
        </div>
      )}

      {addingOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-add-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAddingOpen(false);
          }}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-600 bg-slate-950 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h3 id="product-add-title" className="text-lg font-semibold text-slate-100">
                アイテムを追加
              </h3>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                disabled={uploading}
                onClick={() => setAddingOpen(false)}
              >
                閉じる
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto p-4">
              <label className="block text-sm text-slate-200">
                アイテム名
                <input
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="アイテム名"
                />
              </label>
              <label className="block text-sm text-slate-200">
                アイテム説明
                <textarea
                  className="mt-2 min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  placeholder="説明を入力"
                />
              </label>
              <div className="text-sm text-slate-300">写真（最大3枚・任意）</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    {
                      label: "写真1",
                      setFile: setPImg1,
                      preview: addPreview1,
                      slotKey: addSlotKey1,
                      bumpKey: () => setAddSlotKey1((k) => k + 1),
                    },
                    {
                      label: "写真2",
                      setFile: setPImg2,
                      preview: addPreview2,
                      slotKey: addSlotKey2,
                      bumpKey: () => setAddSlotKey2((k) => k + 1),
                    },
                    {
                      label: "写真3",
                      setFile: setPImg3,
                      preview: addPreview3,
                      slotKey: addSlotKey3,
                      bumpKey: () => setAddSlotKey3((k) => k + 1),
                    },
                  ] as const
                ).map(({ label, setFile, preview, slotKey, bumpKey }) => (
                  <div key={label} className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-2">
                    <label className="text-xs text-slate-200">
                      {label}
                      <input
                        key={`add-${label}-${slotKey}`}
                        className="mt-1 block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-slate-800 file:px-2 file:py-1 file:text-slate-100"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {preview ? (
                      <div className="space-y-2">
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-slate-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preview} alt="" className="h-full w-full object-cover" />
                        </div>
                        <button
                          type="button"
                          className="text-xs font-medium text-rose-300 underline hover:text-rose-200"
                          onClick={() => {
                            setFile(null);
                            bumpKey();
                          }}
                        >
                          選択を削除
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900"
                  disabled={uploading}
                  onClick={() => setAddingOpen(false)}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
                  disabled={!token || uploading || pName.trim().length === 0}
                  onClick={() => void addProduct()}
                >
                  {uploading ? "追加中…" : "追加"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingIndex !== null && editingProduct ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-edit-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingIndex(null);
          }}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-600 bg-slate-950 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h3 id="product-edit-title" className="text-lg font-semibold text-slate-100">
                アイテムを編集
              </h3>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                onClick={() => setEditingIndex(null)}
              >
                閉じる
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto p-4">
              {editError ? (
                <div className="rounded-xl border border-rose-800/60 bg-rose-950/20 p-3 text-sm text-rose-200">
                  {editError}
                </div>
              ) : null}
              <label className="block text-sm text-slate-200">
                アイテム名
                <input
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                  value={eName}
                  onChange={(e) => setEName(e.target.value)}
                />
              </label>
              <label className="block text-sm text-slate-200">
                アイテム説明
                <textarea
                  className="mt-2 min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                  value={eDesc}
                  onChange={(e) => setEDesc(e.target.value)}
                />
              </label>
              <div className="text-sm text-slate-300">写真（最大3枚・任意・未選択なら現状維持）</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {([1, 2, 3] as const).map((slot) => {
                  const url =
                    slot === 1
                      ? editingProduct.image1Url
                      : slot === 2
                        ? editingProduct.image2Url
                        : editingProduct.image3Url;
                  const resolved = url ? resolveMediaUrl(String(url)) : "";
                  const newPreview = slot === 1 ? editPreview1 : slot === 2 ? editPreview2 : editPreview3;
                  const slotKey = slot === 1 ? editSlotKey1 : slot === 2 ? editSlotKey2 : editSlotKey3;
                  const bumpSlotKey =
                    slot === 1
                      ? () => setEditSlotKey1((k) => k + 1)
                      : slot === 2
                        ? () => setEditSlotKey2((k) => k + 1)
                        : () => setEditSlotKey3((k) => k + 1);
                  const setFile =
                    slot === 1 ? setEImg1 : slot === 2 ? setEImg2 : setEImg3;
                  const removeServer =
                    slot === 1 ? eRemoveServer1 : slot === 2 ? eRemoveServer2 : eRemoveServer3;
                  const setRemoveServer =
                    slot === 1 ? setERemoveServer1 : slot === 2 ? setERemoveServer2 : setERemoveServer3;
                  return (
                    <div key={slot} className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-2">
                      <label className="text-xs text-slate-200">
                        写真{slot}
                        <input
                          key={`eimg${slot}-${slotKey}`}
                          className="mt-1 block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-slate-800 file:px-2 file:py-1 file:text-slate-100"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            setFile(f);
                            if (f) setRemoveServer(false);
                          }}
                        />
                      </label>
                      {newPreview ? (
                        <div className="space-y-2">
                          <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-slate-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={newPreview} alt="" className="h-full w-full object-cover" />
                          </div>
                          <button
                            type="button"
                            className="text-xs font-medium text-rose-300 underline hover:text-rose-200"
                            onClick={() => {
                              setFile(null);
                              bumpSlotKey();
                            }}
                          >
                            選択を削除
                          </button>
                        </div>
                      ) : removeServer ? (
                        <div className="space-y-2">
                          <p className="text-[10px] leading-relaxed text-amber-200/90">
                            保存するとこの写真は削除されます。
                          </p>
                          <button
                            type="button"
                            className="text-xs font-medium text-slate-400 underline hover:text-slate-200"
                            onClick={() => setRemoveServer(false)}
                          >
                            取り消し
                          </button>
                        </div>
                      ) : resolved ? (
                        <div className="space-y-2">
                          <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-slate-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={resolved} alt="" className="h-full w-full object-cover" />
                          </div>
                          <button
                            type="button"
                            className="text-xs font-medium text-rose-300 underline hover:text-rose-200"
                            onClick={() => setRemoveServer(true)}
                          >
                            画像を削除
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-600">未設定</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900"
                  disabled={editUploading}
                  onClick={() => setEditingIndex(null)}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
                  disabled={!token || editUploading || savingList || eName.trim().length === 0}
                  onClick={() => void saveEditedProduct()}
                >
                  {editUploading ? "保存中…" : "保存"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
