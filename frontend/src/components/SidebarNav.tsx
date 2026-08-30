import { useState, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  Home,
  Folder,
  Users,
  Settings,
  Code,
  Briefcase,
  Music,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Zap,
  RotateCcw,
  FlaskConical,
  LayoutGrid,
  CheckSquare,
  GitPullRequest,
  Flag,
  Target,
  MessageCircle,
  Workflow,
  Tag,
  Package,
  AlertTriangle,
  ToggleLeft,
  Clock,
  BarChart2,
  Activity,
} from "lucide-react";
import {
  useKeyboardShortcuts,
  type ShortcutGroup,
} from "../hooks/useKeyboardShortcuts";
import ShortcutHelp from "./ShortcutHelp";

interface SidebarNavProps {
  collapsed: boolean;
}

interface MainItem {
  label: string;
  icon: typeof Home;
  href: string;
  shortcut?: string;
}

const mainItems: MainItem[] = [
  { label: "Dashboard", icon: Home, href: "/dashboard", shortcut: "g d" },
  { label: "Projects", icon: Folder, href: "/projects", shortcut: "g p" },
  { label: "Starred", icon: MessageSquare, href: "/starred", shortcut: "g s" },
  { label: "Team", icon: Users, href: "/team", shortcut: "g t" },
  { label: "Billing", icon: Briefcase, href: "/billing", shortcut: "g b" },
  { label: "Integrations", icon: Code, href: "/integrations", shortcut: "g i" },
  { label: "Marketplace", icon: Music, href: "/marketplace", shortcut: "g m" },
  { label: "Explore", icon: Search, href: "/explore", shortcut: "g e" },
  { label: "Settings", icon: Settings, href: "/settings", shortcut: "Ctrl+," },
];

interface FeatureItem {
  key: string;
  label: string;
  icon: typeof Home;
  shortcut?: string;
}

const featureItems: FeatureItem[] = [
  { key: "wiki", label: "Wiki", icon: BookOpen, shortcut: "Ctrl+1" },
  { key: "sprints", label: "Sprints", icon: Zap, shortcut: "Ctrl+2" },
  { key: "retros", label: "Retros", icon: RotateCcw, shortcut: "Ctrl+3" },
  { key: "tests", label: "Test Plans", icon: FlaskConical, shortcut: "Ctrl+4" },
  { key: "kanban", label: "Kanban", icon: LayoutGrid, shortcut: "Ctrl+5" },
  { key: "tasks", label: "Tasks", icon: CheckSquare, shortcut: "Ctrl+6" },
  { key: "prs", label: "Pull Requests", icon: GitPullRequest, shortcut: "Ctrl+7" },
  { key: "milestones", label: "Milestones", icon: Flag, shortcut: "Ctrl+8" },
  { key: "epics", label: "Epics", icon: Target, shortcut: "Ctrl+9" },
  { key: "discussions", label: "Discussions", icon: MessageCircle },
  { key: "workflows", label: "Workflows", icon: Workflow },
  { key: "tags", label: "Tags", icon: Tag },
  { key: "artifacts", label: "Artifacts", icon: Package },
  { key: "incidents", label: "Incidents", icon: AlertTriangle },
  { key: "flags", label: "Feature Flags", icon: ToggleLeft },
  { key: "time", label: "Time Track", icon: Clock },
  { key: "okrs", label: "OKRs", icon: BarChart2 },
  { key: "status", label: "Status Page", icon: Activity },
];

