import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
    <main className="space-y-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-200">
          funsite
          <span className="text-slate-400">LP / 管理画面</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          企画ごとのLPを <span className="text-indigo-300">/{`{code}`}</span>{" "}
          で表示
        </h1>
        <p className="max-w-2xl text-slate-300">
          例: <span className="font-mono">/ABC001</span>
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold">管理画面</h2>
          <p className="mt-2 text-sm text-slate-300">
            企画一覧・新規登録ができます。
          </p>
          <div className="mt-4">
            <Link
              className="inline-flex items-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
              href="/admin/login"
            >
              ログインへ
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold">LP</h2>
          <p className="mt-2 text-sm text-slate-300">
            企画コードのサブディレクトリで表示します。
          </p>
          <div className="mt-4 text-sm text-slate-300">
            先に管理画面から企画を登録してください。
          </div>
        </div>
      </section>
    </main>
    </div>
  );
}

