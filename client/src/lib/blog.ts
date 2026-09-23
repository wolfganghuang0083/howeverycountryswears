import posts from "@/data/blog-posts.json";

export type BlogFaq = { q: string; a: string };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  pill: string;
  date: string;
  lang: string;
  draft: boolean;
  countryLinks: string[];
  faq: BlogFaq[];
  html: string;
};

const allPosts = posts as BlogPost[];

/** Preview may render drafts; production sitemap should exclude them. */
export function getAllBlogPosts(opts?: { includeDrafts?: boolean }): BlogPost[] {
  const includeDrafts = opts?.includeDrafts ?? true;
  return allPosts.filter((p) => includeDrafts || !p.draft);
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return allPosts.find((p) => p.slug === slug);
}

export function getPublishedBlogPosts(): BlogPost[] {
  return getAllBlogPosts({ includeDrafts: false });
}
