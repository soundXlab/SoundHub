import React from 'react';
import { 
  AppLayout, 
  Sidebar, 
  SidebarNavItem, 
  SidebarDivider,
  SidebarSection,
  TopBar, 
  TopBarLink, 
  TopBarSearch,
  TopBarUserMenu,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  AudioPlayer,
  colors,
  typography,
  spacing
} from '../components/ui';

import { 
  Home, 
  Folder, 
  Music, 
  Upload, 
  Settings,
  Bell,
  MessageSquare,
  Check,
  X,
  Send,
  Clock,
  ChevronDown,
  MoreHorizontal,
  Reply,
  Pin
} from 'lucide-react';

// Types
interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: number; // seconds
  createdAt: string;
  resolved: boolean;
  replies?: Comment[];
  pinned?: boolean;
}

interface Version {
  id: string;
  number: string;
  author: string;
  createdAt: string;
  status: 'draft' | 'review' | 'changes' | 'approved';
  notes?: string;
  waveform?: number[];
}

interface Review {
  id: string;
  projectName: string;
  version: string;
  author: string;
  status: 'draft' | 'review' | 'changes' | 'approved';
  duration: number;
  comments: Comment[];
  versions: Version[];
}

// Mock data
const mockReview: Review = {
  id: '1',
  projectName: 'Neon Bloom',
  version: 'v13',
  author: 'Alex',
  status: 'review',
  duration: 222,
  comments: [
    {
      id: '1',
      author: 'Sarah',
      content: 'The bass is much better here now! Great improvement from v12.',
      timestamp: 45,
      createdAt: '2h ago',
      resolved: false,
      pinned: true
    },
    {
      id: '2',
      author: 'Alex',
      content: 'Love the new synth layer you added. Really fills out the mix.',
      timestamp: 92,
      createdAt: '2h ago',
      resolved: false
    },
    {
      id: '3',
      author: 'Sarah',
      content: 'Can we boost the hi-hats here? They feel a bit buried.',
      timestamp: 138,
      createdAt: '1h ago',
      resolved: false,
      replies: [
        {
          id: '3-1',
          author: 'Alex',
          content: 'Good catch! I\'ll boost them by 2dB in the next version.',
          timestamp: 138,
          createdAt: '45m ago',
          resolved: false
        }
      ]
    },
    {
      id: '4',
      author: 'Producer',
      content: 'The transition at 2:15 is smooth. Nice work!',
      timestamp: 135,
      createdAt: '30m ago',
      resolved: true
    }
  ],
  versions: [
    {
      id: 'v13',
      number: 'v13',
      author: 'Alex',
      createdAt: '2h ago',
      status: 'review',
      notes: 'Updated bass and synth layers'
    },
    {
      id: 'v12',
      number: 'v12',
      author: 'Alex',
      createdAt: '1d ago',
      status: 'approved',
      notes: 'Initial mix after stem separation'
    },
    {
      id: 'v11',
      number: 'v11',
      author: 'Alex',
      createdAt: '2d ago',
      status: 'changes',
      notes: 'Requested changes: bass too loud'
    },
    {
      id: 'v10',
      number: 'v10',
      author: 'Sarah',
      createdAt: '3d ago',
      status: 'review',
      notes: 'First upload'
    }
  ]
};

// Helper components
const StatusBadge: React.FC<{ status: Review['status'] }> = ({ status }) => {
  const config: Record<Review['status'], { variant: 'draft' | 'processing' | 'ready' | 'error'; label: string }> = {
    draft: { variant: 'draft', label: 'Draft' },
    review: { variant: 'processing', label: 'In Review' },
    changes: { variant: 'error', label: 'Changes Requested' },
    approved: { variant: 'ready', label: 'Approved' }
  };
  
  return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
};

