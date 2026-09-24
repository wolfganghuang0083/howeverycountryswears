import { useState, FormEvent } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { trackNewsletterSubscribeSubmit } from "@/lib/analytics";
// newsletter_confirm is reserved — do not fire until confirm-mail ships (see analytics.ts)

type Props = {
  sourcePath: string;
  country?: string;
  locale?: string;
  /** Hide on zh-tw (EN-first Preview). Default true. */
  enabled?: boolean;
};

/**
 * CRM Preview newsletter box. Saves email via tRPC; no confirmation email yet.
 */
export default function NewsletterSubscribe({
  sourcePath,
  country,
  locale = "en",
  enabled = true,
}: Props) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      trackNewsletterSubscribeSubmit({
        country,
        locale,
        source_path: sourcePath,
      });
      setDone(true);
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  if (!enabled) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate({
      email: email.trim(),
      country,
      locale,
      sourcePath,
    });
  };

  return (
    <section
      className="py-10 border-t border-gray-200"
      aria-label="Newsletter subscribe"
    >
      <div className="container">
        <div className="max-w-xl mx-auto rounded-xl border-2 border-[#1a1a1a] bg-white shadow-[4px_4px_0px_#1a1a1a] p-6 md:p-8">
          {done ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-3 text-[#FF1493]" size={36} />
              <h3 className="font-display text-2xl text-[#1a1a1a] mb-2">
                Thanks — you&apos;re on the list
              </h3>
              <p className="text-sm text-[#555] leading-relaxed">
                Your address is saved. We&apos;ll email a confirm link when sending is enabled.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 mb-4">
                <div className="shrink-0 rounded-full bg-[#FFE500] border-2 border-[#1a1a1a] p-2 shadow-[2px_2px_0px_#1a1a1a]">
                  <Mail size={18} className="text-[#1a1a1a]" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-[#1a1a1a] mb-1">
                    Get recognition notes by email
                  </h3>
                  <p className="text-sm text-[#555] leading-relaxed">
                    We&apos;ll email a confirm link when sending is enabled — your address is saved now.
                  </p>
                </div>
              </div>
              <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
                <label htmlFor="hecs-newsletter-email" className="sr-only">
                  Email
                </label>
                <input
                  id="hecs-newsletter-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={mutation.isPending}
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-lg border-2 border-[#1a1a1a] bg-[#FAFAFA] text-[#1a1a1a] text-sm font-medium shadow-[2px_2px_0px_#1a1a1a] focus:outline-none focus:bg-white focus:shadow-[1px_1px_0px_#1a1a1a] focus:translate-x-[1px] focus:translate-y-[1px]"
                />
                <button
                  type="submit"
                  disabled={mutation.isPending || !email.trim()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-[#FF1493] text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>
              {error ? (
                <p className="mt-3 text-sm text-red-600 font-medium" role="alert">
                  {error}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
