import type { OwnershipStatus } from "../types";

export interface OwnershipMeta {
  label: string;
  /** Badge icon color -- independent of the line color */
  iconHex: string;
}

export const OWNERSHIP_META: Record<OwnershipStatus, OwnershipMeta> = {
  announced: { label: "Announced", iconHex: "#E4B94E" }, // gold bell
  shelved: { label: "Shelved", iconHex: "#4ADE80" }, // green check
  ordered: { label: "Ordered", iconHex: "#38BDF8" }, // blue bag
  out_of_print: { label: "Out of Print", iconHex: "#F87171" }, // red !
  alt_format: { label: "Alt Format", iconHex: "#C084FC" }, // purple mark
};

export const OWNERSHIP_ORDER: OwnershipStatus[] = [
  "announced",
  "ordered",
  "shelved",
  "out_of_print",
  "alt_format",
];
