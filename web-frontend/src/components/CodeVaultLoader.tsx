"use client";

// Branded full-area loading state: a spinning coral/gold/rose gradient ring
// around the breathing CodeVault icon. Used wherever data is loading.
export function CodeVaultLoader({ text = "Loading" }: { text?: string }) {
  return (
    <div className="cv-loader-wrap">
      <div className="cv-loader">
        <div className="cv-ring" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/codevault-icon.png" alt="CodeVault" className="cv-mark-img" />
      </div>
      <div className="cv-loader-text">
        {text}
        <span className="cv-dots" />
      </div>

      <style>{`
        .cv-loader-wrap {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 70vh; gap: 22px;
        }
        .cv-loader { position: relative; width: 92px; height: 92px; display: grid; place-items: center; }
        .cv-ring {
          position: absolute; inset: 0; border-radius: 24px; padding: 3px;
          background: conic-gradient(from 0deg, #f1543f, #e8a200, #e0457b, #f1543f);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          animation: cv-spin 1.1s linear infinite;
        }
        .cv-mark-img {
          width: 60px; height: 60px; border-radius: 16px; background: #fff; padding: 9px;
          object-fit: contain; box-shadow: 0 10px 28px rgba(241,84,63,.28);
          animation: cv-breathe 1.6s ease-in-out infinite;
        }
        .cv-loader-text { color: var(--muted); font-size: 14px; font-weight: 600; letter-spacing: .01em; }
        .cv-dots::after { content: ''; animation: cv-dots 1.4s steps(4, end) infinite; }
        @keyframes cv-spin { to { transform: rotate(360deg); } }
        @keyframes cv-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes cv-dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } }
        @media (prefers-reduced-motion: reduce) {
          .cv-ring, .cv-mark-img, .cv-dots::after { animation: none; }
        }
      `}</style>
    </div>
  );
}
