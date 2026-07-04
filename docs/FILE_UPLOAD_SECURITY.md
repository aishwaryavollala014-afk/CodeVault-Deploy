# 📎 CodeVault — File Upload Security

> CodeVault's stance on file uploads and how to do them safely **if ever needed**. Companion to [SECURITY_PLAN](SECURITY_PLAN.md) (§9) and [ATTACK_PREVENTION](ATTACK_PREVENTION.md).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Purpose

Document the deliberate decision to **avoid user file uploads** (eliminating a whole attack class) and provide a hardened blueprint should a future feature require them.

---

## 2. Architecture (current: none)

```
Avatars  → use the GitHub avatar URL (no upload, no storage)
OG images → generated server-side / static, served via CDN (not user-uploaded)
Solutions → text only, written to GitHub by git-service (not uploaded by users)
```

CodeVault currently has **no user upload path**. The prototype's "change avatar" maps to "use GitHub avatar".

---

## 3. Best Practices (if uploads are added)

- Allowlist types by **content sniffing** (magic bytes), not extension/Content-Type.
- Strict **size limits**; reject archives by default (zip-bomb risk).
- **Re-encode** images to strip metadata/exploits; **reject SVG** (or sanitize aggressively).
- **Random filenames**; never use user-supplied paths (anti traversal).
- Store in **object storage off the app host**, private ACLs, serve via **signed URLs**.

---

## 4. Threats

Malware uploads · SVG-XSS · polyglot/image-based exploits · path traversal via filename · decompression (zip) bombs · content-type spoofing · storage abuse / cost DoS · serving user files inline (HTML/JS execution).

---

## 5. Prevention Techniques

| Threat | Control |
|--------|---------|
| Malware | ClamAV scan on ingest; quarantine on detection |
| SVG-XSS | reject SVG or sanitize; never serve inline |
| Image exploits | re-encode (sharp) to a safe format; strip EXIF |
| Path traversal | random UUID filenames; ignore client path |
| Zip bombs | reject archives; size + ratio limits |
| Type spoofing | sniff magic bytes; allowlist (png/jpg/webp) |
| Storage abuse | per-user quotas; size caps; TTL on temp |
| Inline execution | `Content-Disposition: attachment`; no inline HTML; separate domain |

---

## 6. Implementation Guidelines (future)

- Two-step: upload to a temp private bucket → scan + re-encode → promote to permanent.
- Validate on the **server**, never trust client checks.
- Serve only via short-lived **signed URLs** from a cookieless asset domain.

---

## 7. Folder Structure (future)

```
web-backend/src/services/upload/   # (only if built) validate, scan, re-encode, sign
```

---

## 8. Recommended Libraries (future)

`sharp` (re-encode/strip), `file-type` (magic-byte sniff), `clamscan` (ClamAV), `multer` with strict limits, S3/R2 SDK for object storage.

---

## 9. Configuration Examples (future)

```ts
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp']);
const type = await fileTypeFromBuffer(buf);          // sniff, not trust
if (!type || !ALLOWED.has(type.mime)) throw new ValidationError('unsupported type');
await sharp(buf).rotate().webp().toBuffer();          // re-encode, strip metadata
```

---

## 10. Production Considerations

- Keep "no uploads" as the default — it's the strongest control.
- If added: object storage with private ACLs + signed URLs + CDN; malware scanning; quotas.
- Log + alert on rejected/quarantined uploads.

---

## 11. Future Improvements

- Cloud-native malware scanning (e.g. provider AV).
- Image CDN with on-the-fly safe transforms.

---

## 12. Checklist

- [ ] No user uploads (current default) — avatar = GitHub URL
- [ ] (If added) magic-byte allowlist; size limits; reject SVG/archives
- [ ] Re-encode images; strip metadata; random filenames
- [ ] Object storage off-host; private ACLs; signed URLs; attachment disposition
- [ ] Malware scan + quarantine; per-user quotas
- [ ] Server-side validation only

---

## 13. References

- [SECURITY_PLAN.md](SECURITY_PLAN.md) §9 · [ATTACK_PREVENTION.md](ATTACK_PREVENTION.md) · [CLOUD_SECURITY.md](CLOUD_SECURITY.md)
- OWASP File Upload Cheat Sheet


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [ ] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [ ] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
