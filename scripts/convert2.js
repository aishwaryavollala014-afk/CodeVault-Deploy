const fs = require("fs");
let content = fs.readFileSync("web-frontend/src/app/page.tsx", "utf-8");
content = content.replace(/<script>[\s\S]*?<\/script>/, "");
fs.writeFileSync("web-frontend/src/app/page.tsx", content);