export const SidebarNav = ({ collapsed }: SidebarNavProps) => {
  const location = useLocation();
  const pathname = location.pathname;
  const params = useParams();

  const projectMatch = pathname.match(/^\/projects\/(\d+)/);
  const projectId = projectMatch?.[1] ?? params.id;

  const urlParams = new URLSearchParams(location.search);
  const activeFeatureKey = urlParams.get("tab");

  const [featuresOpen, setFeaturesOpen] = useState(() => {
    return pathname.includes("/features");
  });

  const shortcutGroups: ShortcutGroup[] = useMemo(() => {
    const navShortcuts = mainItems
      .filter((item) => item.shortcut)
      .map((item) => ({
        keys: item.shortcut!,
        description: item.label,
        action: () => {
          window.location.href = item.href;
        },
      }));

    const featureShortcuts = projectId
      ? featureItems
          .filter((item) => item.shortcut)
          .map((item) => ({
            keys: item.shortcut!,
            description: item.label,
            action: () => {
              window.location.href = `/projects/${projectId}/features?tab=${item.key}`;
            },
          }))
      : [];

    const featureToggle = projectId
      ? [
          {
            keys: "Shift+F",
            description: "Toggle Features panel",
            action: () => setFeaturesOpen((o) => !o),
          },
        ]
      : [];

    const groups: ShortcutGroup[] = [
      { title: "Navigation", shortcuts: navShortcuts },
    ];

    if (featureShortcuts.length > 0) {
      groups.push({
        title: "Features (Project)",
        shortcuts: [...featureShortcuts, ...featureToggle],
      });
    }

    return groups;
  }, [projectId]);

  const { helpOpen, setHelpOpen, pendingG } = useKeyboardShortcuts(shortcutGroups);

  return (
    <>
      <ul className="sidebar-nav" style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}>
        {pendingG && (
          <li className="sidebar-nav-pending-g" style={{
            padding: '2px 8px',
            marginBottom: '2px',
          }}>
            <span className="sidebar-nav-pending-label" style={{
              fontSize: '9px',
              fontWeight: 700,
              color: '#E85D2A',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>g</span>
          </li>
        )}

        {mainItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li
              key={item.href}
              className={`sidebar-nav-item ${isActive ? "sidebar-nav-item-active" : ""}`}
              style={{
                marginBottom: '1px',
              }}
            >
              <a
                href={item.href}
                className="sidebar-nav-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: collapsed ? '4px' : '4px 8px',
                  borderRadius: '3px',
                  textDecoration: 'none',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: isActive ? '#E0E0E0' : '#9E9E9E',
                  background: isActive ? '#383838' : 'transparent',
                  transition: 'all 0.1s ease',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#383838';
                    e.currentTarget.style.color = '#E0E0E0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9E9E9E';
                  }
                }}
              >
                <div className="sidebar-nav-icon" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '14px',
                  height: '14px',
                  flexShrink: 0,
                }}>
                  <item.icon className="sidebar-nav-icon-img" size={14} />
                </div>
                {!collapsed && (
                  <>
                    <span className="sidebar-nav-label">{item.label}</span>
                    {item.shortcut && (
                      <span className="sidebar-nav-shortcut-hint" style={{
                        marginLeft: 'auto',
                        fontSize: '8px',
                        color: '#616161',
                        fontFamily: '"JetBrains Mono", monospace',
                      }}>
                        {item.shortcut.replace("Ctrl", "⌘").replace("g ", "")}
                      </span>
                    )}
                  </>
                )}
              </a>
            </li>
          );
        })}

        {projectId && !collapsed && <li className="sidebar-nav-divider" style={{
          height: '1px',
          background: '#333333',
          margin: '4px 8px',
        }} />}

        {projectId && (
          <li className="sidebar-nav-item sidebar-nav-features-section">
            <button
              className="sidebar-nav-link sidebar-nav-features-toggle"
              onClick={() => setFeaturesOpen((o) => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
                padding: '4px 8px',
                background: 'transparent',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '9px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#616161',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <div className="sidebar-nav-icon" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '14px',
                height: '14px',
                flexShrink: 0,
              }}>
                {featuresOpen ? (
                  <ChevronDown className="sidebar-nav-icon-img" size={12} />
                ) : (
                  <ChevronRight className="sidebar-nav-icon-img" size={12} />
                )}
              </div>
              {!collapsed && (
                <span className="sidebar-nav-label sidebar-nav-section-label">
                  Features
                </span>
              )}
            </button>

            {featuresOpen &&
              featureItems.map((item) => {
                const href = `/projects/${projectId}/features?tab=${item.key}`;
                const isActive =
                  pathname.includes("/features") && activeFeatureKey === item.key;
                return (
                  <li
                    key={item.key}
                    className={`sidebar-nav-item sidebar-nav-feature-item ${isActive ? "sidebar-nav-item-active" : ""}`}
                    style={{
                      marginBottom: '1px',
                    }}
                  >
                    <a
                      href={href}
                      className="sidebar-nav-link sidebar-nav-feature-link"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px 3px 20px',
                        borderRadius: '3px',
                        textDecoration: 'none',
                        fontSize: '10px',
                        fontWeight: 400,
                        color: isActive ? '#E0E0E0' : '#9E9E9E',
                        background: isActive ? '#383838' : 'transparent',
                        transition: 'all 0.1s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = '#383838';
                          e.currentTarget.style.color = '#E0E0E0';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#9E9E9E';
                        }
                      }}
                    >
                      <div className="sidebar-nav-icon sidebar-nav-feature-icon" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '12px',
                        height: '12px',
                        flexShrink: 0,
                      }}>
                        <item.icon className="sidebar-nav-icon-img" size={12} />
                      </div>
                      {!collapsed && (
                        <>
                          <span className="sidebar-nav-label sidebar-nav-feature-label">
                            {item.label}
                          </span>
                          {item.shortcut && (
                            <span className="sidebar-nav-shortcut-hint sidebar-nav-shortcut-hint-sm" style={{
                              marginLeft: 'auto',
                              fontSize: '7px',
                              color: '#616161',
                              fontFamily: '"JetBrains Mono", monospace',
                            }}>
                              {item.shortcut.replace("Ctrl", "⌘")}
                            </span>
                          )}
                        </>
                      )}
                    </a>
                  </li>
                );
              })}
          </li>
        )}

        <li className="sidebar-nav-item sidebar-nav-help" style={{
          marginTop: 'auto',
        }}>
          <button
            className="sidebar-nav-link"
            onClick={() => setHelpOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              width: '100%',
              padding: collapsed ? '4px' : '4px 8px',
              background: 'transparent',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '10px',
              color: '#616161',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
          >
            <div className="sidebar-nav-icon" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '14px',
              height: '14px',
              flexShrink: 0,
            }}>
              <span className="sidebar-nav-shortcut-icon" style={{ fontSize: '12px' }}>⌨</span>
            </div>
            {!collapsed && (
              <span className="sidebar-nav-label sidebar-nav-help-label">
                Shortcuts
                <span className="sidebar-nav-shortcut-hint" style={{
                  marginLeft: '4px',
                  fontSize: '8px',
                  color: '#616161',
                }}>?</span>
              </span>
            )}
          </button>
        </li>
      </ul>

      {helpOpen && (
        <ShortcutHelp
          groups={shortcutGroups}
          onClose={() => setHelpOpen(false)}
        />
      )}
    </>
  );
};
