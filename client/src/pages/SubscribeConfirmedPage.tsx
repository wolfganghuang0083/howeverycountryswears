import { useEffect, useRef, useState } from "react";
import Layout from "@/components/Layout";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { trackNewsletterConfirm } from "@/lib/analytics";
import { Link } from "wouter";

function getTokenFromSearch(): string | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);
  return q.get("token");
}

function getVariantFromSearch(): "confirm" | "optin" {
  if (typeof window === "undefined") return "confirm";
  const q = new URLSearchParams(window.location.search);
  return q.get("variant") === "optin" ? "optin" : "confirm";
}

export default function SubscribeConfirmedPage() {
  const [token] = useState(() => getTokenFromSearch());
  const [variant] = useState(() => getVariantFromSearch());
  const fired = useRef(false);
  const [phase, setPhase] = useState<"loading" | "ok" | "invalid">("loading");

  const confirm = trpc.newsletter.confirm.useMutation({
    onSuccess: () => {
      setPhase("ok");
      if (!fired.current) {
        fired.current = true;
        trackNewsletterConfirm({ method: "email" });
      }
    },
    onError: () => setPhase("invalid"),
  });

  useEffect(() => {
    if (!token) {
      setPhase("invalid");
      return;
    }
    confirm.mutate({ token, variant });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, variant]);

  return (
    <Layout>
      <section className="py-20">
        <div className="container max-w-lg mx-auto text-center">
          {phase === "loading" && (
            <>
              <Loader2 className="mx-auto mb-4 animate-spin text-[#FF1493]" size={40} />
              <h1 className="font-display text-3xl text-[#1a1a1a] mb-2">Confirming…</h1>
              <p className="text-sm text-[#666]">One moment while we confirm your email.</p>
            </>
          )}
          {phase === "ok" && (
            <>
              <CheckCircle2 className="mx-auto mb-4 text-[#32CD32]" size={48} />
              <h1 className="font-display text-3xl text-[#1a1a1a] mb-2">
                {variant === "optin" ? "You're subscribed to the weekly" : "You're confirmed"}
              </h1>
              <p className="text-sm text-[#555] mb-6 leading-relaxed">
                {variant === "optin"
                  ? "Thanks — marketing consent is on and you're confirmed for Swear Word of the Week."
                  : "Thanks — you're on the list. When sending is enabled, you'll get Swear Word of the Week by email."}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-[#FF1493] text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] no-underline"
              >
                Explore countries
              </Link>
            </>
          )}
          {phase === "invalid" && (
            <>
              <XCircle className="mx-auto mb-4 text-[#FF1493]" size={48} />
              <h1 className="font-display text-3xl text-[#1a1a1a] mb-2">Link invalid or expired</h1>
              <p className="text-sm text-[#555] mb-6 leading-relaxed">
                This confirmation link is invalid, expired, or already used. You can join again from the homepage subscribe form.
              </p>
              <Link
                href="/#join-free"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-[#FFE500] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] no-underline"
              >
                Join free
              </Link>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
