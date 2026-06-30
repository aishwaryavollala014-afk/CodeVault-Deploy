const fs = require('fs');

const css = `@import "tailwindcss";

:root {
  --paper: #f8f6f1;
  --card: #fff;
  --ink: #1a160f;
  --ink-2: #3a352c;
  --muted: #6f6a5f;
  --faint: #7a7568;
  --border: #ece7dc;
  --border-2: #e2dccd;
  --brand: #f1543f;
  --brand-d: #d8431f;
  --brand-soft: #fdeae4;
  --amber: #e8a200;
  --amber-d: #b07c00;
  --amber-soft: #fbeec8;
  --rose: #e0457b;
  --rose-d: #c43368;
  --rose-soft: #fce3ee;
  --r: 14px;
  
  /* Aliases for Tailwind components */
  --bg: #ffffff;
  --subtle: var(--paper);
  --subtle-2: #efece3;
  --accent: var(--brand);
  --accent-2: var(--brand-d);
  --accent-soft: var(--brand-soft);
  --orange: var(--amber);
  --orange-soft: var(--amber-soft);
  --green: #1aa260;
  --green-soft: #e2f4eb;
  --red: var(--rose);
  --red-soft: var(--rose-soft);
}

@theme inline {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
}

body {
  background-color: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  line-height: 1.5;
}

/* Base resets */
*{box-sizing:border-box;margin:0;padding:0}
a{color:inherit;text-decoration:none}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:8px}

/* Button Reset used in multiple places */
.btn{display:inline-flex;align-items:center;gap:8px;font-family:inherit;font-weight:600;font-size:14.5px;border-radius:10px;border:1px solid transparent;cursor:pointer;padding:11px 18px;transition:.15s;white-space:nowrap}
.btn-primary{background:var(--accent);color:#fff;border-color:var(--accent)}
.btn-primary:hover{background:var(--accent-2)}
.btn-secondary{background:#fff;color:var(--ink);border-color:var(--border-2)}
.btn-secondary:hover{background:var(--subtle);border-color:#cfcfda}
.btn-ghost{background:transparent;color:var(--ink-2)}
.btn-ghost:hover{color:var(--ink)}

/* App Layout */
svg.ico{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}
svg.ico.sm{width:14px;height:14px}
.app{display:grid;grid-template-columns:236px 1fr;min-height:100vh}
.side{background:#fff;border-right:1px solid var(--border);padding:20px 16px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;width:236px}
.side .brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:16px;padding:6px 8px 18px}
.side .mark{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,var(--accent),var(--rose));color:#fff;display:grid;place-items:center;font-family:var(--mono);font-weight:800;font-size:14px}
.side .nav{display:flex;flex-direction:column;gap:3px;margin-top:8px}
.side .nav a{display:flex;align-items:center;gap:11px;padding:10px 11px;border-radius:9px;font-size:14px;color:var(--muted);font-weight:500;transition:.12s}
.side .nav a:hover{background:var(--subtle);color:var(--ink)}
.side .nav a.active{background:var(--accent-soft);color:var(--accent-2);font-weight:600}
.side-foot{margin-top:auto;border-top:1px solid var(--border);padding-top:14px;display:flex;align-items:center;gap:10px}
.side-foot .av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--orange),var(--accent));color:#fff;display:grid;place-items:center;font-weight:700;font-size:14px}
.side-foot .who{font-size:13px;line-height:1.3}
.side-foot .who b{display:block}
.side-foot .who span{color:var(--faint);font-size:11.5px}
.side-foot .out{margin-left:auto;color:var(--faint);cursor:pointer;background:none;border:0;padding:6px;border-radius:8px;display:grid;place-items:center}
.side-foot .out:hover{color:var(--rose);background:var(--red-soft)}
.main{display:flex;flex-direction:column;min-width:0}
.topbar{display:flex;align-items:center;gap:14px;padding:14px 28px;border-bottom:1px solid var(--border);background:rgba(248,246,241,.85);backdrop-filter:blur(8px);position:sticky;top:0;z-index:10}
.topbar h1{font-size:18px;letter-spacing:-.01em}
.search{margin-left:auto;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--border-2);border-radius:9px;padding:8px 12px;color:var(--faint);font-size:13px;width:230px}
.search input{border:0;outline:0;font-family:inherit;font-size:13px;width:100%;background:transparent;color:var(--ink)}
.ic-btn{width:36px;height:36px;border-radius:9px;border:1px solid var(--border-2);background:#fff;display:grid;place-items:center;cursor:pointer;color:var(--ink-2)}
.ic-btn:hover{background:var(--paper);color:var(--ink)}
.content{padding:24px 28px 60px;display:flex;flex-direction:column;gap:16px}
.menu-btn{display:none;width:38px;height:38px;border-radius:9px;border:1px solid var(--border-2);background:#fff;cursor:pointer;align-items:center;justify-content:center}
.menu-btn span{position:relative;display:block;width:16px;height:2px;background:var(--ink);border-radius:2px}
.spacer{margin-left:auto}

/* Login Page CSS - Preserved because login.tsx uses it */
.auth{display:grid;grid-template-columns:1.05fr .95fr;min-height:100vh}
.auth-panel{position:relative;background:linear-gradient(160deg,#b8331c 0%,#e0492a 48%,#f1543f 100%);color:#fff;padding:54px 56px;display:flex;flex-direction:column;overflow:hidden}
.auth-panel::after{content:"";position:absolute;right:-120px;bottom:-120px;width:360px;height:360px;border-radius:50%;background:rgba(232,162,0,.28)}
.auth-panel .glow2{content:"";position:absolute;left:-60px;bottom:120px;width:200px;height:200px;border-radius:50%;background:rgba(224,69,123,.30);z-index:1}
.auth-panel::before{content:"";position:absolute;left:-80px;top:-80px;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,.06)}
.auth-panel h1{font-size:34px;line-height:1.18;letter-spacing:-.02em;margin-top:auto;position:relative;z-index:2;max-width:420px}
.auth-panel p{color:rgba(255,255,255,.86);font-size:15.5px;line-height:1.6;margin-top:16px;max-width:400px;position:relative;z-index:2}
.form-side{display:flex;align-items:center;justify-content:center;padding:40px}
.form{width:100%;max-width:380px}
.m-brand{display:none;align-items:center;gap:10px;font-weight:700;font-size:17px;margin-bottom:22px}
.m-brand .mark{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff}
.form h2{font-size:26px;letter-spacing:-.02em;margin:16px 0 6px}
.form .sub{color:var(--muted);font-size:14.5px;margin-bottom:26px}
.gh{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:var(--ink);color:#fff;border:0;padding:14px;border-radius:11px;font-family:inherit;font-weight:600;font-size:15px;cursor:pointer;transition:.15s}
.gh:hover{background:#26261c}
.gh svg{width:18px;height:18px;fill:#fff}
.why{font-size:12.5px;color:var(--faint);text-align:center;margin-top:12px;line-height:1.5}
.divider{display:flex;align-items:center;gap:12px;color:var(--faint);font-size:12.5px;margin:22px 0}
.divider::before,.divider::after{content:"";flex:1;height:1px;background:var(--border-2)}
.field{margin-bottom:14px}
.field label{display:block;font-size:13px;font-weight:600;margin-bottom:7px;color:var(--ink-2)}
.field input{width:100%;padding:12px 14px;border:1px solid var(--border-2);border-radius:11px;font-family:inherit;font-size:14.5px;background:#fff;transition:.15s;color:var(--ink)}
.submit{width:100%;background:var(--accent);color:#fff;border:0;padding:13px;border-radius:11px;font-family:inherit;font-weight:700;font-size:15px;cursor:pointer;transition:.15s}
.submit:hover{background:var(--accent-2)}
.nopass{font-size:12.5px;color:var(--faint);text-align:center;margin-top:12px}
.alt{text-align:center;margin-top:24px;font-size:14px;color:var(--muted)}
.alt a{color:var(--accent-2);font-weight:600}
`;

fs.writeFileSync('C:\\Users\\aishw\\OneDrive\\Desktop\\CodeVault\\web-frontend\\src\\app\\globals.css', css);
