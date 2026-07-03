# ❓ CodeVault — Frequently Asked Questions (FAQ)

This document addresses common questions regarding CodeVault's architecture, authentication choices, account sync behavior, and database integration.

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 🔑 1. Authentication: Why is GitHub OAuth preferred over Email Login?

### **Q: Can we log in with Email?**
* **A:** Yes, email login is a valid use case for users who only want to aggregate and view performance stats (Path A) without syncing code files to GitHub.
* **However, GitHub login is preferred for the primary experience:** Because the core value proposition of CodeVault is pushing code solutions to a repository, **GitHub write permissions are required.** Signing in with GitHub accomplishes both authentication and repo permissions in a single click.

---

## 🔗 2. Platform Integration: Why do I need to connect platforms manually?

### **Q: If I sign in with an email, can CodeVault automatically find my LeetCode, Codeforces, CodeChef, and HackerRank accounts linked to that email?**
* **A: No. Every platform connection must be configured manually by the user.**
* **Why?**
  1. **Privacy Policies:** Competitive programming platforms (like LeetCode, Codeforces, etc.) do not expose public endpoints that allow searching for usernames via email address.
  2. **Session Cookies/Tokens:** Platforms like LeetCode require authentication (such as a session cookie or token) to access your accepted code submissions. CodeVault cannot fetch this automatically; you must log in once and connect your platform session securely.

---

## 🔄 3. Sync Process: How does code get to GitHub?

### **Q: When I solve a problem on LeetCode and click "Submit", does CodeVault instantly push the code to GitHub?**
* **A: No. The sync process is built on a "Pull" model, not an instant push model.**
* **How it works:**
  1. **No Instant Notifications:** LeetCode does not notify CodeVault when you submit a question (there are no outbound Webhooks from LeetCode to our backend).
  2. **Cron Scheduler:** CodeVault's `git-service` runs a background task scheduler. Every few hours, it checks your connected platforms, pulls your most recent accepted submissions, and filters out already-synced questions.
  3. **Batch Pushing:** The new submissions are bundled together and committed to your designated GitHub repository in a single batch to respect GitHub API rate limits.
  4. **Manual Sync:** If you don't want to wait for the automatic cron cycle, you can click the **"Run Sync Now"** button on the CodeVault dashboard to trigger the process instantly.

---

## 🛠️ 4. How Our Services Connect

### **Q: Do the web-backend and git-service talk to each other directly?**
* **A: No. They run as independent microservices and communicate via the shared Database and Redis Cache.**
  * **`web-backend`** handles user sessions, platform connections, and analytics stats.
  * **`git-service`** consumes those connection credentials to fetch submissions and push them to GitHub.
  * Isolation ensures that if the background sync worker experiences load or crashes, it never brings down the main user dashboard or API server.
