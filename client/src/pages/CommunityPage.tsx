import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp,
  ThumbsDown,
  Send,
  LogIn,
  BookOpen,
  Trophy,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Sparkles,
  Users,
  Flame,
  Heart,
  Star,
  Shield,
  Crown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AMAZON_LINK } from "@/lib/data";
import { useLocale } from "@/contexts/LocaleContext";

// ========== VOTE BUTTON ==========
function VoteButton({
  submissionId,
  currentVote,
  voteCount,
  isAuthenticated,
}: {
  submissionId: number;
  currentVote: number | undefined;
  voteCount: number;
  isAuthenticated: boolean;
}) {
  const utils = trpc.useUtils();
  const voteMutation = trpc.vote.cast.useMutation({
    onSuccess: () => {
      utils.submission.list.invalidate();
    },
  });

  const handleVote = (value: 1 | -1) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    voteMutation.mutate({ submissionId, value });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote(1)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 font-bold text-sm transition-all ${
          currentVote === 1
            ? "bg-[#32CD32] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
            : "bg-white text-[#666] border-[#ddd] hover:border-[#32CD32] hover:text-[#32CD32]"
        }`}
        disabled={voteMutation.isPending}
      >
        <ThumbsUp size={14} />
      </button>
      <span className={`font-display text-lg min-w-[2rem] text-center ${
        voteCount > 0 ? "text-[#32CD32]" : voteCount < 0 ? "text-[#FF4444]" : "text-[#999]"
      }`}>
        {voteCount}
      </span>
      <button
        onClick={() => handleVote(-1)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 font-bold text-sm transition-all ${
          currentVote === -1
            ? "bg-[#FF4444] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
            : "bg-white text-[#666] border-[#ddd] hover:border-[#FF4444] hover:text-[#FF4444]"
        }`}
        disabled={voteMutation.isPending}
      >
        <ThumbsDown size={14} />
      </button>
    </div>
  );
}

