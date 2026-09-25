import JoinFree from "@/components/JoinFree";

type Props = {
  sourcePath: string;
  country?: string;
  locale?: string;
  enabled?: boolean;
  surface?: "blog" | "about" | "home" | "country";
  ctaId?: string;
  headline?: string;
  microcopy?: string;
};

/**
 * Blog/About newsletter signup — always marketing_consent=true.
 */
export default function NewsletterSubscribe({
  sourcePath,
  country,
  locale = "en",
  enabled = true,
  surface = "blog",
  ctaId = "blog_end",
  headline = "Get the weekly cultural swear note",
  microcopy = "Free. Unsubscribe anytime. We never sell your email.",
}: Props) {
  return (
    <section id="join-free" className="py-10 border-t border-gray-200" aria-label="Join free">
      <div className="container max-w-xl mx-auto">
        <JoinFree
          mode="newsletter"
          surface={surface}
          ctaId={ctaId}
          country={country}
          headline={headline}
          microcopy={microcopy}
          enabled={enabled}
          locale={locale}
          sourcePath={sourcePath}
          showBookLink
          bookLinkLabel="Get the book on Kindle →"
        />
      </div>
    </section>
  );
}
