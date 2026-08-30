import React, { useState } from 'react';
import { colors, spacing, typography, radii, shadows } from '../../design-tokens';
import { 
  ChevronDown, 
  ChevronRight, 
  Lightbulb, 
  Info, 
  Zap,
  HelpCircle,
  X
} from 'lucide-react';

// RightSidebar wrapper — DaVinci Inspector panel
export interface RightSidebarProps {
  children: React.ReactNode;
  title?: string;
  onToggle?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  children,
  title = 'Inspector',
  onToggle,
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header — thin DaVinci style */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${spacing.md}`,
        borderBottom: `1px solid ${colors.border.default}`,
        height: '36px',
        boxSizing: 'border-box',
        background: colors.bg.toolbar,
      }}>
        <span style={{
          fontWeight: typography.fontWeight.bold,
          fontSize: typography.fontSize.tiny,
          color: colors.text.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
        }}>
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <button
            onClick={() => {
              console.log('Open vibyAI');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `1px ${spacing.sm}`,
              background: colors.brand.primary,
              border: 'none',
              borderRadius: radii.sm,
              cursor: 'pointer',
              color: colors.text.inverse,
              fontSize: '9px',
              fontWeight: typography.fontWeight.bold,
              letterSpacing: '0.3px',
              height: '20px',
            }}
          >
            <span style={{ fontSize: '10px' }}>✨</span>
            vibyAI
          </button>
          {onToggle && (
            <button
              onClick={onToggle}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: colors.text.muted,
                padding: '2px',
                borderRadius: radii.sm,
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: spacing.sm,
      }}>
        {children}
      </div>
    </div>
  );
};

// Collapsible Section — DaVinci style
export interface RightSidebarSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}

export const RightSidebarSection: React.FC<RightSidebarSectionProps> = ({
  title,
  icon,
  defaultOpen = true,
  children,
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: spacing.sm }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          width: '100%',
          padding: `3px ${spacing.md}`,
          background: colors.bg.elevated,
          border: `1px solid ${colors.border.default}`,
          borderRadius: radii.sm,
          cursor: 'pointer',
          textAlign: 'left',
          height: '24px',
          boxSizing: 'border-box',
        }}
      >
        {icon && (
          <span style={{ color: colors.brand.primary, flexShrink: 0, fontSize: '10px' }}>
            {icon}
          </span>
        )}
        <span style={{
          flex: 1,
          fontSize: typography.fontSize.tiny,
          fontWeight: typography.fontWeight.semiBold,
          color: colors.text.primary,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {title}
        </span>
        {badge && (
          <span style={{
            padding: `1px ${spacing.sm}`,
            background: colors.brand.muted,
            color: colors.brand.primary,
            borderRadius: radii.sm,
            fontSize: '8px',
            fontWeight: typography.fontWeight.semiBold,
          }}>
            {badge}
          </span>
        )}
        <span style={{ color: colors.text.muted, flexShrink: 0, fontSize: '10px' }}>
          {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
      </button>
      
      {isOpen && (
        <div style={{
          padding: spacing.sm,
          marginTop: spacing.xs,
          background: colors.bg.primary,
          borderRadius: radii.sm,
          border: `1px solid ${colors.border.default}`,
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

// Tip Card — compact DaVinci style
export interface TipCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: 'info' | 'tip' | 'warning' | 'success';
}

export const TipCard: React.FC<TipCardProps> = ({
  title,
  description,
  icon,
  variant = 'info',
}) => {
  const variantStyles = {
    info: { bg: colors.info + '10', border: colors.info, icon: <Info size={12} /> },
    tip: { bg: colors.brand.muted, border: colors.brand.primary, icon: <Lightbulb size={12} /> },
    warning: { bg: colors.warning + '10', border: colors.warning, icon: <HelpCircle size={12} /> },
    success: { bg: colors.success + '10', border: colors.success, icon: <Zap size={12} /> },
  };

  const style = variantStyles[variant];

  return (
    <div style={{
      padding: spacing.sm,
      background: style.bg,
      border: `1px solid ${style.border}30`,
      borderRadius: radii.sm,
      marginBottom: spacing.xs,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
      }}>
        <span style={{ color: style.border, fontSize: '10px' }}>
          {icon || style.icon}
        </span>
        <span style={{
          fontSize: typography.fontSize.tiny,
          fontWeight: typography.fontWeight.semiBold,
          color: colors.text.primary,
        }}>
          {title}
        </span>
      </div>
      <p style={{
        margin: 0,
        fontSize: '10px',
        color: colors.text.secondary,
        lineHeight: 1.4,
      }}>
        {description}
      </p>
    </div>
  );
};

// Keyboard Shortcut — compact
export interface KeyboardShortcutProps {
  keys: string[];
  description: string;
}

export const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({
  keys,
  description,
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `2px 0`,
    }}>
      <span style={{
        fontSize: '10px',
        color: colors.text.secondary,
      }}>
        {description}
      </span>
      <div style={{ display: 'flex', gap: '2px' }}>
        {keys.map((key, i) => (
          <kbd
            key={i}
            style={{
              padding: `1px ${spacing.sm}`,
              background: colors.bg.elevated,
              border: `1px solid ${colors.border.default}`,
              borderRadius: radii.sm,
              fontFamily: typography.fontFamily.mono,
              fontSize: '9px',
              color: colors.text.muted,
            }}
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
};

// Stat Item — compact
export interface StatItemProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export const StatItem: React.FC<StatItemProps> = ({
  label,
  value,
  icon,
  color = colors.text.primary,
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `3px 0`,
      borderBottom: `1px solid ${colors.border.default}`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
      }}>
        {icon && (
          <span style={{ color: colors.text.muted, fontSize: '10px' }}>
            {icon}
          </span>
        )}
        <span style={{
          fontSize: '10px',
          color: colors.text.secondary,
        }}>
          {label}
        </span>
      </div>
      <span style={{
        fontSize: typography.fontSize.body,
        fontWeight: typography.fontWeight.semiBold,
        color,
      }}>
        {value}
      </span>
    </div>
  );
};

// Quick Action — compact DaVinci button
export interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  badge?: string;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  label,
  icon,
  onClick,
  badge,
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        width: '100%',
        padding: `3px ${spacing.md}`,
        background: 'transparent',
        border: `1px solid ${colors.border.default}`,
        borderRadius: radii.sm,
        cursor: 'pointer',
        textAlign: 'left',
        marginBottom: '2px',
        height: '24px',
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = colors.bg.hover;
        e.currentTarget.style.borderColor = colors.border.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = colors.border.default;
      }}
    >
      <span style={{ color: colors.brand.primary, fontSize: '10px' }}>
        {icon}
      </span>
      <span style={{
        flex: 1,
        fontSize: '10px',
        color: colors.text.primary,
      }}>
        {label}
      </span>
      {badge && (
        <span style={{
          padding: `1px ${spacing.sm}`,
          background: colors.brand.muted,
          color: colors.brand.primary,
          borderRadius: radii.sm,
          fontSize: '8px',
          fontWeight: typography.fontWeight.semiBold,
        }}>
          {badge}
        </span>
      )}
    </button>
  );
};

// vibyAI Chat Panel — compact DaVinci style
export interface VibyAIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VibyAIChat: React.FC<VibyAIChatProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([
    { role: 'ai', content: '👋 Hi! I\'m vibyAI, your personal AI assistant. I can help you with:\n\n• Project organization\n• Audio file management\n• DAW integration tips\n• Sound design advice\n• And much more!\n\nHow can I help you today?' }
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setMessage('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'I understand you\'re asking about: "' + message + '". Let me help you with that!\n\nThis is a demo response. In production, I would connect to the vibyAI API to provide intelligent assistance.'
      }]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: spacing.xl,
      right: spacing.xl,
      width: '340px',
      height: '460px',
      background: colors.bg.surface,
      border: `1px solid ${colors.border.default}`,
      borderRadius: radii.md,
      boxShadow: shadows.panel,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: `4px ${spacing.md}`,
        borderBottom: `1px solid ${colors.border.default}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: colors.bg.toolbar,
        height: '32px',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ fontSize: '10px' }}>✨</span>
          <div>
            <div style={{ fontSize: '10px', fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
              vibyAI
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: colors.text.muted,
            padding: '2px',
          }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: spacing.sm,
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: spacing.sm,
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: `3px ${spacing.md}`,
              borderRadius: msg.role === 'user' ? '6px 6px 2px 6px' : '6px 6px 6px 2px',
              background: msg.role === 'user' ? colors.brand.primary : colors.bg.elevated,
              color: msg.role === 'user' ? colors.text.inverse : colors.text.primary,
              fontSize: '10px',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: spacing.sm,
        borderTop: `1px solid ${colors.border.default}`,
        display: 'flex',
        gap: spacing.sm,
      }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask vibyAI anything..."
          style={{
            flex: 1,
            padding: `3px ${spacing.md}`,
            background: colors.bg.primary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radii.sm,
            color: colors.text.primary,
            fontSize: '10px',
            outline: 'none',
            height: '24px',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: `3px ${spacing.md}`,
            background: colors.brand.primary,
            border: 'none',
            borderRadius: radii.sm,
            cursor: 'pointer',
            color: colors.text.inverse,
            fontSize: '10px',
            fontWeight: typography.fontWeight.semiBold,
            height: '24px',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default RightSidebar;
