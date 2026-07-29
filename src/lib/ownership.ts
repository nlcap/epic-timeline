import type { OwnershipStatus } from "../types";
import announcedIcon from "../assets/announced.svg";
import orderedIcon from "../assets/ordered.svg";
import shelvedIcon from "../assets/shelved.svg";
import outOfPrintIcon from "../assets/out of print.svg";
import altFormatIcon from "../assets/Alt Format.svg";

export interface OwnershipMeta {
  label: string;
  /** Status icon -- independent of the line color */
  iconUrl: string;
}

export const OWNERSHIP_META: Record<OwnershipStatus, OwnershipMeta> = {
  announced: { label: "Announced", iconUrl: announcedIcon },
  shelved: { label: "Shelved", iconUrl: shelvedIcon },
  ordered: { label: "Ordered", iconUrl: orderedIcon },
  out_of_print: { label: "Out of Print", iconUrl: outOfPrintIcon },
  alt_format: { label: "Alt Format", iconUrl: altFormatIcon },
};

export const OWNERSHIP_ORDER: OwnershipStatus[] = [
  "announced",
  "ordered",
  "shelved",
  "out_of_print",
  "alt_format",
];
