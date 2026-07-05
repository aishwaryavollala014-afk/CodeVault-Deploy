/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GIT_SERVICE_URL?: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
