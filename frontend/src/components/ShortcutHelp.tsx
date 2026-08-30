import { formatKeys, type ShortcutGroup } from "../hooks/useKeyboardShortcuts";

interface ShortcutHelpProps {
  groups: ShortcutGroup[];
  onClose: () => void;
}

export default function ShortcutHelp({ groups, onClose }: ShortcutHelpProps) {
  return (
    <div className="shortcut-help-overlay" onClick={onClose}>
      <div className="shortcut-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcut-help-header">
          <h3 className="shortcut-help-title">⌨ Keyboard Shortcuts</h3>
          <button className="shortcut-help-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="shortcut-help-body">
          {groups.map((group) => (
            <div key={group.title} className="shortcut-help-group">
              <div className="shortcut-help-group-title">{group.title}</div>
              <div className="shortcut-help-list">
                {group.shortcuts.map((s) => (
                  <div key={s.keys} className="shortcut-help-row">
                    <div className="shortcut-help-keys">
                      {formatKeys(s.keys)
                        .split(/(?=[⌘⇧⌥+]|(?<=[⌘⇧⌥+]))/)
                        .filter(Boolean)
                        .map((part, i) => (
                          <kbd key={i} className="shortcut-help-kbd">
                            {part}
                          </kbd>
                        ))}
                    </div>
                    <div className="shortcut-help-desc">{s.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcut-help-footer">
          Press <kbd className="shortcut-help-kbd">?</kbd> to toggle this panel
        </div>
      </div>
    </div>
  );
}
