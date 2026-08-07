/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// See the collectionUpdatedAt plugin in vite.config.ts -- this virtual
// module's content is computed there from `git log`, not written by hand.
declare module "virtual:collection-updated-at" {
  export const COLLECTION_DATA_UPDATED_AT: Record<string, string | null>;
}