const formatTimestamp = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const CommentItem: React.FC<{
  comment: Comment;
  onResolve?: (id: string) => void;
  onReply?: (id: string) => void;
  onPin?: (id: string) => void;
  onSeek?: (timestamp: number) => void;
}> = ({ comment, onResolve, onReply, onPin, onSeek }) => (
  <div style={{
    padding: spacing.xl,
    borderBottom: `1px solid ${colors.border.default}`,
    background: comment.pinned ? 'rgba(139, 92, 246, 0.05)' : 'transparent'
  }}>
    <div style={{ display: 'flex', gap: spacing.lg }}>
      {/* Avatar */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: colors.bg.elevated,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: typography.fontSize.caption,
        fontWeight: 700,
        color: colors.text.muted,
        flexShrink: 0
      }}>
        {comment.author.charAt(0)}
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, marginBottom: '4px' }}>
          <span style={{ fontSize: typography.fontSize.h3, fontWeight: 600, color: colors.text.primary }}>
            {comment.author}
          </span>
          <span style={{ fontSize: typography.fontSize.caption, color: colors.text.muted }}>
            {comment.createdAt}
          </span>
          {comment.pinned && (
            <Pin size={12} style={{ color: colors.brand.primary }} />
          )}
          {comment.resolved && (
            <Badge variant="ready" size="sm">Resolved</Badge>
          )}
        </div>
        
        {/* Timestamp link */}
        <button
          onClick={() => onSeek?.(comment.timestamp)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.lg,
            padding: '2px 8px',
            borderRadius: '16px',
            background: colors.brand.primary,
            color: colors.text.primary,
            border: 'none',
            fontSize: typography.fontSize.caption,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '8px',
            fontFamily: 'monospace'
          }}
        >
          <Clock size={10} />
          {formatTimestamp(comment.timestamp)}
        </button>
        
        {/* Comment text */}
        <p style={{
          margin: 0,
          fontSize: typography.fontSize.caption,
          color: colors.text.primary,
          lineHeight: 1.5
        }}>
          {comment.content}
        </p>
        
        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          gap: spacing.lg, 
          marginTop: '12px',
          opacity: 0.7
        }}>
          <button
            onClick={() => onReply?.(comment.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.lg,
              background: 'transparent',
              border: 'none',
              color: colors.text.muted,
              fontSize: typography.fontSize.caption,
              cursor: 'pointer',
              padding: 0
            }}
          >
            <Reply size={12} />
            Reply
          </button>
          {!comment.resolved && (
            <button
              onClick={() => onResolve?.(comment.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.lg,
                background: 'transparent',
                border: 'none',
                color: colors.success,
                fontSize: typography.fontSize.caption,
                cursor: 'pointer',
                padding: 0
              }}
            >
              <Check size={12} />
              Resolve
            </button>
          )}
          <button
            onClick={() => onPin?.(comment.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.lg,
              background: 'transparent',
              border: 'none',
              color: comment.pinned ? colors.brand.primary : colors.text.muted,
              fontSize: typography.fontSize.caption,
              cursor: 'pointer',
              padding: 0
            }}
          >
            <Pin size={12} />
            {comment.pinned ? 'Unpin' : 'Pin'}
          </button>
        </div>
        
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: `1px solid ${colors.border.default}`
          }}>
            {comment.replies.map(reply => (
              <div key={reply.id} style={{ display: 'flex', gap: spacing.lg, marginBottom: '14px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: colors.bg.elevated,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize.caption,
                  fontWeight: 700,
                  color: colors.text.muted,
                  flexShrink: 0
                }}>
                  {reply.author.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: typography.fontSize.h3, fontWeight: 600, color: colors.text.primary }}>
                    {reply.author}
                    <span style={{ fontWeight: 400, color: colors.text.muted, marginLeft: '8px' }}>
                      {reply.createdAt}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: typography.fontSize.caption, color: colors.text.secondary }}>
                    {reply.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const VersionItem: React.FC<{
  version: Version;
  isActive?: boolean;
  onClick?: () => void;
}> = ({ version, isActive, onClick }) => {
  const statusColors: Record<Version['status'], string> = {
    draft: colors.text.muted,
    review: colors.warning,
    changes: colors.error,
    approved: colors.success
  };
  
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: spacing.xl,
        background: isActive ? 'rgba(139, 92, 246, 0.1)' : colors.bg.surface,
        border: `1px solid ${isActive ? colors.brand.primary : colors.border.default}`,
        borderRadius: '16px',
        cursor: 'pointer',
        textAlign: 'left',
        marginBottom: '8px',
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
          <span style={{ 
            fontFamily: 'monospace',
            fontSize: typography.fontSize.caption,
            fontWeight: 700,
            color: colors.brand.primary
          }}>
            {version.number}
          </span>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: statusColors[version.status]
          }} />
        </div>
        <span style={{ fontSize: typography.fontSize.caption, color: colors.text.muted }}>
          {version.createdAt}
        </span>
      </div>
      {version.notes && (
        <div style={{ 
          fontSize: typography.fontSize.caption, 
          color: colors.text.secondary, 
          marginTop: '6px',
          lineHeight: 1.4
        }}>
          {version.notes}
        </div>
      )}
    </button>
  );
};

