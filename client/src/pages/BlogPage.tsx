import Layout from "@/components/Layout";
import { PenLine } from "lucide-react";
import { useEffect } from "react";

export default function BlogPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <section className="py-20 md:py-32">
        <div className="container text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#FFE500]/20 mb-6">
            <PenLine size={36} className="text-[#FF1493]" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl text-[#1a1a1a] mb-4">
            Blog
          </h1>
          <p className="text-[#666] text-lg max-w-lg mx-auto mb-8">
            Coming soon! We're working on in-depth articles about swearing culture
            around the world. Stay tuned for fascinating stories about global profanity.
          </p>
          <div className="bg-[#FAFAFA] rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] p-6 max-w-md mx-auto">
            <p className="text-sm text-[#444]">
              Upcoming topics include:
            </p>
            <ul className="text-sm text-[#666] mt-3 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF1493] shrink-0 mt-1.5" />
                Top 10 Funniest Swear Words in Europe
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FFE500] shrink-0 mt-1.5" />
                Why the Dutch Swear with Diseases
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00BFFF] shrink-0 mt-1.5" />
                The Science of Why Swearing Feels Good
              </li>
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
}
