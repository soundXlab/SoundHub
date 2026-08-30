import React, { useEffect, useState, type FormEvent } from 'react';
import { FullPageLayout } from '../components/FullPageLayout';
import { api } from '../api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
} from '../components/ui';
import {
  User as LucideUser,
  Shield, Bell, Database, Key, Save, Check, CreditCard,
  Moon, Sun, Palette, Monitor, LogOut, Trash2, Download,
  Upload, RefreshCw, Copy, Eye, Smartphone,
  AlertTriangle, HardDrive, Zap,
} from "lucide-react";
import type { User } from '../types';
import { colors, radii, typography, spacing } from '../design-tokens';

// ─── Sidebar nav items ───────────────────────────────────
const sections = [
  { id: 'profile', label: 'Profile', icon: <LucideUser size={15} />, description: 'Your public identity' },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={15} />, description: 'Theme & display' },
  { id: 'security', label: 'Security', icon: <Shield size={15} />, description: 'Password & 2FA' },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} />, description: 'Email & push alerts' },
  { id: 'billing', label: 'Billing', icon: <CreditCard size={15} />, description: 'Plans & invoices' },
  { id: 'storage', label: 'Storage', icon: <Database size={15} />, description: 'Data & retention' },
  { id: 'api', label: 'API & CLI', icon: <Key size={15} />, description: 'Developer access' },
  { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle size={15} />, description: 'Account deletion' },
];

