const fs = require("fs");
let html = fs.readFileSync("frontendHtml/login.html", "utf-8");

// Extract CSS
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
  let css = styleMatch[1];
  // Remove :root
  css = css.replace(/:root\s*{[\s\S]*?}/, "");
  fs.appendFileSync("web-frontend/src/app/globals.css", "\n/* Legacy Prototype CSS - Login */\n" + css);
}

// Extract Body
const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
let body = bodyMatch ? bodyMatch[1] : "";

// Convert to JSX
body = body.replace(/class=/g, "className=");
body = body.replace(/<!--[\s\S]*?-->/g, ""); // Remove comments
body = body.replace(/<br>/g, "<br/>"); // Self close br
body = body.replace(/<script>[\s\S]*?<\/script>/, ""); // Remove script tag

const pageTsx = `export default function Login() {
  return (
    <>
${body}
    </>
  );
}
`;

fs.mkdirSync("web-frontend/src/app/login", { recursive: true });
fs.writeFileSync("web-frontend/src/app/login/page.tsx", pageTsx);
console.log("Login Conversion complete.");

