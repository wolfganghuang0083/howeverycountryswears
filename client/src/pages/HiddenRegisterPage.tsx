import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { BookOpen, CheckCircle, LogIn, ShieldCheck, Gift, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const BOOK_COVER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663213089248/DxiapP3ZDvXs6SvszhZhBd/Swear-Book-Cover-PopArt-V2-eBook_52a815e1.webp";

export default function HiddenRegisterPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [bookCode, setBookCode] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const redeemMutation = trpc.bookCode.redeem.useMutation({
    onSuccess: () => {
      setRedeemStatus("success");
      setBookCode("");
      // Refresh user data after successful redemption
      window.location.reload();
    },
    onError: (err) => {
      setRedeemStatus("error");
      setErrorMsg(err.message || "Invalid or already used code. Please try again.");
    },
  });

  // Set noindex meta tag
  useEffect(() => {
    document.title = "Activate Your Book — How Every Country Swears";

    // Add noindex, nofollow meta tag
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.name = "robots";
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = "noindex, nofollow";

    return () => {
      document.title = "How Every Country Swears \u2014 1,000 Phrases, 100 Countries";
      // Restore default robots
      if (metaRobots) {
        metaRobots.content = "index, follow";
      }
    };
  }, []);

  const handleRedeem = () => {
    if (!bookCode.trim()) return;
    setRedeemStatus("idle");
    setErrorMsg("");
    redeemMutation.mutate({ code: bookCode.trim() });
  };

  const isBookBuyer = user?.memberTier === "bookBuyer" || user?.role === "admin";

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <img
              src={BOOK_COVER}
              alt="Book Cover"
              className="w-32 mx-auto mb-6 rounded-lg border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
            />
            <h1 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-2">
              Activate Your Book
            </h1>
            <p className="text-gray-500">
              Enter the code from your book to unlock all premium features
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-xl border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-8">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-10 h-10 border-4 border-[#FF1493] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : !isAuthenticated ? (
              /* Step 1: Not logged in */
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFF8E1] flex items-center justify-center border-2 border-[#FFE500]">
                  <LogIn size={28} className="text-[#FF1493]" />
                </div>
                <h2 className="font-display text-xl text-[#1a1a1a] mb-2">Step 1: Sign In</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Create a free account or sign in to activate your book code.
                </p>
                <a
                  href={getLoginUrl()}
                  className="inline-flex items-center gap-2 bg-[#FF1493] text-white px-8 py-3 rounded-xl font-bold text-base border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
                >
                  <LogIn size={20} />
                  Sign In / Create Account
                </a>
              </div>
            ) : isBookBuyer ? (
              /* Already activated */
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-400">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="font-display text-xl text-[#1a1a1a] mb-2">Already Activated!</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Your account already has Book Owner access. Enjoy all premium features!
                </p>
                <div className="space-y-3">
                  <a href="/" className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#FFE500] text-[#1a1a1a] rounded-xl font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline">
                    <BookOpen size={18} />
                    Explore All Countries
                    <ArrowRight size={16} />
                  </a>
                  <a href="/community" className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white text-[#1a1a1a] rounded-xl font-bold text-sm border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline">
                    <Gift size={18} />
                    Join the Community
                  </a>
                </div>
              </div>
            ) : (
              /* Step 2: Enter book code */
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFF8E1] flex items-center justify-center border-2 border-[#FFE500]">
                    <ShieldCheck size={28} className="text-[#FF1493]" />
                  </div>
                  <h2 className="font-display text-xl text-[#1a1a1a] mb-2">Step 2: Enter Your Book Code</h2>
                  <p className="text-sm text-gray-500">
                    Find the activation code inside your book and enter it below.
                  </p>
                </div>

                {redeemStatus === "success" && (
                  <div className="mb-4 p-4 bg-green-50 border-2 border-green-400 rounded-lg text-center">
                    <CheckCircle size={24} className="text-green-600 mx-auto mb-2" />
                    <p className="text-green-700 font-bold">Code activated successfully!</p>
                    <p className="text-green-600 text-sm">Welcome to the Book Owners club!</p>
                  </div>
                )}

                {redeemStatus === "error" && (
                  <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg text-center">
                    <p className="text-red-600 font-bold text-sm">{errorMsg}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <input
                    type="text"
                    value={bookCode}
                    onChange={(e) => setBookCode(e.target.value.toUpperCase())}
                    placeholder="Enter your book code (e.g., SWEAR-XXXX-XXXX)"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center font-mono text-lg tracking-wider focus:border-[#FF1493] focus:outline-none transition-colors uppercase"
                    maxLength={30}
                    onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={!bookCode.trim() || redeemMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#FF1493] text-white rounded-xl font-bold text-base border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck size={20} />
                    {redeemMutation.isPending ? "Verifying..." : "Activate Book Code"}
                  </button>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-sm text-[#1a1a1a] mb-2">Where to find your code?</h4>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Check the first or last page of your book</li>
                    <li>• Look for a section titled "Online Access" or "Activation Code"</li>
                    <li>• Each code can only be used once</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Benefits reminder */}
          {!isBookBuyer && (
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400 mb-3">Book owners unlock:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["All 100 Countries", "1,000+ Pronunciations", "Submit Phrases", "Earn Badges"].map((b) => (
                  <span key={b} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
