/** Whether a keyboard event's target is somewhere text entry is expected --
 * used to suppress bare-key shortcuts (both the app-wide ones in
 * useGlobalShortcuts and panel-local ones like VolumeDetailPanel's "e" for
 * Edit) so typing a letter into a field never doubles as firing one. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}
