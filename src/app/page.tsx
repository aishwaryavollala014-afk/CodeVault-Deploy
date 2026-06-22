export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold">🗄️ CodeVault</h1>
      <p className="mt-3 text-lg text-gray-400">
        Your coding journey, unified and automated.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Solved" value="—" />
        <StatCard label="Platforms" value="—" />
        <StatCard label="Synced to GitHub" value="—" />
      </section>

      <section className="mt-10 rounded-lg border border-gray-800 bg-vault-panel p-6">
        <h2 className="text-xl font-semibold">Connected platforms</h2>
        <p className="mt-2 text-gray-400">
          Add a username to track stats, then connect once to auto-sync your
          solutions to GitHub.
        </p>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-vault-panel p-5">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
    </div>
  );
}
