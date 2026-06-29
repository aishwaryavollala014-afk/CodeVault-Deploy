const fs = require("fs");
let html = fs.readFileSync("frontendHtml/landing.html", "utf-8");

// Extract CSS
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
  let css = styleMatch[1];
  // Remove :root because we already did that
  css = css.replace(/:root\s*{[\s\S]*?}/, "");
  fs.appendFileSync("web-frontend/src/app/globals.css", "\n/* Legacy Prototype CSS */\n" + css);
}

// Extract Body
const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
let body = bodyMatch ? bodyMatch[1] : "";

// Convert to JSX
body = body.replace(/class=/g, "className=");
body = body.replace(/<!--[\s\S]*?-->/g, ""); // Remove comments
body = body.replace(/<br>/g, "<br/>"); // Self close br
body = body.replace(/style="margin-top:16px"/g, "style={{ marginTop: '16px' }}");
body = body.replace(/style="flex-direction:column;gap:8px"/g, "style={{ flexDirection: 'column', gap: '8px' }}");
body = body.replace(/style="width:([0-9]+%)"/g, "style={{ width: '$1' }}");
body = body.replace(/style="background:var\(--subtle\);border-top:1px solid var\(--border\);border-bottom:1px solid var\(--border\)"/g, "style={{ background: 'var(--subtle)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}");
body = body.replace(/style="margin-top:18px;font-size:14px"/g, "style={{ marginTop: '18px', fontSize: '14px' }}");
body = body.replace(/style="background:(#[a-f0-9]+)"/g, "style={{ background: '$1' }}");
body = body.replace(/style="background:#efe7df"/g, "style={{ background: '#efe7df' }}");
body = body.replace(/style="background:#fbd6c6"/g, "style={{ background: '#fbd6c6' }}");
body = body.replace(/style="background:#f5a888"/g, "style={{ background: '#f5a888' }}");
body = body.replace(/style="background:#f0764f"/g, "style={{ background: '#f0764f' }}");
body = body.replace(/style="background:#d8431f"/g, "style={{ background: '#d8431f' }}");

// Handle any remaining style=""
// Note: If any remain, React will throw. We will check it later.

const pageTsx = `export default function Home() {
  return (
    <>
${body}
    </>
  );
}
`;

fs.writeFileSync("web-frontend/src/app/page.tsx", pageTsx);
console.log("Conversion complete.");