// Main Review Component
export const ReviewPage: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [review, setReview] = React.useState(mockReview);
  const [selectedVersion, setSelectedVersion] = React.useState('v13');
  const [currentTime, setCurrentTime] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [commentTimestamp, setCommentTimestamp] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'open' | 'resolved'>('all');

  // Filter comments
  const filteredComments = review.comments.filter(comment => {
    if (filterStatus === 'open') return !comment.resolved;
    if (filterStatus === 'resolved') return comment.resolved;
    return true;
  });

  // Sort comments by timestamp
  const sortedComments = [...filteredComments].sort((a, b) => a.timestamp - b.timestamp);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    
    const timestampParts = commentTimestamp.split(':');
    const timestamp = timestampParts.length === 2 
      ? parseInt(timestampParts[0]) * 60 + parseInt(timestampParts[1])
      : Math.floor(currentTime);
    
    const newComment: Comment = {
      id: Date.now().toString(),
      author: 'You',
      content: commentText,
      timestamp,
      createdAt: 'Just now',
      resolved: false
    };
    
    setReview(prev => ({
      ...prev,
      comments: [...prev.comments, newComment]
    }));
    
    setCommentText('');
    setCommentTimestamp('');
  };

  const handleResolveComment = (commentId: string) => {
    setReview(prev => ({
      ...prev,
      comments: prev.comments.map(c => 
        c.id === commentId ? { ...c, resolved: true } : c
      )
    }));
  };

  const handlePinComment = (commentId: string) => {
    setReview(prev => ({
      ...prev,
      comments: prev.comments.map(c => 
        c.id === commentId ? { ...c, pinned: !c.pinned } : c
      )
    }));
  };

  return (
    <AppLayout
      sidebarCollapsed={sidebarCollapsed}
      topbar={
        <TopBar
          title="SoundHub"
          logo={<span style={{ color: colors.brand.primary, fontSize: typography.fontSize.body }}>🎵</span>}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
              <Button variant="ghost" size="sm">
                <Bell size={16} />
              </Button>
              <TopBarUserMenu username="Producer" />
            </div>
          }
        >
          <TopBarLink href="/dashboard">Dashboard</TopBarLink>
          <TopBarLink href="/projects">Projects</TopBarLink>
          <TopBarLink href="/marketplace">Marketplace</TopBarLink>
          <TopBarLink href="/reviews" active>Reviews</TopBarLink>
        </TopBar>
      }
      sidebar={
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}>
          <SidebarSection title="Main" collapsed={sidebarCollapsed} />
          <SidebarNavItem href="/dashboard" icon={<Home size={18} />} collapsed={sidebarCollapsed}>
            Dashboard
          </SidebarNavItem>
          <SidebarNavItem href="/projects" icon={<Folder size={18} />} collapsed={sidebarCollapsed}>
            Projects
          </SidebarNavItem>
          <SidebarNavItem href="/marketplace" icon={<Music size={18} />} collapsed={sidebarCollapsed}>
            Marketplace
          </SidebarNavItem>
          <SidebarNavItem href="/upload" icon={<Upload size={18} />} collapsed={sidebarCollapsed}>
            Upload
          </SidebarNavItem>
          
          <SidebarDivider />
          
          <SidebarSection title="Account" collapsed={sidebarCollapsed} />
          <SidebarNavItem href="/settings" icon={<Settings size={18} />} collapsed={sidebarCollapsed}>
            Settings
          </SidebarNavItem>
        </Sidebar>
      }
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, marginBottom: '8px' }}>
                <h1 style={{ 
                  fontSize: typography.fontSize.h1, 
                  fontWeight: 700, 
                  margin: 0,
                  color: colors.text.primary 
                }}>
                  {review.projectName}
                </h1>
                <StatusBadge status={review.status} />
              </div>
              <p style={{ 
                fontSize: typography.fontSize.caption, 
                color: colors.text.secondary,
                margin: 0 
              }}>
                {review.version} · by {review.author} · {review.comments.length} comments
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: spacing.lg }}>
              <Button variant="ghost" size="sm">
                <MoreHorizontal size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: spacing.lg }}>
          
          {/* Left Column: Player + Comments */}
          <div>
            {/* Audio Player */}
            <Card padding="none" style={{ marginBottom: '18px', overflow: 'hidden' }}>
              <div style={{ padding: spacing.xl, borderBottom: `1px solid ${colors.border.default}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: typography.fontSize.h3, fontWeight: 600, color: colors.text.primary }}>
                    Version {selectedVersion}
                  </h3>
                  <div style={{ display: 'flex', gap: spacing.lg }}>
                    <Button variant="ghost" size="sm">
                      <X size={14} />
                      Reject
                    </Button>
                    <Button variant="primary" size="sm">
                      <Check size={14} />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
              <AudioPlayer
                title={`${review.projectName} - ${selectedVersion}`}
                artist={review.author}
                duration={review.duration}
                waveform={Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onSeek={setCurrentTime}
              />
            </Card>
            
            {/* Comment Input */}
            <Card padding="md" style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', gap: spacing.lg }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: colors.brand.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize.caption,
                  fontWeight: 700,
                  color: colors.text.primary,
                  flexShrink: 0
                }}>
                  Y
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: spacing.lg, marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="mm:ss"
                      value={commentTimestamp}
                      onChange={(e) => setCommentTimestamp(e.target.value)}
                      style={{
                        width: '60px',
                        padding: '8px 10px',
                        borderRadius: '14px',
                        border: `1px solid ${colors.border.default}`,
                        background: colors.bg.elevated,
                        color: colors.text.primary,
                        fontFamily: 'monospace',
                        fontSize: typography.fontSize.caption
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '14px',
                        border: `1px solid ${colors.border.default}`,
                        background: colors.bg.elevated,
                        color: colors.text.primary,
                        fontSize: typography.fontSize.caption
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: typography.fontSize.caption, color: colors.text.muted }}>
                      Press Enter to submit · Use mm:ss for timestamp
                    </span>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!commentText.trim()}
                    >
                      <Send size={12} />
                      Comment
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Comments List */}
            <Card padding="none">
              <div style={{ 
                padding: '12px 16px', 
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: typography.fontSize.h3, fontWeight: 600, color: colors.text.primary }}>
                  Comments
                </h3>
                <div style={{ display: 'flex', gap: spacing.lg }}>
                  {(['all', 'open', 'resolved'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        border: `1px solid ${filterStatus === status ? colors.brand.primary : colors.border.default}`,
                        background: filterStatus === status ? colors.brand.primary : 'transparent',
                        color: filterStatus === status ? colors.text.primary : colors.text.muted,
                        fontSize: typography.fontSize.caption,
                        fontWeight: 500,
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              
              {sortedComments.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: colors.text.muted }}>
                  <MessageSquare size={32} style={{ marginBottom: '14px', opacity: 0.3 }} />
                  <div style={{ fontSize: typography.fontSize.caption }}>No comments yet</div>
                  <div style={{ fontSize: typography.fontSize.caption, marginTop: '4px' }}>
                    Be the first to leave feedback
                  </div>
                </div>
              ) : (
                sortedComments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onResolve={handleResolveComment}
                    onReply={(id) => console.log('Reply to:', id)}
                    onPin={handlePinComment}
                    onSeek={setCurrentTime}
                  />
                ))
              )}
            </Card>
          </div>
          
          {/* Right Column: Version History */}
          <div>
            <Card padding="none" style={{ position: 'sticky', top: '80px' }}>
              <div style={{ 
                padding: spacing.xl, 
                borderBottom: `1px solid ${colors.border.default}` 
              }}>
                <h3 style={{ margin: 0, fontSize: typography.fontSize.h3, fontWeight: 600, color: colors.text.primary }}>
                  Version History
                </h3>
              </div>
              <div style={{ padding: spacing.xl }}>
                {review.versions.map(version => (
                  <VersionItem
                    key={version.id}
                    version={version}
                    isActive={selectedVersion === version.number}
                    onClick={() => setSelectedVersion(version.number)}
                  />
                ))}
              </div>
              
              <div style={{ 
                padding: spacing.xl, 
                borderTop: `1px solid ${colors.border.default}` 
              }}>
                <Button variant="secondary" fullWidth size="sm">
                  Upload New Version
                </Button>
              </div>
            </Card>
            
            {/* Activity */}
            <Card padding="md" style={{ marginTop: '16px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: typography.fontSize.h3, fontWeight: 600, color: colors.text.primary }}>
                Recent Activity
              </h3>
              <div style={{ fontSize: typography.fontSize.caption, color: colors.text.secondary }}>
                <div style={{ padding: '6px 0', borderBottom: `1px solid ${colors.border.default}` }}>
                  <span style={{ fontWeight: 600 }}>Sarah</span> commented at 0:45
                </div>
                <div style={{ padding: '6px 0', borderBottom: `1px solid ${colors.border.default}` }}>
                  <span style={{ fontWeight: 600 }}>Alex</span> uploaded {selectedVersion}
                </div>
                <div style={{ padding: '6px 0' }}>
                  <span style={{ fontWeight: 600 }}>Producer</span> approved v12
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReviewPage;
