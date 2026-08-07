/**
 * When each collection's seed data file was last substantively changed,
 * shown in the "Reset line data" modal so a user considering a reset knows
 * how fresh the default data they'd fall back to is. Computed from git
 * history at build/dev-server-start time -- see the collectionUpdatedAt
 * plugin in vite.config.ts for how, and its own comment for the GitHub
 * Actions checkout depth this depends on.
 */
export { COLLECTION_DATA_UPDATED_AT } from "virtual:collection-updated-at";
