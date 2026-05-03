import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Outside (empty side area) */}
      <div className="min-h-screen bg-slate-50">
        {/* Center content column */}
        <div className="mx-auto w-full max-w-[1280px] bg-sky-100 px-2.5 py-8 sm:px-4 sm:py-10 md:w-[calc(100%-200px)]">
        <main className="space-y-10 sm:space-y-14">
        <header className="mx-auto max-w-[1080px] space-y-6 px-2.5 text-center sm:px-6 md:px-10 lg:px-14 xl:px-16">
          {/* Brand: put big at very top */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-medium tracking-wide text-slate-600 sm:text-sm">
              『選ぶ』を『絆』に変えるリワード型エンゲージメント
            </div>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 sm:h-16 sm:w-16">
                <Image
                  src="/icon.png"
                  alt="Aquirise"
                  fill
                  sizes="64px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex items-baseline gap-3">
                <div className="font-display text-4xl font-semibold tracking-[0.10em] text-slate-900 sm:text-5xl md:text-6xl">
                  Aquirise
                </div>
                <div className="text-sm font-medium tracking-wide text-slate-600 sm:text-base">アキライズ</div>
              </div>
            </div>
          </div>

          <div className="space-y-7 pt-6">
            <h1 className="font-display text-[28px] font-semibold leading-[1.2] tracking-tight sm:text-[34px] md:text-[46px]">
              <span className="block">人気投票とクーポンで、</span>
              <span className="block">
                <span className="whitespace-nowrap text-indigo-700">“好き”</span>を
                <span className="whitespace-nowrap text-indigo-700">“絆”</span>へ。
              </span>
            </h1>
            <p className="mx-auto max-w-[1080px] px-2.5 pt-3 text-left text-lg leading-snug text-slate-700 sm:px-6 sm:text-xl md:px-10 md:text-[26px] lg:px-14 xl:px-16">
              人気投票とクーポン配布を、一つにつないだ、リワード型のエンゲージメント基盤です。
              参加のきっかけから次のアクションまで、流れるユーザ体験を実現します。
            </p>

            <div className="mx-auto w-full max-w-[1080px] space-y-6 px-2.5 pt-8 sm:px-6 sm:pt-12 md:px-10 md:pt-16 lg:px-14 lg:pt-24 xl:px-16">
              <div className="space-y-6">
                <section className="space-y-3 text-center">
                  <h2 className="text-[26px] font-semibold leading-snug tracking-tight sm:text-[27px]">主な機能</h2>
                </section>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-left shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:shadow-xl sm:p-4">
                    <div className="text-center text-lg font-semibold">人気投票LP</div>
                    <ul className="mt-4 list-none space-y-3 text-base leading-relaxed text-slate-700">
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M4 6h6v6H4zM14 4h6v8h-6zM4 16h6v4H4zM14 14h6v6h-6z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">訴求商品の露出強化</div>
                          <div className="mt-1">商品商材をずらっと並べ、顧客の思う人気アイテムを選んでもらえます。</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M7 4h10a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a2 2 0 0 1 2-2z" />
                            <path d="M8 2v4M16 2v4" />
                            <path d="M7 20h10" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">PC / スマホで利用可能</div>
                          <div className="mt-1">もちろんPC・モバイルの両方をサポートしています。</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M4 19V5" />
                            <path d="M4 19h16" />
                            <path d="M7 16v-3" />
                            <path d="M12 16V8" />
                            <path d="M17 16v-6" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">運用に必要な管理機能</div>
                          <div className="mt-1">
                            管理画面では、投票後のランキング結果の表示や、投票期間の設定など、運用に必要な機能が無駄なく揃っています。
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-left shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:shadow-xl sm:p-4">
                    <div className="text-center text-lg font-semibold">クーポンLP</div>
                    <ul className="mt-4 list-none space-y-3 text-base leading-relaxed text-slate-700">
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M4 6h16v12H4z" />
                            <path d="M4 8l8 6 8-6" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">クーポン配布で顧客リスト自動生成</div>
                          <div className="mt-1">
                            クーポンはメールでの配布も行うことができることから、顧客リストの作成にも役立ちます。
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
                            <path d="M9 4v4h6" />
                            <path d="M9.5 16.2l2.2 2.2 3.3-3.3" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">機材の準備不要</div>
                          <div className="mt-1">
                            利用者クーポン利用確認機能があり、運用側には一切の機材の準備は不要です。
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M4 6h16v4H4z" />
                            <path d="M4 12h10v6H4z" />
                            <path d="M16 12h4v6h-4z" />
                            <path d="M6 8h.01" />
                            <path d="M6 14h.01" />
                            <path d="M6 16h.01" />
                            <path d="M18 14h.01" />
                            <path d="M18 16h.01" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">運用に必要な管理機能</div>
                          <div className="mt-1">
                            発行クーポン一覧取得・クーポン情報設定など、運用に必要な機能は無駄なく揃っています。
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1080px] rounded-3xl bg-transparent px-2.5 py-6 sm:px-6 sm:py-8 md:px-10 lg:px-14 xl:px-16">
          <div className="flex flex-col gap-12 sm:gap-20 md:gap-28 lg:gap-[6.5rem]">
            <div className="flex flex-col gap-8 sm:gap-10">
            <section className="space-y-3 pt-8 text-center sm:pt-12 md:pt-16 lg:pt-[5rem]">
              <h2 className="text-[26px] font-semibold leading-snug tracking-tight sm:text-[27px]">本サービスの特徴</h2>
              <p className="text-left text-lg leading-relaxed text-slate-600">
                ユーザの「参加したくなる体験」と、貴社の「運用のしやすさ」を、無理なく融合して両立します。簡単であるにもかかわらず、間違いのない効果を得られるツールです。
              </p>
            </section>

            <section>
              <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
                <div className="rounded-3xl bg-sky-300/45 p-5 ring-1 ring-sky-400/60 transition-colors duration-200 ease-out hover:bg-sky-300/65 sm:p-6">
                  <h3 className="text-[20px] font-semibold leading-snug tracking-tight">ユーザー体験の流れ</h3>
                  <ol className="mt-4 space-y-3 text-base text-slate-700">
                    <li>
                      <span className="font-semibold text-slate-900">1.</span> 人気投票LPで投票
                    </li>
                    <li>
                      <span className="font-semibold text-slate-900">2.</span> 投票完了でクーポン配布
                    </li>
                    <li>
                      <span className="font-semibold text-slate-900">3.</span> クーポンLPで利用・来店促進
                    </li>
                  </ol>
                </div>

                <div className="rounded-3xl bg-sky-300/45 p-5 ring-1 ring-sky-400/60 transition-colors duration-200 ease-out hover:bg-sky-300/65 sm:p-6">
                  <h3 className="text-[20px] font-semibold leading-snug tracking-tight">主要機能</h3>
                  <ul className="mt-4 space-y-3 text-base text-slate-700">
                    <li>簡単な設定で人気投票ページを自動生成</li>
                    <li>運用負担の少ない、クーポン提供画面の自動生成</li>
                    <li>結果を数値で可視化し運用へ確実なフィードバック</li>
                  </ul>
                </div>

                <div className="rounded-3xl bg-sky-300/45 p-5 ring-1 ring-sky-400/60 transition-colors duration-200 ease-out hover:bg-sky-300/65 sm:p-6">
                  <h3 className="text-[20px] font-semibold leading-snug tracking-tight">やさしい運用設計</h3>
                  <p className="mt-4 text-base leading-relaxed text-slate-700">
                    企画の立ち上げから公開・期間制御・クーポン運用まで、迷わない導線でスムーズに運用できます。
                  </p>
                </div>
              </div>
            </section>
            </div>

            <section className="rounded-3xl bg-sky-50/0 px-2 pb-3 sm:px-4 sm:pb-4">
              <div className="p-1 sm:p-0">
                <header className="space-y-3 text-center">
                  <h2 className="text-[26px] font-semibold leading-snug tracking-tight sm:text-[27px]">こんなことありませんか？</h2>
                  <p className="text-left text-lg leading-relaxed text-slate-600">
                    マーケティングにおいて、集客と既存客の定着は常に課題であると思いますが、その中で以下のような運営上の課題も出てくると思います。こういった課題の解決に役立つソリューションになっています。
                  </p>
                </header>

                <div className="mt-8 grid gap-4 sm:gap-6 lg:grid-cols-3">
                  <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm sm:p-5">
                    <div className="relative mb-4 h-28 w-full overflow-hidden rounded-2xl ring-1 ring-slate-200/80">
                      <Image
                        src="/person-thinking.jpg"
                        alt="考え込んでいる人の写真"
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 1024px) 90vw, 360px"
                      />
                    </div>
                    <h3 className="text-base font-semibold leading-snug text-slate-900">お客様の購買行動を理解したい</h3>
                    <ul className="mt-3 list-none space-y-2.5 text-base leading-relaxed text-slate-700">
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
                        <span>Web体験と店舗体験が異なる</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
                        <span>ユーザーの隠れたニーズがわからない</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
                        <span>新商品のインプレッションを知りたい</span>
                      </li>
                    </ul>
                  </article>

                  <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm sm:p-5">
                    <div className="relative mb-4 h-28 w-full overflow-hidden rounded-2xl ring-1 ring-slate-200/80">
                      <Image
                        src="/palm-gift-present.jpg"
                        alt="手のひらに小さなプレゼントを載せている写真"
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 90vw, 360px"
                      />
                    </div>
                    <h3 className="text-base font-semibold leading-snug text-slate-900">お客様に商品を認知させたい</h3>
                    <ul className="mt-3 list-none space-y-2.5 text-base leading-relaxed text-slate-700">
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                        <span>人気投票に商品を並べ認知させる</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                        <span>商品紹介を記載し認知度を高める</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                        <span>クーポンで実際に手に取ってもらう</span>
                      </li>
                    </ul>
                  </article>

                  <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm sm:p-5">
                    <div className="relative mb-4 h-28 w-full overflow-hidden rounded-2xl ring-1 ring-slate-200/80">
                      <Image
                        src="/store-queue-happy.jpg"
                        alt="店先の家の前に、楽しそうに並んでいる人々の写真"
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 90vw, 360px"
                      />
                    </div>
                    <h3 className="text-base font-semibold leading-snug text-slate-900">とにかく来店を促進したい</h3>
                    <ul className="mt-3 list-none space-y-2.5 text-base leading-relaxed text-slate-700">
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                        <span>参加型企画でエンゲージメントアップ</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                        <span>運用コスト低負荷でクーポン配布</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                        <span>顧客行動を数値で分析して把握する</span>
                      </li>
                    </ul>
                  </article>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-sky-50/0 px-2 pb-3 sm:px-4 sm:pb-4">
              <div className="p-1 sm:p-0">
                <header className="space-y-3 text-center">
                  <h2 className="text-[26px] font-semibold leading-snug tracking-tight sm:text-[27px]">簡単に無料で始める！</h2>
                  <p className="text-left text-lg leading-relaxed text-slate-600">
                    このサービスは、提供している我々自社でも利用し収益を得ています。その収益で運営ができているため、広くご活用いただくことが可能になっています。皆様の商品やサービスを展開し、より社会に貢献できることを目指しています。（※ただし一部有料の機能がございます。あらかじめご了承ください。）
                  </p>
                </header>

                <div className="mx-auto mt-8 max-w-md rounded-2xl bg-sky-300/40 p-4 ring-1 ring-sky-400/60 sm:p-5">
                  <ol className="list-none space-y-4 text-left text-base text-slate-700">
                    <li className="flex gap-3 sm:gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-medium tabular-nums text-slate-500 ring-1 ring-slate-200/90 sm:h-8 sm:w-8 sm:text-[13px]">
                        1
                      </span>
                      <span className="pt-0.5">所属する組織名を入れる</span>
                    </li>
                    <li className="flex gap-3 sm:gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-medium tabular-nums text-slate-500 ring-1 ring-slate-200/90 sm:h-8 sm:w-8 sm:text-[13px]">
                        2
                      </span>
                      <span className="pt-0.5">メールアドレスを入れる</span>
                    </li>
                    <li className="flex gap-3 sm:gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-medium tabular-nums text-slate-500 ring-1 ring-slate-200/90 sm:h-8 sm:w-8 sm:text-[13px]">
                        3
                      </span>
                      <span className="pt-0.5">登録するボタンを押下する</span>
                    </li>
                  </ol>
                </div>
                <div className="mt-6 flex justify-center">
                  <Link
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-[26px] py-[14px] text-[16px] font-semibold leading-snug text-white shadow-sm ring-1 ring-blue-700/25 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    href="/register"
                  >
                    さっそく無料で試してみる
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-sky-50/0 px-2 pb-3 sm:px-4 sm:pb-4">
              <div className="p-1 sm:p-0">
                <header className="space-y-3 text-center">
                  <h2 className="text-[26px] font-semibold leading-snug tracking-tight sm:text-[27px]">導入イメージ</h2>
                  <p className="text-left text-lg leading-relaxed text-slate-600">
                    企画を設計し、人気投票LPで参加を促し、クーポンで次のアクションへつなげる。Aquirise はこの一連の流れをスムーズに運用できるよう支援します。
                  </p>
                </header>

                <div
                  className="mt-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-6"
                  aria-label="導入の流れ: 左から①企画登録、②商品登録、③クーポン登録、④テスト、⑤公開"
                >
                  <div className="-mx-0.5 overflow-x-auto pb-1 sm:mx-0 sm:overflow-visible">
                    <div className="flex min-w-[min(100%,900px)] flex-row flex-nowrap items-center justify-center gap-0 sm:min-w-0 sm:flex-wrap sm:gap-y-4">
                      <div className="flex flex-[0_0_auto] flex-col items-center gap-2 px-1 sm:px-2">
                        <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 sm:h-24 sm:w-24">
                          <Image
                            src="/lp/intro-flow/split/step1.svg"
                            alt=""
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 72px, 96px"
                          />
                        </div>
                        <span className="max-w-[4.5rem] text-center text-xs font-medium leading-tight text-slate-700 sm:max-w-none sm:text-sm">
                          ① 企画登録
                        </span>
                      </div>
                      <div className="flex flex-[0_0_auto] items-center px-0.5 text-slate-300 sm:px-1" aria-hidden="true">
                        <span className="text-lg sm:text-xl">→</span>
                      </div>
                      <div className="flex flex-[0_0_auto] flex-col items-center gap-2 px-1 sm:px-2">
                        <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 sm:h-24 sm:w-24">
                          <Image
                            src="/lp/intro-flow/split/step2.svg"
                            alt=""
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 72px, 96px"
                          />
                        </div>
                        <span className="max-w-[4.5rem] text-center text-xs font-medium leading-tight text-slate-700 sm:max-w-none sm:text-sm">
                          ② 商品登録
                        </span>
                      </div>
                      <div className="flex flex-[0_0_auto] items-center px-0.5 text-slate-300 sm:px-1" aria-hidden="true">
                        <span className="text-lg sm:text-xl">→</span>
                      </div>
                      <div className="flex flex-[0_0_auto] flex-col items-center gap-2 px-1 sm:px-2">
                        <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 sm:h-24 sm:w-24">
                          <Image
                            src="/lp/intro-flow/split/step3.svg"
                            alt=""
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 72px, 96px"
                          />
                        </div>
                        <span className="max-w-[4.5rem] text-center text-xs font-medium leading-tight text-slate-700 sm:max-w-none sm:text-sm">
                          ③ クーポン登録
                        </span>
                      </div>
                      <div className="flex flex-[0_0_auto] items-center px-0.5 text-slate-300 sm:px-1" aria-hidden="true">
                        <span className="text-lg sm:text-xl">→</span>
                      </div>
                      <div className="flex flex-[0_0_auto] flex-col items-center gap-2 px-1 sm:px-2">
                        <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 sm:h-24 sm:w-24">
                          <Image
                            src="/lp/intro-flow/split/step4.svg"
                            alt=""
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 72px, 96px"
                          />
                        </div>
                        <span className="max-w-[4.5rem] text-center text-xs font-medium leading-tight text-slate-700 sm:max-w-none sm:text-sm">
                          ④ テスト
                        </span>
                      </div>
                      <div className="flex flex-[0_0_auto] items-center px-0.5 text-slate-300 sm:px-1" aria-hidden="true">
                        <span className="text-lg sm:text-xl">→</span>
                      </div>
                      <div className="flex flex-[0_0_auto] flex-col items-center gap-2 px-1 sm:px-2">
                        <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 sm:h-24 sm:w-24">
                          <Image
                            src="/lp/intro-flow/split/step5.svg"
                            alt=""
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 72px, 96px"
                          />
                        </div>
                        <span className="max-w-[4.5rem] text-center text-xs font-medium leading-tight text-slate-700 sm:max-w-none sm:text-sm">
                          ⑤ 公開
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-sky-50/0 px-2 pb-3 sm:px-4 sm:pb-4">
              <div className="p-1 sm:p-0">
                <header className="space-y-3 text-center">
                  <h2 className="text-[26px] font-semibold leading-snug tracking-tight sm:text-[27px]">お問い合わせ</h2>
                  <p className="text-left text-lg leading-relaxed text-slate-600">
                    大規模でのご利用、機能強化・改善のご要望、その他お見積り・ご質問などこちらからお送りください。
                  </p>
                </header>
                <div className="mt-6 flex justify-center">
                  <Link
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
                    href="/contact"
                  >
                    お問い合わせフォームへ
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
        </main>
        </div>
      </div>
    </div>
  );
}

