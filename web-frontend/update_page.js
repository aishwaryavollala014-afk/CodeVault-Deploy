const fs = require('fs');
let pageContent = fs.readFileSync('C:\\Users\\aishw\\OneDrive\\Desktop\\CodeVault\\web-frontend\\src\\app\\page.tsx', 'utf8');

if (!pageContent.includes('import styles')) {
  pageContent = pageContent.replace('export default function Home() {', 'import styles from "./page.module.css";\n\nexport default function Home() {');
}

pageContent = pageContent.replace(/className=\"([^\"]+)\"/g, (match, classes) => {
  const classList = classes.split(' ');
  const styledClasses = classList.map(c => `styles['${c}']`).join(' + " " + ');
  return `className={${styledClasses}}`;
});

fs.writeFileSync('C:\\Users\\aishw\\OneDrive\\Desktop\\CodeVault\\web-frontend\\src\\app\\page.tsx', pageContent);
