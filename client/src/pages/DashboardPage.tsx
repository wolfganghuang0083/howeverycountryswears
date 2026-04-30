import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  ThumbsUp,
  Send,
  Trophy,
  User,
  BookOpen,
  LogIn,
  Edit3,
  Save,
  AlertCircle,
  Star,
  Award,
  Globe,
  Zap,
  Crown,
  Flag,
} from "lucide-react";
import { AMAZON_LINK } from "@/lib/data";
import { Link } from "wouter";

// ========== STAT CARD ==========
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5"
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon size={24} className={color} />
        </div>
        <div>
          <p className="font-display text-2xl text-[#1a1a1a]">{value}</p>
          <p className="text-xs text-[#999] font-semibold">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ========== BADGE CONFIG ==========
const BADGE_CONFIG: Record<string, { icon: any; color: string; bg: string; description: string }> = {
  explorer: { icon: Globe, color: "text-[#00BFFF]", bg: "bg-[#F0F8FF]", description: "Visited 10+ countries" },
  polyglot: { icon: Zap, color: "text-[#9B59B6]", bg: "bg-[#F5F0FF]", description: "Listened to 50+ phrases" },
  book_owner: { icon: BookOpen, color: "text-[#FFB800]", bg: "bg-[#FFF8E1]", description: "Verified book owner" },
  swear_master: { icon: Crown, color: "text-[#FF1493]", bg: "bg-[#FFF0F5]", description: "Rated 100+ cards" },
  national_ambassador: { icon: Flag, color: "text-[#32CD32]", bg: "bg-[#F0FFF0]", description: "Country ambassador" },
};

