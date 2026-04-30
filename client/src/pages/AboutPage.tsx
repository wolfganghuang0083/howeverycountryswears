import Layout from "@/components/Layout";
import { AMAZON_LINK } from "@/lib/data";
import { BookOpen, Mail, Globe, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

const ABOUT_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663213089248/DxiapP3ZDvXs6SvszhZhBd/about-hero-aXcjbqgunHb3GazVi67TiM.webp";
const BOOK_COVER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663213089248/DxiapP3ZDvXs6SvszhZhBd/Swear-Book-Cover-PopArt-V2-eBook_52a815e1.webp";

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${ABOUT_HERO})` }}
        />
        <div className="absolute inset-0 bg-white/85" />
        <div className="relative container py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-5xl md:text-7xl text-[#1a1a1a] mb-4">
              About
            </h1>
            <p className="text-xl text-[#444] leading-relaxed">
              The story behind the world's first interactive profanity encyclopedia.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Book */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex flex-col md:flex-row items-start gap-10 md:gap-16">
            <motion.img
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              src={BOOK_COVER}
              alt="How Every Country Swears"
              className="w-48 md:w-64 rounded-lg border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] shrink-0"
            />
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-4">
                The Book
              </h2>
              <div className="space-y-4 text-[#444] leading-relaxed">
                <p>
                  <strong>How Every Country Swears</strong> is a cultural guide to global profanity,
                  featuring 1,000 phrases from 100 countries. Each country includes 10 carefully
                  selected expressions with pronunciation guides, literal translations, cultural
                  context, and risk ratings.
                </p>
                <p>
                  This isn't just a list of bad words. It's an exploration of what different cultures
                  find taboo, funny, sacred, and offensive — and what that reveals about their values,
                  history, and social dynamics.
                </p>
                <p>
                  The book includes interactive pronunciation links for every phrase, connecting
                  directly to this website where you can hear how each expression sounds.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Globe, label: "100 Countries", color: "#FF1493" },
                  { icon: BookOpen, label: "1,000 Phrases", color: "#FFE500" },
                  { icon: Users, label: "11 Regions", color: "#00BFFF" },
                  { icon: Mail, label: "Interactive", color: "#32CD32" },
                ].map(({ icon: Icon, label, color }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]"
                  >
                    <Icon size={24} style={{ color }} />
                    <span className="text-xs font-bold text-[#1a1a1a] text-center">{label}</span>
                  </div>
                ))}
              </div>

              <a
                href={AMAZON_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-8 bg-[#FF1493] text-white px-6 py-3 rounded-lg font-bold border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
              >
                <BookOpen size={18} />
                Get the Book on Amazon
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Book Exists */}
      <section className="py-16 md:py-24 bg-[#FAFAFA]">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-8">
              Why This Book Exists
            </h2>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
                <h3 className="font-bold text-lg text-[#FF1493] mb-2">1. Self-Defense</h3>
                <p className="text-[#444] leading-relaxed">
                  When a taxi driver in Istanbul is muttering under his breath, or a vendor in Naples
                  is getting heated, wouldn't you like to know if you're being insulted? Knowledge is
                  power. Profane knowledge is <em>survival</em>.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#FFE500]">
                <h3 className="font-bold text-lg text-[#FF6600] mb-2">2. Cultural Understanding</h3>
                <p className="text-[#444] leading-relaxed">
                  A country's swear words reveal more about its culture than any museum or guidebook.
                  Germans have built compound insults around feces. The Dutch swear with diseases.
                  Australians turned the worst word in English into a term of endearment. These aren't
                  random — they're windows into what each culture fears, values, and finds taboo.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#00BFFF]">
                <h3 className="font-bold text-lg text-[#00BFFF] mb-2">3. Better Listening</h3>
                <p className="text-[#444] leading-relaxed">
                  Knowing local profanity can help you understand tone, conflict, humor, and social
                  boundaries. <strong>Recognition travels better than performance.</strong> Understanding
                  a word does not grant you social permission to use it.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#32CD32]">
                <h3 className="font-bold text-lg text-[#32CD32] mb-2">4. Because It's Fascinating</h3>
                <p className="text-[#444] leading-relaxed">
                  Come on. You picked up this book because the idea of learning 1,000 ways people
                  express frustration, affection, and contempt around the world sounds absolutely
                  delightful. We're not judging. We wrote the damn thing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Author */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] mb-6">
              About the Author
            </h2>
            <div className="bg-white p-6 md:p-8 rounded-xl border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
              <h3 className="font-display text-2xl text-[#FF1493] mb-3">Wolfgang Huang</h3>
              <p className="text-[#444] leading-relaxed mb-4">
                Wolfgang Huang is a writer, linguist, and cultural explorer with a passion for
                understanding how language reflects society. His work bridges the gap between
                academic linguistics and popular culture, making complex cultural phenomena
                accessible and entertaining.
              </p>
              <p className="text-[#444] leading-relaxed">
                <em>How Every Country Swears</em> is the culmination of extensive research into
                profanity across 100 countries, combining native speaker consultations, linguistic
                analysis, and cultural anthropology into a guide that's both educational and
                genuinely fun to read.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 md:py-24 bg-[#1a1a1a]">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-4xl text-white mb-4">
            Get in Touch
          </h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            For media inquiries, academic collaborations, or just to share your favorite
            swear word, reach out to us.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:contact@howeverycountryswears.com"
              className="flex items-center gap-2 bg-white text-[#1a1a1a] px-6 py-3 rounded-lg font-bold border-2 border-white shadow-[3px_3px_0px_#FF1493] hover:shadow-[1px_1px_0px_#FF1493] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
            >
              <Mail size={18} />
              Contact Us
            </a>
            <a
              href={AMAZON_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#FFE500] text-[#1a1a1a] px-6 py-3 rounded-lg font-bold border-2 border-white shadow-[3px_3px_0px_white] hover:shadow-[1px_1px_0px_white] hover:translate-x-[2px] hover:translate-y-[2px] transition-all no-underline"
            >
              <BookOpen size={18} />
              Get the Book
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