// ========== SUBMISSION CARD ==========
function SubmissionCard({
  item,
  userVote,
  isAuthenticated,
}: {
  item: any;
  userVote: number | undefined;
  isAuthenticated: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const riskColors = ["", "bg-[#32CD32]", "bg-[#FFE500]", "bg-[#FF4444]"];
  const riskLabels = ["", "Mild", "Moderate", "Nuclear"];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{item.countryFlag}</span>
            <div>
              <h3 className="font-bold text-[#1a1a1a] text-sm">{item.countryName}</h3>
              {item.phraseType && (
                <span className="text-xs text-[#999] font-semibold">{item.phraseType}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${riskColors[item.riskLevel]} px-2 py-0.5 rounded-full text-xs font-bold border border-[#1a1a1a]`}>
              {riskLabels[item.riskLevel]}
            </span>
          </div>
        </div>

        {/* Phrase */}
        <div className="bg-[#FFF8E1] rounded-lg p-3 border-2 border-[#FFE500] mb-3">
          <p className="font-display text-xl text-[#1a1a1a]">{item.phrase}</p>
          {item.ipa && (
            <p className="text-sm text-[#666] font-mono mt-1">[{item.ipa}]</p>
          )}
        </div>

        {/* Literal translation */}
        {item.literal && (
          <p className="text-sm text-[#666] mb-2">
            <span className="font-semibold">Literal:</span> {item.literal}
          </p>
        )}

        {/* Expandable details */}
        {item.feelsLike && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-[#FF1493] font-bold hover:underline"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Less" : "More details"}
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm text-[#444] mt-2 italic">"{item.feelsLike}"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Footer: votes + author */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#eee]">
          <VoteButton
            submissionId={item.id}
            currentVote={userVote}
            voteCount={item.voteCount}
            isAuthenticated={isAuthenticated}
          />
          <div className="text-xs text-[#999]">
            by <span className="font-semibold">{item.userName || "Anonymous"}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========== SUBMIT FORM ==========
function SubmitForm({ onClose }: { onClose: () => void }) {
  const { locale } = useLocale();
  const isZhTw = locale === "zh-tw";
  const [form, setForm] = useState({
    countryName: "",
    countryFlag: "🏳️",
    phrase: "",
    ipa: "",
    literal: "",
    feelsLike: "",
    phraseType: "National Classic",
    langCode: "",
    riskLevel: 2,
  });

  const utils = trpc.useUtils();
  const createMutation = trpc.submission.create.useMutation({
    onSuccess: () => {
      utils.submission.list.invalidate();
      onClose();
    },
  });

  const phraseTypes = [
    "National Classic",
    "Nuclear Option",
    "Everyday Annoyance",
    "Creative Genius",
    "Workplace Whisper",
    "Traffic Rage",
    "Sports Fury",
    "Romantic Betrayal",
    "Family Feud",
    "Internet Slang",
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-xl border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl text-[#1a1a1a]">
              {isZhTw ? <>投稿<span className="text-[#FF1493]">片語</span></> : <>Submit a <span className="text-[#FF1493]">Phrase</span></>}
            </h2>
            <button onClick={onClose} className="text-[#999] hover:text-[#1a1a1a]">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Country */}
            <div className="grid grid-cols-[1fr_80px] gap-3">
              <div>
                <label className="block text-sm font-bold text-[#1a1a1a] mb-1">{isZhTw ? "國家 *" : "Country *"}</label>
                <input
                  type="text"
                  value={form.countryName}
                  onChange={(e) => setForm({ ...form, countryName: e.target.value })}
                  placeholder={isZhTw ? "例如：日本" : "e.g. Japan"}
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#ddd] focus:border-[#FF1493] outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1a1a1a] mb-1">{isZhTw ? "國旗" : "Flag"}</label>
                <input
                  type="text"
                  value={form.countryFlag}
                  onChange={(e) => setForm({ ...form, countryFlag: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#ddd] focus:border-[#FF1493] outline-none text-center text-xl"
                />
              </div>
            </div>

            {/* Phrase */}
            <div>
              <label className="block text-sm font-bold text-[#1a1a1a] mb-1">{isZhTw ? "髒話片語 *" : "Swear Phrase *"}</label>
              <input
                type="text"
                value={form.phrase}
                onChange={(e) => setForm({ ...form, phrase: e.target.value })}
                placeholder={isZhTw ? "例如：Kuso kurae" : "e.g. Kuso kurae"}
                className="w-full px-3 py-2 rounded-lg border-2 border-[#ddd] focus:border-[#FF1493] outline-none text-sm"
              />
            </div>

            {/* IPA + Lang Code */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-[#1a1a1a] mb-1">{isZhTw ? "IPA 發音" : "IPA Pronunciation"}</label>
                <input
                  type="text"
                  value={form.ipa}
                  onChange={(e) => setForm({ ...form, ipa: e.target.value })}
                  placeholder="e.g. kɯ.so kɯ.ɾa.e"
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#ddd] focus:border-[#FF1493] outline-none text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1a1a1a] mb-1">{isZhTw ? "語言代碼" : "Language Code"}</label>
                <input
                  type="text"
                  value={form.langCode}
                  onChange={(e) => setForm({ ...form, langCode: e.target.value })}
                  placeholder="e.g. ja"
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#ddd] focus:border-[#FF1493] outline-none text-sm"
                />
              </div>
            </div>

            {/* Literal */}
            <div>
              <label className="block text-sm font-bold text-[#1a1a1a] mb-1">{isZhTw ? "字面翻譯" : "Literal Translation"}</label>
              <input
                type="text"
                value={form.literal}
                onChange={(e) => setForm({ ...form, literal: e.target.value })}
                placeholder={isZhTw ? "例如：吃屎" : "e.g. Eat sh*t"}
                className="w-full px-3 py-2 rounded-lg border-2 border-[#ddd] focus:border-[#FF1493] outline-none text-sm"
              />
            </div>

            {/* Feels Like */}
            <div>
              <label className="block text-sm font-bold text-[#1a1a1a] mb-1">{isZhTw ? "使用情境（文化背景）" : "Feels Like (cultural context)"}</label>
              <textarea
                value={form.feelsLike}
                onChange={(e) => setForm({ ...form, feelsLike: e.target.value })}
                placeholder={isZhTw ? "描述這個片語的使用時機和方式..." : "Describe when and how this phrase is used..."}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border-2 border-[#ddd] focus:border-[#FF1493] outline-none text-sm resize-none"
              />
            </div>

            {/* Type + Risk */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-[#1a1a1a] mb-1">{isZhTw ? "分類" : "Category"}</label>
                <select
                  value={form.phraseType}
                  onChange={(e) => setForm({ ...form, phraseType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#ddd] focus:border-[#FF1493] outline-none text-sm bg-white"
                >
                  {phraseTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1a1a1a] mb-1">{isZhTw ? "風險等級" : "Risk Level"}</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3].map((level) => (
                    <button
                      key={level}
                      onClick={() => setForm({ ...form, riskLevel: level })}
                      className={`flex-1 py-2 rounded-lg border-2 font-bold text-sm transition-all ${
                        form.riskLevel === level
                          ? level === 1
                            ? "bg-[#32CD32] text-white border-[#1a1a1a]"
                            : level === 2
                            ? "bg-[#FFE500] text-[#1a1a1a] border-[#1a1a1a]"
                            : "bg-[#FF4444] text-white border-[#1a1a1a]"
                          : "bg-white text-[#999] border-[#ddd]"
                      }`}
                    >
                      {"🔥".repeat(level)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.countryName || !form.phrase || createMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-[#FF1493] text-white px-6 py-3 rounded-lg font-bold text-base border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {createMutation.isPending ? (isZhTw ? "提交中..." : "Submitting...") : (isZhTw ? "投稿片語" : "Submit Phrase")}
            </button>

            {createMutation.error && (
              <p className="text-sm text-[#FF4444] flex items-center gap-1">
                <AlertCircle size={14} /> {createMutation.error.message}
              </p>
            )}
            {createMutation.isSuccess && (
              <p className="text-sm text-[#32CD32] flex items-center gap-1">
                <CheckCircle size={14} /> {isZhTw ? "已提交！你的片語將會被審核。" : "Submitted! Your phrase will be reviewed."}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ========== BOOK CODE REDEEM ==========
function BookCodeRedeem({ onSuccess }: { onSuccess: () => void }) {
  const { locale } = useLocale();
  const isZhTw = locale === "zh-tw";
  const [code, setCode] = useState("");
  const redeemMutation = trpc.bookCode.redeem.useMutation({
    onSuccess: () => {
      onSuccess();
    },
  });

  return (
    <div className="bg-[#FFF8E1] rounded-xl border-3 border-[#FFE500] p-6">
      <div className="flex items-start gap-3 mb-4">
        <Crown size={24} className="text-[#FF1493] shrink-0 mt-1" />
        <div>
          <h3 className="font-bold text-[#1a1a1a] mb-1">
            {isZhTw ? "升級為購書會員" : "Upgrade to Book Owner"}
          </h3>
          <p className="text-sm text-[#666]">
            {isZhTw
              ? "輸入書中的啟用碼，解鎖投稿權限和更多獨家功能。"
              : "Enter your book code to unlock submission access and more exclusive features."}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={isZhTw ? "輸入書籍啟用碼" : "Enter book code"}
          className="flex-1 px-3 py-2 rounded-lg border-2 border-[#ddd] focus:border-[#FF1493] outline-none text-sm font-mono uppercase tracking-wider"
          maxLength={32}
        />
        <button
          onClick={() => redeemMutation.mutate({ code })}
          disabled={!code || redeemMutation.isPending}
          className="px-4 py-2 bg-[#FF1493] text-white rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
        >
          {redeemMutation.isPending ? "..." : (isZhTw ? "兌換" : "Redeem")}
        </button>
      </div>
      {redeemMutation.error && (
        <p className="text-sm text-[#FF4444] mt-2 flex items-center gap-1">
          <AlertCircle size={14} /> {redeemMutation.error.message}
        </p>
      )}
      {redeemMutation.isSuccess && (
        <p className="text-sm text-[#32CD32] mt-2 flex items-center gap-1">
          <CheckCircle size={14} /> {isZhTw ? "啟用碼已兌換！你現在可以投稿片語了。" : "Code redeemed! You can now submit phrases."}
        </p>
      )}
      <p className="text-xs text-[#999] mt-3">
        {isZhTw ? "還沒有書？" : "Don't have a book?"}{" "}
        <a href={AMAZON_LINK} target="_blank" rel="noopener noreferrer" className="text-[#FF1493] font-bold hover:underline">
          {isZhTw ? "在 Amazon 購買" : "Get it on Amazon"}
        </a>
      </p>
    </div>
  );
}

// ========== LEADERBOARD ==========
function Leaderboard() {
  const { locale } = useLocale();
  const isZhTw = locale === "zh-tw";
  const { data } = trpc.dashboard.leaderboard.useQuery({ limit: 5 });

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5">
      <h3 className="font-display text-lg text-[#1a1a1a] mb-3 flex items-center gap-2">
        <Trophy size={20} className="text-[#FFE500]" /> {isZhTw ? "貢獻排行榜" : "Top Contributors"}
      </h3>
      <div className="space-y-2">
        {data.map((c: any, i: number) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-[#eee] last:border-0">
            <span className={`font-display text-lg w-6 text-center ${
              i === 0 ? "text-[#FFE500]" : i === 1 ? "text-[#C0C0C0]" : i === 2 ? "text-[#CD7F32]" : "text-[#999]"
            }`}>
              {i + 1}
            </span>
            <span className="font-semibold text-sm text-[#1a1a1a] flex-1">
              {c.displayName || "Anonymous"}
            </span>
            <span className="text-xs text-[#999]">{c.submissionCount} {isZhTw ? "個片語" : "phrases"}</span>
            <span className="text-xs font-bold text-[#32CD32]">+{Number(c.totalVotes)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== MAIN COMMUNITY PAGE ==========
export default function CommunityPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { locale } = useLocale();
  const isZhTw = locale === "zh-tw";
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isLoading, refetch } = trpc.submission.list.useQuery({
    status: "approved",
    limit: 20,
    offset: page * 20,
  });

  useEffect(() => {
    document.title = isZhTw
      ? "社群 — 全球髒話文化指南"
      : "Community — How Every Country Swears";
  }, [isZhTw]);

  const isBookBuyer = user?.memberTier === "bookBuyer" || user?.role === "admin";

  return (
    <Layout>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#FF1493] via-[#FF69B4] to-[#FFE500] py-16">
        <div className="absolute inset-0 benday-dots opacity-20 pointer-events-none" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-4xl md:text-6xl text-white mb-3">
              {isZhTw ? <>全球髒話 <span className="text-[#1a1a1a]">社群</span></> : <>Community <span className="text-[#1a1a1a]">Swears</span></>}
            </h1>
            <p className="text-white/90 text-lg max-w-xl mx-auto mb-6">
              {isZhTw
                ? "投票選出最佳髒話，或投稿你自己的！免費帳號即可參與投票和互動。"
                : "Vote on the best swear phrases from around the world, or submit your own! Free accounts can vote and interact."}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-semibold">
                <Users size={16} /> {data?.total || 0} {isZhTw ? "個投稿" : "Submissions"}
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-semibold">
                <Flame size={16} /> {isZhTw ? "投票 & 排名" : "Vote & Rank"}
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-semibold">
                <Sparkles size={16} /> {isZhTw ? "投稿新片語" : "Submit New Phrases"}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FREE vs PAID TIER COMPARISON ===== */}
      {!authLoading && !isBookBuyer && (
        <section className="py-10 bg-[#FAFAFA] border-b-2 border-[#eee]">
          <div className="container max-w-4xl mx-auto">
            <h2 className="font-display text-2xl text-[#1a1a1a] text-center mb-6">
              {isZhTw ? "兩種參與方式" : "Two Ways to Participate"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Free Tier */}
              <div className="bg-white rounded-xl border-2 border-[#00BFFF] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#00BFFF]/10 flex items-center justify-center">
                    <Zap size={18} className="text-[#00BFFF]" />
                  </div>
                  <h3 className="font-bold text-lg text-[#1a1a1a]">{isZhTw ? "免費會員" : "Free Member"}</h3>
                  <span className="bg-[#00BFFF] text-white text-xs font-bold px-2 py-0.5 rounded-full">{isZhTw ? "免費" : "FREE"}</span>
                </div>
                <div className="space-y-2.5">
                  {(isZhTw ? [
                    "對片語投票（讚 / 倒讚）",
                    "瀏覽所有社群投稿",
                    "查看貢獻排行榜",
                    "為片語卡片評分",
                    "收聽 55 國的發音",
                  ] : [
                    "Vote on phrases (upvote / downvote)",
                    "Browse all community submissions",
                    "View contributor leaderboard",
                    "Rate phrase cards with stars",
                    "Listen to pronunciation for 55 countries",
                  ]).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[#444]">
                      <CheckCircle size={14} className="text-[#00BFFF] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                {!isAuthenticated && (
                  <a
                    href={getLoginUrl()}
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-[#00BFFF] text-white px-4 py-2.5 rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
                  >
                    <LogIn size={16} /> {isZhTw ? "免費註冊，立即參與" : "Sign Up Free — Start Now"}
                  </a>
                )}
                {isAuthenticated && (
                  <div className="mt-5 text-center text-sm text-[#32CD32] font-semibold flex items-center justify-center gap-1">
                    <CheckCircle size={14} /> {isZhTw ? "你已經是免費會員了！" : "You're already a free member!"}
                  </div>
                )}
              </div>

              {/* Book Owner Tier */}
              <div className="bg-white rounded-xl border-2 border-[#FFE500] p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#FFE500] text-[#1a1a1a] text-xs font-bold px-3 py-1 rounded-bl-lg">
                  {isZhTw ? "完整權限" : "FULL ACCESS"}
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#FFE500]/20 flex items-center justify-center">
                    <Crown size={18} className="text-[#FF1493]" />
                  </div>
                  <h3 className="font-bold text-lg text-[#1a1a1a]">{isZhTw ? "購書會員" : "Book Owner"}</h3>
                </div>
                <p className="text-xs text-[#999] mb-3">{isZhTw ? "包含免費會員所有權限，加上：" : "Everything in Free, plus:"}</p>
                <div className="space-y-2.5">
                  {(isZhTw ? [
                    "投稿你自己的髒話片語",
                    "解鎖 Part 8–11 獨家內容（45 國）",
                    "完整 1,000+ 片語發音",
                    "獲得積分、徽章和國家大使頭銜",
                    "優先取得未來語言版本",
                  ] : [
                    "Submit your own swear phrases",
                    "Unlock Part 8–11 exclusive content (45 countries)",
                    "Full 1,000+ phrase pronunciation",
                    "Earn points, badges, and Ambassador title",
                    "Priority access to future editions",
                  ]).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[#444]">
                      <Star size={14} className="text-[#FFE500] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <a
                  href={AMAZON_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 w-full flex items-center justify-center gap-2 bg-[#FFE500] text-[#1a1a1a] px-4 py-2.5 rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
                >
                  <BookOpen size={16} /> {isZhTw ? "購書解鎖完整權限" : "Get the Book to Unlock"}
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-12 md:py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            {/* Main Content */}
            <div>
              {/* Auth / Tier Status — Simplified */}
              {!authLoading && !isAuthenticated && (
                <div className="bg-[#F0F8FF] rounded-xl border-2 border-[#00BFFF] p-5 mb-6 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1a1a1a]">{isZhTw ? "登入即可投票和互動" : "Sign in to vote and interact"}</p>
                    <p className="text-sm text-[#666]">{isZhTw ? "免費帳號即可參與社群！" : "Free accounts get instant access to voting!"}</p>
                  </div>
                  <a
                    href={getLoginUrl()}
                    className="flex items-center gap-2 bg-[#00BFFF] text-white px-4 py-2 rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
                  >
                    <LogIn size={16} /> {isZhTw ? "登入" : "Sign In"}
                  </a>
                </div>
              )}

              {isAuthenticated && !isBookBuyer && (
                <div className="mb-6">
                  <BookCodeRedeem onSuccess={() => {
                    refetch();
                    window.location.reload();
                  }} />
                </div>
              )}

              {/* Submit button for book buyers */}
              {isBookBuyer && (
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#32CD32] text-white px-3 py-1 rounded-full text-xs font-bold border border-[#1a1a1a]">
                      📖 {isZhTw ? "購書會員" : "Book Owner"}
                    </span>
                    <span className="text-sm text-[#666]">{isZhTw ? "你可以投稿片語！" : "You can submit phrases!"}</span>
                  </div>
                  <button
                    onClick={() => setShowSubmitForm(true)}
                    className="flex items-center gap-2 bg-[#FF1493] text-white px-5 py-2.5 rounded-lg font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    <Send size={16} /> {isZhTw ? "投稿片語" : "Submit a Phrase"}
                  </button>
                </div>
              )}

              {/* Submissions List */}
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl border-3 border-[#eee] p-5 animate-pulse">
                      <div className="h-6 bg-[#eee] rounded w-1/3 mb-3" />
                      <div className="h-16 bg-[#eee] rounded mb-3" />
                      <div className="h-4 bg-[#eee] rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : data?.items.length === 0 ? (
                <div className="text-center py-16">
                  <Sparkles size={48} className="mx-auto text-[#FFE500] mb-4" />
                  <h3 className="font-display text-2xl text-[#1a1a1a] mb-2">{isZhTw ? "還沒有投稿！" : "No submissions yet!"}</h3>
                  <p className="text-[#666]">{isZhTw ? "成為第一個投稿你國家髒話的人。" : "Be the first to submit a swear phrase from your country."}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data?.items.map((item: any) => (
                    <SubmissionCard
                      key={item.id}
                      item={item}
                      userVote={data.userVotes[item.id]}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {data && data.total > 20 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="border-2 border-[#1a1a1a] font-bold"
                  >
                    {isZhTw ? "上一頁" : "Previous"}
                  </Button>
                  <span className="flex items-center px-4 text-sm font-semibold text-[#666]">
                    {isZhTw ? `第 ${page + 1} 頁，共 ${Math.ceil(data.total / 20)} 頁` : `Page ${page + 1} of ${Math.ceil(data.total / 20)}`}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={(page + 1) * 20 >= data.total}
                    className="border-2 border-[#1a1a1a] font-bold"
                  >
                    {isZhTw ? "下一頁" : "Next"}
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Leaderboard />

              {/* How it works — Updated with immediate value */}
              <div className="bg-white rounded-xl border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5">
                <h3 className="font-display text-lg text-[#1a1a1a] mb-3">{isZhTw ? "如何參與" : "How It Works"}</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-[#00BFFF] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <p className="text-sm text-[#666]"><span className="font-bold text-[#1a1a1a]">{isZhTw ? "免費註冊" : "Sign up free"}</span> — {isZhTw ? "立即可以投票和評分" : "Instantly vote and rate phrases"}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-[#32CD32] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <p className="text-sm text-[#666]"><span className="font-bold text-[#1a1a1a]">{isZhTw ? "探索和互動" : "Explore & interact"}</span> — {isZhTw ? "瀏覽投稿、查看排行榜" : "Browse submissions, check leaderboard"}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-[#FFE500] text-[#1a1a1a] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <p className="text-sm text-[#666]"><span className="font-bold text-[#1a1a1a]">{isZhTw ? "購書升級" : "Upgrade with book"}</span> — {isZhTw ? "解鎖投稿和獨家內容" : "Unlock submissions & exclusive content"}</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <a
                href={AMAZON_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#1a1a1a] rounded-xl border-3 border-[#FFE500] p-5 text-center no-underline hover:scale-[1.02] transition-transform"
              >
                <BookOpen size={32} className="mx-auto text-[#FFE500] mb-2" />
                <p className="font-display text-lg text-white mb-1">{isZhTw ? "購買完整版" : "Get the Full Edition"}</p>
                <p className="text-xs text-gray-400">{isZhTw ? "解鎖投稿權限 + 1,000 個片語" : "Unlock submissions + all 1,000 phrases"}</p>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Submit Form Modal */}
      <AnimatePresence>
        {showSubmitForm && (
          <SubmitForm onClose={() => setShowSubmitForm(false)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
