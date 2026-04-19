import Image from "next/image";
import { notFound } from "next/navigation";

import { CampaignVoteSection } from "../../components/lp/CampaignVoteSection";
import { LpIntroModal } from "../../components/lp/LpIntroModal";
import { PopDecorations } from "../../components/lp/PopDecorations";
import { lpFont } from "../lpFont";
import { lpBackgroundClassName } from "../../lib/lpBackgrounds";
import { apiGet, type Campaign } from "../../lib/api";
import { parseProductsJson, resolveMediaUrl } from "../../lib/products";
import { requiredVoteSelections } from "../../lib/voteSelection";

/** ブラウザが /favicon.ico 等を取りに来たときに [code] に誤マッチしないよう除外 */
const RESERVED_CAMPAIGN_CODES = new Set(
  ["favicon.ico", "robots.txt", "sitemap.xml", "manifest.webmanifest", "site.webmanifest"].map((s) =>
    s.toLowerCase(),
  ),
);

export default async function CampaignLp({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (RESERVED_CAMPAIGN_CODES.has(code.toLowerCase())) {
    notFound();
  }
  const c = await apiGet<Campaign>(`/campaigns/${encodeURIComponent(code)}`);

  const products = parseProductsJson(c.products_json);
  const pickCount = requiredVoteSelections(c.vote_max_products, products.length);
  const keyVisualSrc = c.key_visual_url ? resolveMediaUrl(c.key_visual_url) : "";

  return (
    <div className={`${lpFont.className} ${lpBackgroundClassName(c.lp_background_key)} relative`}>
      <LpIntroModal
        campaignCode={c.code}
        title={c.lp_intro_title}
        imageUrl={c.lp_intro_image_url}
        bodyText={c.lp_intro_text}
      />
      <PopDecorations />
      <div className="mx-auto w-full max-w-[740px] px-4 py-10">
        <main className="space-y-10">
          <header className="space-y-5 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              {c.name}
            </h1>
            {c.key_text ? (
              <p className="mx-auto max-w-2xl whitespace-pre-wrap text-center text-base leading-relaxed text-slate-700 sm:text-lg">
                {c.key_text}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                {products.length === 0
                  ? "アイテムが登録されると投票できます。"
                  : `気になるアイテムを${pickCount}件選んで投票しよう。`}
              </p>
            )}
          </header>

      {keyVisualSrc ? (
        <section className="mx-auto max-w-[320px] overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="relative aspect-[16/7] w-full">
            <Image
              src={keyVisualSrc}
              alt="Key Visual"
              fill
              className="object-cover"
              sizes="320px"
              priority
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            アイテムを選んで投票
          </h2>
          {products.length > 0 ? (
            <span className="hidden rounded-full border border-slate-200/90 bg-white/80 px-3 py-1 text-xs text-slate-600 shadow-sm backdrop-blur sm:inline">
              最大{pickCount}件まで
            </span>
          ) : null}
        </div>
        <CampaignVoteSection
          campaignCode={c.code}
          products={products}
          thankYouMessage={c.thank_you_message ?? null}
          landingUrl={c.landing_url ?? null}
          voteMaxProducts={c.vote_max_products}
          noLandingEndMessage={c.no_landing_end_message}
          voteConfirmTitle={c.vote_confirm_title ?? null}
          voteConfirmBody={c.vote_confirm_body ?? null}
        />
      </section>
        </main>
      </div>
    </div>
  );
}