// ─── Main Settings Page ──────────────────────────────────
export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [user, setUser] = useState<User | null>(null);
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [saved, setSaved] = useState(false);

  // Appearance
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [fontSize, setFontSize] = useState('14');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Notifications
  const [notifReview, setNotifReview] = useState(true);
  const [notifApproval, setNotifApproval] = useState(true);
  const [notifVersion, setNotifVersion] = useState(true);
  const [notifInvoice, setNotifInvoice] = useState(true);
  const [notifChangeOrder, setNotifChangeOrder] = useState(false);
  const [notifDigest, setNotifDigest] = useState(true);
  const [notifSound, setNotifSound] = useState(true);

  // Security

  useEffect(() => {
    api.me().then(u => {
      setUser(u);
      setBio(u.bio || '');
      setSpecialty(u.specialty || '');
      setLocation(u.location || '');
    }).catch(() => {});
  }, []);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateProfile({ bio, specialty, location });
      setUser(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      window.console.error(err);
    }
  };

  return (
    <FullPageLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Manage your account, preferences, and integrations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>
              {/* ─── Sidebar Nav ─── */}
              <Card>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {sections.map(s => (
                      <Button
                        key={s.id}
                        variant={activeSection === s.id ? 'outline' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveSection(s.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 12px',
                          borderRadius: radii.sm,
                          textAlign: 'left',
                          color: activeSection === s.id ? colors.brand.primary : colors.text.secondary,
                          fontSize: '14px',
                          fontWeight: activeSection === s.id ? typography.fontWeight.semiBold : typography.fontWeight.regular,
                          fontFamily: 'inherit',
                          width: '100%',
                          transition: 'all 0.15s',
                          borderLeft: activeSection === s.id
                            ? `${radii.sm} solid ${colors.brand.primary}`
                            : `${radii.sm} solid transparent`,
                        }}
                        onMouseEnter={e => {
                          if (activeSection !== s.id) e.currentTarget.style.background = 'var(--bg-hover)';
                        }}
                        onMouseLeave={e => {
                          if (activeSection !== s.id) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {s.icon}
                        <div>
                          <div>{s.label}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>{s.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ─── Content ─── */}
              <Card>
                <CardContent>
                  {/* ─── PROFILE ─── */}
                  {activeSection === 'profile' && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Public Profile</CardTitle>
                          <CardDescription>
                            This is how others see you on SoundHub.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Avatar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xl, marginBottom: spacing['2xl'] }}>
                            <div style={{
                              width: '72px', height: '72px', borderRadius: radii.full,
                              background: colors.brand.muted, display: 'flex',
                              alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                              fontWeight: typography.fontWeight.bold, color: colors.text.secondary,
                            }}>
                              {user?.username?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div style={{ fontSize: typography.fontSize.h2, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                                @{user?.username || '…'}
                              </div>
                              <div style={{ fontSize: typography.fontSize.body, color: colors.text.muted }}>
                                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '…'}
                              </div>
                              <Button variant="outline" size="sm" style={{ marginTop: spacing.sm, padding: `${spacing.xs} ${spacing.md}`, fontSize: typography.fontSize.small }}>
                                <Upload size={12} /> Change Avatar
                              </Button>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                            <label htmlFor="bio" style={{ fontSize: typography.fontSize.small, fontWeight: typography.fontWeight.medium, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bio</label>
                            <div style={{ fontSize: typography.fontSize.body, color: colors.text.secondary, marginBottom: spacing.sm }}>A short description about yourself.</div>
                            <textarea
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              placeholder="Tell us about your work, style, and experience…"
                              rows={4}
                              style={{ padding: `${spacing.md} ${spacing.lg}`, background: colors.bg.elevated, color: colors.text.primary, border: `1px solid ${colors.border.default}`, borderRadius: radii.sm, fontSize: typography.fontSize.body, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }}
                            />
                          </div>

                          <Input
                            label="Specialty"
                            helperText="Your primary role or expertise."
                            type="text"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            placeholder="e.g. Mixing & Mastering, Sound Design, Composition"
                          />

                          <Input
                            label="Location"
                            helperText="City and country."
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Berlin, DE"
                          />

                          <Input
                            label="Website"
                            helperText="Your personal or studio website."
                            type="url"
                            placeholder="https://yourstudio.com"
                          />

                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
                            <Button variant="primary" onClick={handleSaveProfile}>
                              {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Profile</>}
                            </Button>
                            {saved && (
                              <span style={{ fontSize: typography.fontSize.h3, color: colors.success }}>Profile updated successfully.</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Connected Accounts</CardTitle>
                          <CardDescription>
                            Link your social and wallet accounts.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {[
                            { name: 'Wallet', icon: '🔗', status: user?.wallet_address ? 'Connected' : 'Not connected', action: user?.wallet_address ? 'Disconnect' : 'Connect' },
                            { name: 'GitHub', icon: '🐙', status: 'Not connected', action: 'Connect' },
                            { name: 'Discord', icon: '💬', status: 'Not connected', action: 'Connect' },
                          ].map(acc => (
                            <div key={acc.name} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: `${spacing.lg} ${spacing.xl}`, background: colors.bg.primary, borderRadius: radii.sm,
                              border: `1px solid ${colors.border.default}`, marginBottom: spacing.sm,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: `${spacing.md}` }}>
                                <span style={{ fontSize: typography.fontSize.h1 }}>{acc.icon}</span>
                                <div>
                                  <div style={{ fontSize: typography.fontSize.h3, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary }}>{acc.name}</div>
                                  <div style={{ fontSize: typography.fontSize.h3, color: acc.status === 'Connected' ? colors.success : colors.text.muted }}>
                                    {acc.status}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant={acc.status === 'Connected' ? 'outline' : 'primary'}
                                size="sm"
                              >
                                {acc.action}
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* ─── APPEARANCE ─── */}
                  {activeSection === 'appearance' && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Theme</CardTitle>
                          <CardDescription>
                            Choose your preferred color scheme.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: `${spacing.md}` }}>
                            {([
                              { id: 'dark', label: 'Dark', icon: <Moon size={18} />, desc: 'Easy on the eyes' },
                              { id: 'light', label: 'Light', icon: <Sun size={18} />, desc: 'Clean and bright' },
                              { id: 'system', label: 'System', icon: <Monitor size={18} />, desc: 'Follow OS setting' }
                            ] as const).map(t => (
                              <Button
                                key={t.id}
                                variant={theme === t.id ? 'outline' : 'ghost'}
                                size="sm"
                                onClick={() => setTheme(t.id)}
                                style={{
                                  padding: spacing.xl,
                                  background: theme === t.id ? colors.brand.muted : colors.bg.primary,
                                  border: `2px solid ${theme === t.id ? colors.brand.primary : colors.border.default}`,
                                  borderRadius: radii.sm,
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  transition: 'all 0.15s',
                                  fontFamily: 'inherit',
                                }}>
                                <div style={{ color: theme === t.id ? colors.brand.primary : colors.text.muted, marginBottom: spacing.sm }}>
                                  {t.icon}
                                </div>
                                <div style={{ fontSize: typography.fontSize.h3, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary }}>{t.label}</div>
                                <div style={{ fontSize: typography.fontSize.body, color: colors.text.secondary, marginTop: spacing.xs }}>{t.desc}</div>
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Display</CardTitle>
                          <CardDescription>
                            Customize how the interface looks.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, marginBottom: spacing.sm }}>
                            <label htmlFor="fontSizeSelect" style={{ fontSize: typography.fontSize.small, fontWeight: typography.fontWeight.medium, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Base Font Size</label>
                            <select id="fontSizeSelect"
                              value={fontSize}
                              onChange={(e) => setFontSize(e.target.value)}
                              style={{ padding: `${spacing.sm} ${spacing.md}`, background: colors.bg.elevated, color: colors.text.primary, border: `1px solid ${colors.border.default}`, borderRadius: radii.sm, fontSize: typography.fontSize.h3 }}
                            >
                              <option value="12">Small (12px)</option>
                              <option value="14">Default (14px)</option>
                              <option value="16">Large (16px)</option>
                              <option value="18">Extra Large (18px)</option>
                            </select>
                          </div>

                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${spacing.sm} ${spacing.md}`, borderRadius: radii.sm, cursor: 'pointer' }}>
                            <span style={{ fontSize: typography.fontSize.h3, color: colors.text.primary }}>Collapse sidebar by default</span>
                            <input type="checkbox" checked={sidebarCollapsed} onChange={(e) => setSidebarCollapsed(e.target.checked)} style={{ width: spacing.xl, height: spacing.xl, accentColor: colors.brand.primary }} />
                          </label>

                          <label htmlFor="showWaveformsCheckbox" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${spacing.sm} ${spacing.md}`, borderRadius: radii.sm, cursor: 'pointer' }}>
                            <span style={{ fontSize: typography.fontSize.h3, color: colors.text.primary }}>Show waveforms in project cards</span>
                            <input type="checkbox" id="showWaveformsCheckbox" checked={true} onChange={() => {}} style={{ width: spacing.xl, height: spacing.xl, accentColor: colors.brand.primary }} />
                          </label>

                          <label htmlFor="enableAnimationsCheckbox" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${spacing.sm} ${spacing.md}`, borderRadius: radii.sm, cursor: 'pointer' }}>
                            <span style={{ fontSize: typography.fontSize.h3, color: colors.text.primary }}>Enable smooth transitions and animations</span>
                            <input type="checkbox" id="enableAnimationsCheckbox" checked={true} onChange={() => {}} style={{ width: spacing.xl, height: spacing.xl, accentColor: colors.brand.primary }} />
                          </label>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* ─── SECURITY ─── */}
                  {activeSection === 'security' && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Password</CardTitle>
                          <CardDescription>
                            Ensure your account uses a strong, unique password.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{
                            padding: spacing.xl,
                            background: colors.bg.primary,
                            borderRadius: radii.sm,
                            border: `1px solid ${colors.border.default}`,
                            marginBottom: spacing.lg,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                              <div style={{
                                width: spacing['3xl'], height: spacing['3xl'], borderRadius: radii.sm,
                                background: 'var(--success-muted)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', color: colors.success,
                              }}>
                                <Shield size={16} />
                              </div>
                              <div>
                                <div style={{ fontSize: typography.fontSize.h3, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary }}>Password Protected</div>
                                <div style={{ fontSize: typography.fontSize.h3, color: colors.text.secondary }}>Last changed: never</div>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: spacing.md }}>
                            <Button variant="primary">Change Password</Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Two-Factor Authentication</CardTitle>
                          <CardDescription>
                            Add an extra layer of security to your account.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{
                            padding: spacing.xl,
                            background: colors.bg.elevated,
                            borderRadius: radii.sm,
                            border: `1px solid ${colors.warning}`,
                            marginBottom: spacing.lg,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                              <AlertTriangle size={16} style={{ color: colors.warning }} />
                              <div style={{ fontSize: typography.fontSize.h3, fontWeight: typography.fontWeight.semiBold, color: colors.warning }}>
                                2FA is not enabled
                              </div>
                            </div>
                            <div style={{ fontSize: typography.fontSize.h3, color: colors.text.secondary, marginTop: spacing.sm }}>
                              We strongly recommend enabling two-factor authentication for enhanced security.
                            </div>
                          </div>
                          <Button variant="primary" size="sm">
                            <Smartphone size={14} /> Enable 2FA
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Active Sessions</CardTitle>
                          <CardDescription>
                            Manage your active login sessions.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{
                            padding: spacing.md,
                            background: colors.bg.surface,
                            borderRadius: radii.md,
                            border: `1px solid ${colors.border.default}`,
                            marginBottom: spacing.lg,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                              <Monitor size={18} style={{ color: colors.text.secondary }} />
                              <div>
                                <div style={{ fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary }}>
                                  Current Session
                                </div>
                                <div style={{ fontSize: typography.fontSize.small, color: colors.text.secondary }}>
                                  Chrome on Windows · Last active: just now
                                </div>
                              </div>
                            </div>
                            <span style={{
                              fontSize: typography.fontSize.small,
                              fontWeight: typography.fontWeight.semiBold,
                              padding: `${spacing.xs} ${spacing.sm}`,
                              background: colors.bg.elevated,
                              color: colors.text.primary,
                              borderRadius: radii.sm,
                            }}>
                              Active
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            style={{ marginTop: spacing.lg, color: colors.text.primary, borderColor: colors.border.default }}
                          >
                            <LogOut size={14} /> Sign out all other sessions
                          </Button>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* ─── NOTIFICATIONS ─── */}
                  {activeSection === 'notifications' && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Email Notifications</CardTitle>
                          <CardDescription>
                            Choose what emails you&apos;d like to receive.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                              { label: 'Review Comments', desc: 'When someone comments on your review session', checked: notifReview, onChange: (v: boolean) => setNotifReview(v) },
                              { label: 'Approval Requests', desc: 'When a version is submitted for approval', checked: notifApproval, onChange: (v: boolean) => setNotifApproval(v) },
                              { label: 'New Versions', desc: 'When a new version is uploaded to your sessions', checked: notifVersion, onChange: (v: boolean) => setNotifVersion(v) },
                              { label: 'Invoice Updates', desc: 'Payment confirmations and overdue reminders', checked: notifInvoice, onChange: (v: boolean) => setNotifInvoice(v) },
                              { label: 'Change Orders', desc: 'When a client requests changes', checked: notifChangeOrder, onChange: (v: boolean) => setNotifChangeOrder(v) },
                              { label: 'Weekly Digest', desc: 'Summary of activity across all your sessions', checked: notifDigest, onChange: (v: boolean) => setNotifDigest(v) },
                            ].map((item, index) => (
                              <label key={item.label} htmlFor={`notification-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{item.label}</span>
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.desc}</span>
                                <input id={`notification-${index}`} type="checkbox" checked={item.checked} onChange={(e) => item.onChange(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)' }}/>
                              </label>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Push Notifications</CardTitle>
                          <CardDescription>
                            Browser and mobile push alerts.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                            <label htmlFor="sound-alerts-checkbox" style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Sound Alerts</span>
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Play a sound when a notification arrives</span>
                            </label>
                            <input id="sound-alerts-checkbox" type="checkbox" checked={notifSound} onChange={(e) => setNotifSound(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)' }} />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Notification Schedule</CardTitle>
                          <CardDescription>
                            Quiet hours — no notifications during these times.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <Input
                              label="From"
                              type="time"
                              defaultValue="22:00"
                            />
                            <Input
                              label="Until"
                              type="time"
                              defaultValue="08:00"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* ─── BILLING ─── */}
                  {activeSection === 'billing' && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Current Plan</CardTitle>
                          <CardDescription>
                            Your subscription and usage.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{
                            padding: '20px',
                            background: 'var(--brand-muted)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--brand-primary)',
                            marginBottom: '16px',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Free Tier</div>
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  5 projects · 10 sessions · 1GB storage
                                </div>
                              </div>
                              <Button variant="primary">Upgrade Plan</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Payment History</CardTitle>
                          <CardDescription>
                            View your past invoices and receipts.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{
                            padding: '24px',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '14px',
                          }}>
                            No payment history yet. You&apos;re on the Free plan.
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* ─── STORAGE ─── */}
                  {activeSection === 'storage' && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Storage Overview</CardTitle>
                          <CardDescription>
                            How your data is stored and managed.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                            {[
                              { label: 'Provider', value: 'Local filesystem', icon: <HardDrive size={16} /> },
                              { label: 'Content Addressing', value: 'SHA-256', icon: <Key size={16} /> },
                              { label: 'Deduplication', value: 'Automatic', icon: <Zap size={16} /> },
                              { label: 'Total Used', value: '0.3 GB', icon: <Database size={16} /> },
                            ].map(item => (
                              <div key={item.label} style={{
                                padding: '14px',
                                background: 'var(--bg-primary)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-default)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                              }}>
                                <div style={{ color: 'var(--brand-primary)' }}>{item.icon}</div>
                                <div>
                                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.label}</div>
                                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Storage Lifecycle</CardTitle>
                          <CardDescription>
                            Automatically move old files between storage tiers.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                              { tier: 'Hot', color: 'var(--success)', days: 30, desc: 'Fast access, SSD-backed' },
                              { tier: 'Warm', color: 'var(--warning)', days: 90, desc: 'Slower access, cost-effective' },
                              { tier: 'Cold', color: 'var(--info)', days: 365, desc: 'Archive, cheapest storage' },
                            ].map(t => (
                              <div key={t.tier} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 14px',
                                background: 'var(--bg-primary)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-default)',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: t.color,
                                  }} />
                                  <div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.tier} Storage</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.desc}</div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>After</span>
                                  <Input
                                    type="number"
                                    defaultValue={t.days}
                                    min="1"
                                    max="365"
                                    style={{
                                      width: '60px',
                                      height: '32px',
                                      padding: '4px 8px',
                                      textAlign: 'center',
                                      background: 'var(--bg-elevated)',
                                      border: '1px solid var(--border-default)',
                                      borderRadius: '4px',
                                      color: 'var(--text-primary)',
                                      fontSize: '14px',
                                    }}
                                  />
                                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>days</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                            <Button variant="primary"><Save size={14} /> Save Lifecycle Rules</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* ─── API & CLI ─── */}
                  {activeSection === 'api' && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Personal Access Token</CardTitle>
                          <CardDescription>
                            Use this token to authenticate with the API and CLI.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{
                            padding: '16px',
                            background: 'var(--bg-primary)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-default)',
                            marginBottom: '16px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>API Token</span>
                              <Button variant="outline" size="sm" style={{ padding: '4px 10px', fontSize: '13px' }}>
                                <RefreshCw size={12} /> Regenerate
                              </Button>
                            </div>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '8px 12px',
                              background: 'var(--bg-elevated)',
                              borderRadius: '4px',
                              fontFamily: typography.fontFamily.mono,
                              fontSize: '14px',
                              color: 'var(--text-muted)',
                              wordBreak: 'break-all',
                            }}>
                              <span style={{ flex: 1 }}>••••••••••••••••••••••••••••••••</span>
                              <Button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <Eye size={14} />
                              </Button>
                              <Button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <Copy size={14} />
                              </Button>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                              ⚠️ Keep your token secret. Do not share it or commit it to version control.
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>CLI Quick Start</CardTitle>
                          <CardDescription>
                            Install and configure the snd CLI tool.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{
                            padding: '16px',
                            background: 'var(--bg-primary)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-default)',
                            fontFamily: typography.fontFamily.mono,
                            fontSize: '14px',
                            lineHeight: 1.8,
                          }}>
                            <div style={{ color: 'var(--text-muted)' }}># Install the CLI</div>
                            <div style={{ color: 'var(--text-primary)' }}>$
                              pip install soundhub-cli</div>
                            <div style={{ color: 'var(--text-muted)', marginTop: '8px' }}># Login with your token</div>
                            <div style={{ color: 'var(--text-primary)' }}>$
                              snd login --token YOUR_TOKEN</div>
                            <div style={{ color: 'var(--text-muted)', marginTop: '8px' }}># Push a project</div>
                            <div style={{ color: 'var(--text-primary)' }}>$
                              snd push --project my-project ./audio/</div>
                            <div style={{ color: 'var(--text-muted)', marginTop: '8px' }}># Pull latest</div>
                            <div style={{ color: 'var(--text-primary)' }}>$
                              snd pull --project my-project</div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Webhook Endpoints</CardTitle>
                          <CardDescription>
                            Receive real-time events via HTTP callbacks.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Input
                              label="Endpoint URL"
                              type="url"
                              placeholder="https://your-server.com/webhook"
                            />
                            <Input
                              label="Secret"
                              type="password"
                              placeholder="Webhook signing secret"
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Button variant="primary"><Save size={14} /> Save Webhook</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* ─── DANGER ZONE ─── */}
                  {activeSection === 'danger' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Danger Zone</CardTitle>
                        <CardDescription>
                          Irreversible actions — please be careful.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div style={{
                          padding: '16px',
                          background: 'var(--error-muted)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--error)',
                          marginBottom: '16px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <AlertTriangle size={16} style={{ color: 'var(--error)' }} />
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--error)' }}>Delete Account</span>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                            Permanently delete your account and all associated data. This action cannot be undone.
                            All projects, sessions, and files will be permanently removed.
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            style={{
                              color: 'var(--error)',
                              borderColor: 'var(--error)',
                            }}
                          >
                            <Trash2 size={14} /> Delete My Account
                          </Button>
                        </div>

                        <div style={{
                          padding: '16px',
                          background: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-default)',
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                            Export All Data
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                            Download a complete archive of all your projects, sessions, and files.
                          </div>
                          <Button variant="outline" size="sm">
                            <Download size={14} /> Export Data
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </FullPageLayout>
  );
}