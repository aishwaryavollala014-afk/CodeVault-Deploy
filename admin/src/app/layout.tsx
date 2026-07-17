import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CodeVault Admin",
  description: "Owner-only admin console.",
};

const nav: [string, string][] = [
  ["/", "📊 Overview"],
  ["/users", "👥 Users"],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#faf7f2", color: "#1a160f" }}>
        <header style={{ background: "#1a160f", color: "#fff", padding: "10px 18px", fontSize: 13, fontWeight: 700 }}>
          🔐 CodeVault Admin <span style={{ fontWeight: 500, opacity: 0.7 }}>· owners only · standalone (:3100)</span>
        </header>
        <div style={{ display: "flex", minHeight: "calc(100vh - 40px)" }}>
          <nav style={{ width: 200, padding: 18, borderRight: "1px solid #ecece4", fontSize: 13 }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
              {nav.map(([href, label]) => (
                <li key={href}>
                  <a href={href} style={{ display: "block", padding: "8px 10px", borderRadius: 9, color: "#3a352c", textDecoration: "none" }}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <main style={{ flex: 1, padding: 28 }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
