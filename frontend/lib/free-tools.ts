/**
 * Free Tools — single source of truth for listing + dynamic tool pages.
 *
 * All copy is verbatim from artifacts/free-tools/copy.md.
 * Icons reference @phosphor-icons/react component names.
 */

/* ── Live tool type ── */
export interface FreeTool {
  slug: string;
  name: string;
  tagline: string;
  features: string[];
  /** Hero H1 on the tool page */
  heroH1: string;
  /** Hero subhead on the tool page */
  heroSubhead: string;
  /** "What it does" section body */
  whatItDoes: string;
  /** "How it works" — 3 steps, each with a title + body */
  howItWorks: { title: string; body: string }[];
  /** "What you get" — 3 items with title + body */
  whatYouGet: { title: string; body: string }[];
  /** FAQ — 4 Q&As */
  faq: { q: string; a: string }[];
  /** Meta description for the tool page */
  metaDescription: string;
}

/* ════════════════════════════════════════════════════════════
   6 Live Tools
   ════════════════════════════════════════════════════════════ */

export const liveTools: FreeTool[] = [
  {
    slug: "linkedin-ad-spy",
    name: "LinkedIn Ad Spy",
    tagline:
      "Pull every ad a competitor is running on LinkedIn and get an AI read on their strategy.",
    features: [
      "Live pull from the LinkedIn Ad Library",
      "Up to 10 active ads surfaced per search",
      "AI-generated breakdown of their ad strategy",
    ],
    heroH1: "See every LinkedIn ad your competitor is running",
    heroSubhead:
      "Type in a company name. We pull their active ads from the LinkedIn Ad Library and give you an AI breakdown of what their ad strategy looks like.",
    whatItDoes:
      "LinkedIn Ad Spy searches the LinkedIn Ad Library for a competitor\u2019s active campaigns and pulls up to 10 live ads in a single search. On top of the raw ads, you get an AI-generated summary that breaks down their messaging angles, creative patterns, and likely targeting approach. The whole thing takes about a minute.",
    howItWorks: [
      {
        title: "Type in a competitor\u2019s name.",
        body: "Just the company name. No LinkedIn URL needed for this one.",
      },
      {
        title: "We search the LinkedIn Ad Library.",
        body: "The tool pulls every active ad associated with that company, up to 10 results.",
      },
      {
        title: "You get the ads and a strategy breakdown.",
        body: "Each ad is displayed alongside an AI-generated summary that maps out the patterns across their campaigns.",
      },
    ],
    whatYouGet: [
      {
        title: "Live ad creative and copy.",
        body: "See exactly what your competitor is putting in front of their audience right now, not last quarter.",
      },
      {
        title: "Up to 10 ads per search.",
        body: "Enough to see patterns in messaging, format choices, and offer types without noise.",
      },
      {
        title: "AI strategy summary.",
        body: "A written breakdown covering their messaging themes, creative approach, and what it tells you about who they\u2019re targeting.",
      },
    ],
    faq: [
      {
        q: "How does this tool pull the ads?",
        a: "It searches the LinkedIn Ad Library, which is LinkedIn\u2019s public transparency feature for active advertisements. Any ad currently running on LinkedIn is visible there. We pull the data and organize it for you.",
      },
      {
        q: "Why is there a cap of 10 ads?",
        a: "Ten ads is the maximum the tool surfaces per search. For most companies, that covers their active campaign set. If a company is running more than 10 concurrent ads, the tool returns the first 10 results from the Ad Library.",
      },
      {
        q: "Do I need a LinkedIn account or connection to use this?",
        a: "No. The LinkedIn Ad Library is publicly accessible. You don\u2019t need to be logged in, connected, or have any relationship with the company you\u2019re searching.",
      },
      {
        q: "Is it okay to look at competitor ads this way?",
        a: "The LinkedIn Ad Library is a public transparency feature. Viewing ads listed there is no different from seeing them in your feed. How you use what you learn (for your own ad strategy, positioning research, pitch prep) is up to you.",
      },
    ],
    metaDescription:
      "See every LinkedIn ad your competitor is running right now, plus an AI strategy breakdown. Free, no account needed.",
  },
  {
    slug: "linkedin-post-spy",
    name: "LinkedIn Post Spy",
    tagline:
      "See what a competitor is posting on LinkedIn and how their content strategy holds together.",
    features: [
      "5 most recent posts pulled in real time",
      "Works with personal profiles and company pages",
      "AI-generated content strategy summary",
    ],
    heroH1: "Decode a competitor\u2019s LinkedIn content strategy",
    heroSubhead:
      "Paste a founder\u2019s profile or company page URL. We pull their 5 most recent posts and run an AI analysis on what their content strategy actually looks like.",
    whatItDoes:
      "LinkedIn Post Spy pulls the 5 most recent LinkedIn posts from any personal profile or company page you point it at. Then it runs an AI analysis that maps out the patterns: what topics they lean on, how they structure posts, what formats they favor, and what kind of engagement they\u2019re generating. You get a strategy read, not just a list of posts.",
    howItWorks: [
      {
        title: "Paste a LinkedIn profile or company page URL.",
        body: "Works with personal profiles (founders, execs) and company pages.",
      },
      {
        title: "We pull their 5 most recent posts.",
        body: "Content, format, and engagement data, captured live.",
      },
      {
        title: "You get the posts plus an AI strategy breakdown.",
        body: "The analysis covers themes, posting patterns, and what\u2019s working for them.",
      },
    ],
    whatYouGet: [
      {
        title: "Their 5 most recent LinkedIn posts.",
        body: "Full content, not summaries. See exactly what they published and how it performed.",
      },
      {
        title: "Personal profiles and company pages supported.",
        body: "Spy on a founder\u2019s thought leadership or a competitor\u2019s official company feed.",
      },
      {
        title: "AI content strategy analysis.",
        body: "A written summary covering recurring themes, post formats, engagement patterns, and what their content approach reveals about their positioning.",
      },
    ],
    faq: [
      {
        q: "How does this tool access someone\u2019s posts?",
        a: "It pulls publicly visible LinkedIn posts from the profile or company page you provide. Only posts that are set to public visibility are accessed.",
      },
      {
        q: "Why only 5 posts?",
        a: "Five recent posts give you a meaningful pattern without overwhelming the analysis. It\u2019s enough for the AI to identify recurring themes and strategy signals.",
      },
      {
        q: "Do I need to follow or be connected to the person?",
        a: "No. As long as their posts are set to public visibility, the tool can access them. No login, no connection required on your end.",
      },
      {
        q: "Is scraping LinkedIn posts legal?",
        a: "This tool accesses publicly visible post data. LinkedIn\u2019s public content has been the subject of legal rulings confirming that publicly available data can be accessed (see hiQ Labs v. LinkedIn, 2022). That said, how you use the insights you gather is your responsibility. We recommend using this for competitive research and strategy planning, not for reproducing someone\u2019s content.",
      },
    ],
    metaDescription:
      "Pull a competitor\u2019s 5 most recent LinkedIn posts and get an AI read on their content strategy. Free, no signup.",
  },
  {
    slug: "steal-competitor-leads",
    name: "Steal Competitor Leads",
    tagline:
      "Find the people already commenting on a competitor\u2019s posts. They\u2019re warm. They just don\u2019t know you yet.",
    features: [
      "Scans their 5 most recent LinkedIn posts",
      "Surfaces 1 engaged commenter per post",
      "Direct profile links so you can reach out today",
    ],
    heroH1: "Find warm leads from your competitor\u2019s audience",
    heroSubhead:
      "Paste a competitor\u2019s LinkedIn profile or company page. We surface the people commenting on their recent posts. These are leads already engaged with your market, just not with you yet.",
    whatItDoes:
      "This tool scans a competitor\u2019s last 5 LinkedIn posts and identifies people who commented on them. These commenters have already shown interest in your market by engaging with a competitor\u2019s content. You get direct links to their profiles so you can start a conversation. It\u2019s one of the fastest ways to find people who are already warmed up to what you sell.",
    howItWorks: [
      {
        title:
          "Paste a competitor\u2019s LinkedIn profile or company page URL.",
        body: "Their founder\u2019s personal page works just as well as the company page.",
      },
      {
        title: "We scan their 5 most recent posts for commenters.",
        body: "The tool pulls one engaged commenter per post.",
      },
      {
        title:
          "You get profile links to people who are already interested.",
        body: "Each result links directly to the commenter\u2019s LinkedIn profile, ready for outreach.",
      },
    ],
    whatYouGet: [
      {
        title: "Leads from your competitor\u2019s audience.",
        body: "People who are already spending time and attention on content in your space.",
      },
      {
        title: "1 commenter surfaced per post, across 5 posts.",
        body: "Up to 5 real people, each one actively engaged with your competitor\u2019s content.",
      },
      {
        title: "Direct LinkedIn profile links.",
        body: "Click through and start a conversation. No extra lookup needed.",
      },
    ],
    faq: [
      {
        q: "How does the tool find these leads?",
        a: "It reads the public comments on a competitor\u2019s most recent LinkedIn posts. When someone comments on a public post, that activity is visible. The tool collects and organizes those commenters for you.",
      },
      {
        q: "Why only 1 commenter per post?",
        a: "The tool surfaces one commenter per post to keep results focused and high-quality. Across 5 posts, that gives you up to 5 distinct leads, each from a different conversation.",
      },
      {
        q: "Do I need to be connected to the competitor?",
        a: "No. The tool works with publicly visible LinkedIn posts and comments. You don\u2019t need any connection to the competitor or their commenters.",
      },
      {
        q: "Can I use this data for outreach?",
        a: "The data comes from publicly visible LinkedIn activity. Using it to inform your outreach is standard practice in B2B sales. That said, how you contact these people (cold DM, connection request, email via a separate tool) and what you say is your responsibility. Be relevant, not spammy.",
      },
    ],
    metaDescription:
      "Surface people already engaging with your competitor\u2019s LinkedIn posts. Warmed-up leads, handed to you. Free.",
  },
  {
    slug: "find-lost-leads",
    name: "Find Lost Leads",
    tagline:
      "Resurface people who commented on your LinkedIn posts and never heard back from you.",
    features: [
      "Pulls your 5 most recent posts automatically",
      "Flags 1 unanswered commenter per post",
      "Direct profile links for quick follow-up",
    ],
    heroH1: "Recover leads hiding in your own LinkedIn posts",
    heroSubhead:
      "Paste your LinkedIn profile or company page. We find everyone who commented on your recent posts and never got a reply. These are people who raised their hand, and you missed them.",
    whatItDoes:
      "Find Lost Leads scans your own last 5 LinkedIn posts and surfaces the commenters who never got a response. Every unanswered comment is a missed opportunity: someone engaged with your content, signaled interest, and heard nothing back. This tool helps you close that loop quickly.",
    howItWorks: [
      {
        title: "Paste your own LinkedIn profile or company page URL.",
        body: "This one\u2019s about your content, not a competitor\u2019s.",
      },
      {
        title:
          "We scan your 5 most recent posts for unanswered comments.",
        body: "The tool flags one commenter per post who didn\u2019t get a reply.",
      },
      {
        title: "You get direct links to the people you missed.",
        body: "Each result is a profile link, ready for a late but genuine follow-up.",
      },
    ],
    whatYouGet: [
      {
        title:
          "A list of people who engaged with you and got no response.",
        body: "These are your warmest leads. They already know who you are.",
      },
      {
        title: "1 unanswered commenter per post, across 5 posts.",
        body: "Up to 5 people who showed real interest.",
      },
      {
        title: "Direct LinkedIn profile links.",
        body: "Reply to their comment, send a connection request, or start a DM. The context is already there.",
      },
    ],
    faq: [
      {
        q: "How does the tool know if someone got a reply?",
        a: "It checks whether a response was posted to the commenter\u2019s comment thread. If no reply exists from the post author, the commenter is flagged as unanswered.",
      },
      {
        q: "Can this miss some comments?",
        a: "The tool looks at your 5 most recent posts and surfaces 1 commenter per post. If a post has dozens of comments, it picks one. It won\u2019t catch every unanswered comment across your entire history.",
      },
      {
        q: "Does it work for company pages too?",
        a: "Yes. Paste a company page URL and it scans the company\u2019s recent posts the same way it handles personal profiles.",
      },
      {
        q: "Am I violating anyone\u2019s privacy by using this?",
        a: "No. You\u2019re looking at comments people left on your own public posts. The data is already on your own LinkedIn page. This tool just organizes what\u2019s already there so nothing falls through the cracks.",
      },
    ],
    metaDescription:
      "Resurface everyone who commented on your LinkedIn posts and never got a reply. Free, takes one minute.",
  },
  {
    slug: "competitor-engagement-spy",
    name: "Competitor Engagement Spy",
    tagline:
      "See whose posts your competitor is commenting on. That\u2019s who they\u2019re warming up before the pitch.",
    features: [
      "Up to 5 recent comments tracked (excludes their own posts)",
      "Reveals who they\u2019re building relationships with",
      "Direct links to each post author\u2019s profile",
    ],
    heroH1: "See who your competitor is warming up",
    heroSubhead:
      "Paste a competitor\u2019s LinkedIn profile. We show you the last 5 posts they\u2019ve commented on (not their own), so you can see exactly whose attention they\u2019re trying to earn.",
    whatItDoes:
      "Smart sellers and founders warm up prospects on LinkedIn by commenting on their posts before ever sending a pitch. Competitor Engagement Spy reveals that playbook. Drop in a competitor\u2019s profile and see the 5 most recent posts they\u2019ve engaged with, filtered to exclude their own content. You\u2019ll know who they\u2019re building relationships with and can decide whether to get there first.",
    howItWorks: [
      {
        title: "Paste a competitor\u2019s LinkedIn profile URL.",
        body: "The tool reads their recent commenting activity.",
      },
      {
        title:
          "We pull the last 5 posts they commented on (excluding their own).",
        body: "Only engagement on other people\u2019s content is tracked.",
      },
      {
        title:
          "You get links to the post authors they\u2019re targeting.",
        body: "Each result shows who your competitor is actively trying to build a relationship with.",
      },
    ],
    whatYouGet: [
      {
        title: "A window into their outbound strategy.",
        body: "See which accounts and people your competitor is investing their attention in before the sales conversation starts.",
      },
      {
        title: "Up to 5 posts they\u2019ve recently engaged with.",
        body: "Filtered to exclude self-promotion, so you only see genuine outreach signals.",
      },
      {
        title: "Direct links to each post author\u2019s profile.",
        body: "If your competitor is warming someone up, you now know about it.",
      },
    ],
    faq: [
      {
        q: "How does the tool track their comments?",
        a: "It reads the publicly visible commenting activity on a LinkedIn profile. When someone comments on a public post, that comment is visible on their activity feed. The tool collects those and filters out any comments on their own content.",
      },
      {
        q: "Why exclude comments on their own posts?",
        a: "Comments on their own posts are just community management. The valuable signal is where they\u2019re spending time on other people\u2019s content, which usually indicates sales prospecting or relationship building.",
      },
      {
        q: "Does the competitor get notified?",
        a: "No. This tool reads publicly visible LinkedIn activity. There\u2019s no interaction with the competitor\u2019s profile that would trigger a notification.",
      },
      {
        q: "Is monitoring a competitor\u2019s LinkedIn activity appropriate?",
        a: "Their commenting activity is publicly visible by default. Reviewing it is standard competitive intelligence, similar to reading their blog or watching their webinars. You\u2019re not accessing anything private.",
      },
    ],
    metaDescription:
      "See exactly whose posts your competitor is commenting on. Know who they\u2019re warming up. Free tool.",
  },
  {
    slug: "lead-journey-finder",
    name: "Lead Journey Finder",
    tagline:
      "See what your lead actually engages with on LinkedIn, so you can start a conversation that matters.",
    features: [
      "Up to 5 recent comments pulled from their activity",
      "Filters out self-engagement for a clean signal",
      "Direct links to the posts and authors they care about",
    ],
    heroH1:
      "Map what your lead cares about before reaching out",
    heroSubhead:
      "Paste a lead\u2019s LinkedIn profile. We show you the last 5 posts they commented on, so you can understand what they\u2019re engaged with and open with something relevant.",
    whatItDoes:
      "Before you send a cold message, know what your lead is already thinking about. Lead Journey Finder pulls a lead\u2019s recent LinkedIn commenting activity and shows you the posts they engaged with. You\u2019ll see what topics hold their attention, which voices they trust, and what problems they\u2019re actively working on. That\u2019s the difference between a generic opener and one that earns a reply.",
    howItWorks: [
      {
        title: "Paste your lead\u2019s LinkedIn profile URL.",
        body: "Any personal profile works.",
      },
      {
        title:
          "We pull the last 5 posts they commented on (excluding their own).",
        body: "Only engagement on other people\u2019s content is captured.",
      },
      {
        title: "You see what they\u2019re paying attention to.",
        body: "Each result links to the post and its author, giving you the context you need for a relevant first message.",
      },
    ],
    whatYouGet: [
      {
        title:
          "Real insight into what your lead cares about right now.",
        body: "Not their job title or company bio. What they\u2019re actually spending time reading and responding to.",
      },
      {
        title: "Up to 5 recent comments, filtered for signal.",
        body: "Self-engagement is excluded so you only see where their attention genuinely goes.",
      },
      {
        title: "Direct links to the posts and authors.",
        body: "Reference a specific post in your outreach. Mention someone they follow. Build an intro that feels natural.",
      },
    ],
    faq: [
      {
        q: "How does the tool find their commenting activity?",
        a: "It reads the publicly visible activity section of a LinkedIn profile, which shows posts a person has recently commented on. Only public activity is accessible.",
      },
      {
        q: "What if my lead hasn\u2019t commented on anything recently?",
        a: "The tool will return an empty result. Not everyone comments actively on LinkedIn. In that case, try a different research angle.",
      },
      {
        q: "Do I need to be connected to the lead?",
        a: "No. As long as their activity is set to public (which is LinkedIn\u2019s default), the tool works without any connection.",
      },
      {
        q: "Is it appropriate to use someone\u2019s LinkedIn activity in outreach?",
        a: "Referencing someone\u2019s publicly shared interests is common in professional sales. It shows you did your homework. Just be genuine about it. Don\u2019t pretend you stumbled onto their comment by accident. Be direct: \u201cI saw you commented on [topic] and thought this might be relevant.\u201d",
      },
    ],
    metaDescription:
      "See the last 5 posts your lead commented on. Build a warmer intro before you ever reach out. Free.",
  },
];

/* ── Lookup helper ── */
export function getToolBySlug(slug: string) {
  return liveTools.find((t) => t.slug === slug);
}
