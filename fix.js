const fs = require("fs");
let content = fs.readFileSync("web-frontend/src/app/page.tsx", "utf-8");
content = content.replace(/''/g, "\"");
fs.writeFileSync("web-frontend/src/app/page.tsx", content);

