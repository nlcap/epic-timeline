/// <reference types="vite/client" />

// No app-specific `VITE_*` vars today -- vite/client above already declares
// ImportMetaEnv/ImportMeta, so redeclaring an empty pair here would add
// nothing. Add an `interface ImportMetaEnv` block back if one is ever
// introduced.

// See the collectionUpdatedAt plugin in vite.config.ts -- this virtual
// module's content is computed there from `git log`, not written by hand.
declare module "virtual:collection-updated-at" {
  export const COLLECTION_DATA_UPDATED_AT: Record<string, string | null>;
}
