import { useEffect, useState, useCallback } from "react";

/* ── Shortcut definitions ─────────────────────────────────────────────────── */

export interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string; action: () => void }[];
}

export function useKeyboardShortcuts(groups: ShortcutGroup[]) {
  const [helpOpen, setHelpOpen] = useState(false);

  // Flatten all shortcuts for lookup
  const allShortcuts = groups.flatMap((g) => g.shortcuts);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs/textareas/selects
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement).isContentEditable) return;

      // ? — toggle help
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setHelpOpen((o) => !o);
        return;
      }

      // Escape — close help
      if (e.key === "Escape" && helpOpen) {
        e.preventDefault();
        setHelpOpen(false);
        return;
      }

      // Build the pressed key string
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
      if (e.shiftKey) parts.push("Shift");
      if (e.altKey) parts.push("Alt");
      // Don't include modifier keys themselves
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
      parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
      const pressed = parts.join("+");

      // Single-key shortcuts (no modifiers)
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        // Check for "g then key" sequence — handled separately via pending state
        return;
      }

      // Match against registered shortcuts
      const match = allShortcuts.find((s) => s.keys === pressed);
      if (match) {
        e.preventDefault();
        match.action();
        setHelpOpen(false);
      }
    },
    [allShortcuts, helpOpen]
  );

  // "g + key" two-key navigation (GitHub-style)
  const [pendingG, setPendingG] = useState(false);

  useEffect(() => {
    if (!pendingG) return;
    const timer = setTimeout(() => setPendingG(false), 1000);
    return () => clearTimeout(timer);
  }, [pendingG]);

  useEffect(() => {
    const handleGlobal = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement).isContentEditable) return;

      // "g" pressed alone → enter pending state
      if (e.key === "g" && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        if (!pendingG) {
          setPendingG(true);
          e.preventDefault();
        }
        return;
      }

      // If pending g, check for the second key
      if (pendingG && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        const gShortcuts = groups
          .find((g) => g.title === "Navigation")
          ?.shortcuts.filter((s) => s.keys.startsWith("g "))
          .map((s) => ({ key: s.keys.split(" ")[1], action: s.action }));

        const match = gShortcuts?.find((s) => s.key === e.key);
        if (match) {
          e.preventDefault();
          setPendingG(false);
          match.action();
        } else {
          setPendingG(false);
        }
      }
    };

    document.addEventListener("keydown", handleGlobal);
    return () => document.removeEventListener("keydown", handleGlobal);
  }, [pendingG, groups]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { helpOpen, setHelpOpen, pendingG };
}

/* ── Helper: format key display ───────────────────────────────────────────── */

export function formatKeys(keys: string): string {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return keys
    .replace("Ctrl", isMac ? "⌘" : "Ctrl")
    .replace("Shift", isMac ? "⇧" : "Shift")
    .replace("Alt", isMac ? "⌥" : "Alt")
    .split("+")
    .map((k) => k.trim())
    .join(isMac ? "" : "+");
}
