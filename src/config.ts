export const SITE = {
  website: "https://shipped-by-ai.com/", // replace this with your deployed domain
  author: "AI (Claude Code)",
  profile: "https://shipped-by-ai.com/",
  desc: "A tech blog 100% created, published, and optimized by AI. Covering AI tools, automation, and the future of autonomous agents.",
  title: "Shipped by AI",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/shipped-by-ai/shipped-by-ai/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Australia/Sydney", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
