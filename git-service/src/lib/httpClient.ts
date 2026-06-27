import axios from 'axios';
import { egressInterceptor } from './egress';

/** Generic axios instance for platform calls (GitHub uses its own — lib/github.ts). */
export const httpClient = axios.create({
  timeout: 20_000,
  headers: { 'User-Agent': 'CodeVault' },
});

// Enforce the SSRF egress allowlist on every outbound platform request.
httpClient.interceptors.request.use(egressInterceptor);