// ========== BADGE DISPLAY ==========
function BadgeDisplay({ badges }: { badges: Array<{ badgeType: string; earnedAt: Date | string }> }) {
  if (!badges || badges.length === 0) {
    return (
      <div className="text-center py-6 bg-white rounded-xl border-2 border-dashed border-[#ddd]">
        <Award size={36} className="mx-auto text-[#ddd] mb-2" />
        <p className="text-sm text-[#999]">No badges earned yet. Keep exploring!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {badges.map((badge) => {
        const config = BADGE_CONFIG[badge.badgeType] || BADGE_CONFIG.explorer;
        const BadgeIcon = config.icon;
        return (
          <motion.div
            key={badge.badgeType}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${config.bg} rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] p-4 text-center`}
          >
            <BadgeIcon size={32} className={`mx-auto mb-2 ${config.color}`} />
            <p className="font-bold text-xs text-[#1a1a1a] capitalize">
              {badge.badgeType.replace(/_/g, " ")}
            </p>
            <p className="text-[10px] text-[#999] mt-1">{config.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ========== ALL BADGES (with locked ones) ==========
function AllBadges({ earnedBadges }: { earnedBadges: Array<{ badgeType: string }> }) {
  const earnedSet = new Set(earnedBadges.map(b => b.badgeType));
  const allBadgeTypes = Object.keys(BADGE_CONFIG);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {allBadgeTypes.map((type) => {
        const config = BADGE_CONFIG[type];
        const BadgeIcon = config.icon;
        const earned = earnedSet.has(type);
        return (
          <div
            key={type}
            className={`rounded-xl border-2 p-4 text-center transition-all ${
              earned
                ? `${config.bg} border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]`
                : "bg-gray-50 border-gray-200 opacity-50"
            }`}
          >
            <BadgeIcon size={32} className={`mx-auto mb-2 ${earned ? config.color : "text-gray-300"}`} />
            <p className={`font-bold text-xs capitalize ${earned ? "text-[#1a1a1a]" : "text-gray-400"}`}>
              {type.replace(/_/g, " ")}
            </p>
            <p className="text-[10px] text-[#999] mt-1">{config.description}</p>
            {earned && (
              <span className="inline-block mt-1 text-[10px] font-bold text-[#32CD32]">Earned</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ========== MY SUBMISSION ITEM ==========
function MySubmissionItem({ item }: { item: any }) {
  const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    pending: { icon: Clock, color: "text-[#FFB800]", bg: "bg-[#FFF8E1]", label: "Pending Review" },
    approved: { icon: CheckCircle, color: "text-[#32CD32]", bg: "bg-[#F0FFF0]", label: "Approved" },
    rejected: { icon: XCircle, color: "text-[#FF4444]", bg: "bg-[#FFF0F0]", label: "Rejected" },
  };

  const status = statusConfig[item.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-xl border-2 border-[#eee] hover:border-[#1a1a1a] transition-colors p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{item.countryFlag}</span>
          <div>
            <h4 className="font-bold text-sm text-[#1a1a1a]">{item.countryName}</h4>
            <span className="text-xs text-[#999]">{item.phraseType}</span>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
          <StatusIcon size={12} />
          {status.label}
        </div>
      </div>

      <div className="bg-[#F8F8F8] rounded-lg p-2 mb-2">
        <p className="font-display text-base text-[#1a1a1a]">{item.phrase}</p>
        {item.literal && <p className="text-xs text-[#666] mt-0.5">"{item.literal}"</p>}
      </div>

      <div className="flex items-center justify-between text-xs text-[#999]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <ThumbsUp size={12} /> {item.voteCount} votes
          </span>
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
        {item.status === "rejected" && item.rejectionReason && (
          <span className="text-[#FF4444] flex items-center gap-1">
            <AlertCircle size={12} /> {item.rejectionReason}
          </span>
        )}
      </div>
    </div>
  );
}

// ========== PROFILE SECTION ==========
function ProfileSection({ user, points }: { user: any; points: number }) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.name || "");
  const utils = trpc.useUtils();

  const updateMutation = trpc.profile.updateDisplayName.useMutation({
    onSuccess: () => {
      setEditing(false);
      utils.auth.me.invalidate();
    },
  });

  // Determine level based on tier
  const level = user?.memberTier === "bookBuyer" ? 2 : 1;
  const levelLabel = level === 2 ? "Level 2 — Book Buyer" : "Level 1 — Free Member";
  const levelColor = level === 2 ? "bg-[#FFE500] text-[#1a1a1a] border-[#1a1a1a]" : "bg-[#F0F0F0] text-[#999] border-[#ddd]";

  return (
    <div className="bg-white rounded-xl border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF1493] to-[#FFE500] flex items-center justify-center border-3 border-[#1a1a1a]">
          <User size={32} className="text-white" />
        </div>
        <div className="flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="px-3 py-1.5 rounded-lg border-2 border-[#FF1493] outline-none text-sm font-semibold"
                autoFocus
              />
              <button
                onClick={() => updateMutation.mutate({ displayName })}
                disabled={updateMutation.isPending}
                className="p-1.5 bg-[#32CD32] text-white rounded-lg"
              >
                <Save size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl text-[#1a1a1a]">
                {user?.displayName || user?.name || "Anonymous"}
              </h2>
              <button onClick={() => setEditing(true)} className="text-[#999] hover:text-[#FF1493]">
                <Edit3 size={14} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${levelColor}`}>
              {levelLabel}
            </span>
            {user?.role === "admin" && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FF1493] text-white border border-[#1a1a1a]">
                Admin
              </span>
            )}
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#F0F8FF] text-[#00BFFF] border border-[#00BFFF]">
              <Star size={10} /> {points} pts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== POINTS HISTORY ==========
function PointsHistory({ history }: { history: Array<{ action: string; points: number; createdAt: Date | string }> }) {
  if (!history || history.length === 0) return null;

  const actionLabels: Record<string, string> = {
    daily_login: "Daily Login",
    rate_card: "Rated a Card",
    submit_ugc: "Submitted Phrase",
    ugc_five_star: "UGC Got 5-Star Avg",
    ugc_weekly_rank: "Weekly Rank Bonus",
  };

  return (
    <div className="bg-white rounded-xl border-2 border-[#eee] overflow-hidden">
      <div className="max-h-64 overflow-y-auto">
        {history.map((entry, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#f5f5f5] last:border-0">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#FFB800]" />
              <span className="text-sm text-[#333]">{actionLabels[entry.action] || entry.action}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#32CD32]">+{entry.points}</span>
              <span className="text-xs text-[#999]">{new Date(entry.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== MAIN DASHBOARD PAGE ==========
export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: mySubmissions, isLoading: subsLoading } = trpc.dashboard.mySubmissions.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );
  const { data: badgesData } = trpc.badges.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: pointsData } = trpc.points.me.useQuery(undefined,
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    document.title = "My Dashboard — How Every Country Swears";
  }, []);

  // Not logged in
  if (!authLoading && !isAuthenticated) {
    return (
      <Layout>
        <section className="py-24">
          <div className="container max-w-md text-center">
            <div className="bg-white rounded-xl border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-10">
              <LogIn size={48} className="mx-auto text-[#FF1493] mb-4" />
              <h1 className="font-display text-3xl text-[#1a1a1a] mb-3">Sign In Required</h1>
              <p className="text-[#666] mb-6">Sign in to view your dashboard and track your submissions.</p>
              <a
                href={getLoginUrl()}
                className="inline-flex items-center gap-2 bg-[#FF1493] text-white px-6 py-3 rounded-lg font-bold border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
              >
                <LogIn size={18} /> Sign In
              </a>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const isBookBuyer = user?.memberTier === "bookBuyer" || user?.role === "admin";
  const userPoints = (user as any)?.points ?? 0;

  return (
    <Layout>
      {/* Header */}
      <section className="bg-[#1a1a1a] py-10">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-4xl text-white mb-2">
              My <span className="text-[#FFE500]">Dashboard</span>
            </h1>
            <p className="text-gray-400">Track your points, badges, submissions, and community impact</p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container">
          {/* Profile */}
          <div className="mb-8">
            <ProfileSection user={user} points={userPoints} />
          </div>

          {/* Stats Grid */}
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl border-3 border-[#eee] p-5 animate-pulse">
                  <div className="h-12 bg-[#eee] rounded" />
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <StatCard
                icon={Star}
                label="Total Points"
                value={userPoints}
                color="text-[#FFB800]"
                bgColor="bg-[#FFF8E1]"
              />
              <StatCard
                icon={Send}
                label="Submissions"
                value={stats.totalSubmissions}
                color="text-[#FF1493]"
                bgColor="bg-[#FFF0F5]"
              />
              <StatCard
                icon={CheckCircle}
                label="Approved"
                value={stats.approvedCount}
                color="text-[#32CD32]"
                bgColor="bg-[#F0FFF0]"
              />
              <StatCard
                icon={Clock}
                label="Pending"
                value={stats.pendingCount}
                color="text-[#FFB800]"
                bgColor="bg-[#FFF8E1]"
              />
              <StatCard
                icon={ThumbsUp}
                label="Votes Received"
                value={stats.totalVotesReceived}
                color="text-[#00BFFF]"
                bgColor="bg-[#F0F8FF]"
              />
            </div>
          ) : null}

          {/* Badges Section */}
          <div className="mb-8">
            <h2 className="font-display text-2xl text-[#1a1a1a] mb-4 flex items-center gap-2">
              <Award size={24} className="text-[#FFB800]" />
              My <span className="text-[#FF1493]">Badges</span>
            </h2>
            <AllBadges earnedBadges={badgesData || []} />
          </div>

          {/* Points History */}
          {pointsData && pointsData.history && pointsData.history.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-2xl text-[#1a1a1a] mb-4 flex items-center gap-2">
                <Zap size={24} className="text-[#FFB800]" />
                Points <span className="text-[#FF1493]">History</span>
              </h2>
              <PointsHistory history={pointsData.history.map(h => ({ action: h.reason, points: h.amount, createdAt: h.createdAt }))} />
            </div>
          )}

          {/* Not a book buyer yet */}
          {!isBookBuyer && (
            <div className="bg-[#FFF8E1] rounded-xl border-3 border-[#FFE500] p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
              <BookOpen size={48} className="text-[#FF1493] shrink-0" />
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-display text-xl text-[#1a1a1a] mb-1">Upgrade to Level 2 — Book Buyer</h3>
                <p className="text-sm text-[#666]">
                  Get the book and redeem your code to unlock Part 8-11, submit phrases, and earn exclusive badges.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/community"
                  className="px-4 py-2 bg-[#FF1493] text-white rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
                >
                  Redeem Code
                </Link>
                <a
                  href={AMAZON_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#FFE500] text-[#1a1a1a] rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
                >
                  Get the Book
                </a>
              </div>
            </div>
          )}

          {/* My Submissions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-[#1a1a1a]">
                My <span className="text-[#FF1493]">Submissions</span>
              </h2>
              {isBookBuyer && (
                <Link
                  href="/community"
                  className="flex items-center gap-2 bg-[#FF1493] text-white px-4 py-2 rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
                >
                  <Send size={14} /> Submit New
                </Link>
              )}
            </div>

            {subsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border-2 border-[#eee] p-4 animate-pulse">
                    <div className="h-6 bg-[#eee] rounded w-1/3 mb-2" />
                    <div className="h-10 bg-[#eee] rounded mb-2" />
                    <div className="h-4 bg-[#eee] rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : mySubmissions?.items.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-[#ddd]">
                <BarChart3 size={48} className="mx-auto text-[#ddd] mb-3" />
                <h3 className="font-display text-xl text-[#999] mb-2">No submissions yet</h3>
                <p className="text-sm text-[#999] mb-4">
                  {isBookBuyer
                    ? "Head to the community page to submit your first phrase!"
                    : "Get the book and redeem your code to start submitting."}
                </p>
                <Link
                  href="/community"
                  className="inline-flex items-center gap-2 bg-[#FF1493] text-white px-5 py-2.5 rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
                >
                  Go to Community
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {mySubmissions?.items.map((item: any) => (
                  <MySubmissionItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
