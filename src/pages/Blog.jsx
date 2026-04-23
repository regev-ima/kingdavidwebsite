import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Search, Clock, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const SITE_URL = "https://kingdavid4u.co.il";

function readingTime(html) {
  if (!html) return 1;
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function postHref(post) {
  return post.slug ? `/blog/${encodeURIComponent(post.slug)}` : `/BlogPost?id=${post.id}`;
}

function FeaturedCard({ post }) {
  return (
    <Link
      to={postHref(post)}
      className="group block rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/10 hover:border-primary/30 transition-all duration-500"
    >
      <div className="grid md:grid-cols-2 gap-0">
        <div className="aspect-[4/3] md:aspect-auto overflow-hidden bg-primary/5">
          {post.image_url ? (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-6xl font-sans-hebrew text-primary/30">KD</span>
            </div>
          )}
        </div>
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4 text-xs text-foreground/60">
            {post.category && <Badge variant="secondary" className="text-xs">{post.category}</Badge>}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(post.created_date), "dd/MM/yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {readingTime(post.content)} דק' קריאה
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-foreground/70 line-clamp-3 leading-relaxed mb-5">{post.excerpt}</p>
          )}
          <span className="inline-flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
            המשך לקרוא <ArrowLeft className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ post, index }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link to={postHref(post)} className="group block h-full">
        <div className="h-full flex flex-col rounded-2xl overflow-hidden bg-card border border-border/60 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
          <div className="aspect-[16/10] overflow-hidden bg-primary/5">
            {post.image_url ? (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <span className="text-5xl font-sans-hebrew text-primary/20">KD</span>
              </div>
            )}
          </div>
          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-3 text-xs text-foreground/50">
              {post.category && <Badge variant="secondary" className="text-xs">{post.category}</Badge>}
              <span>·</span>
              <time dateTime={post.created_date}>
                {format(new Date(post.created_date), "dd/MM/yyyy")}
              </time>
              <span>·</span>
              <span>{readingTime(post.content)} דק'</span>
            </div>
            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-2 leading-snug line-clamp-2">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-foreground/60 text-sm line-clamp-3 leading-relaxed mb-4">{post.excerpt}</p>
            )}
            <span className="mt-auto inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
              קרא עוד <ArrowLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function Blog() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => base44.entities.BlogPost.list("-created_date", 100),
    initialData: [],
  });

  const [activeCategory, setActiveCategory] = useState("הכל");
  const [search, setSearch] = useState("");

  const categories = useMemo(() => {
    const set = new Set(posts.map((p) => p.category).filter(Boolean));
    return ["הכל", ...Array.from(set).sort()];
  }, [posts]);

  const filtered = useMemo(() => {
    let result = posts;
    if (activeCategory !== "הכל") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [posts, activeCategory, search]);

  const featured = !search && activeCategory === "הכל" ? filtered[0] : null;
  const rest = featured ? filtered.slice(1) : filtered;

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "הבלוג של קינג דיויד מזרנים",
    description: "טיפים, מאמרים ומידע שימושי על עולם השינה והמזרנים",
    url: `${SITE_URL}/Blog`,
    publisher: {
      "@type": "Organization",
      name: "קינג דיויד מזרנים",
    },
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>הבלוג שלנו | קינג דיויד מזרנים</title>
        <meta name="description" content="טיפים, מאמרים ומידע שימושי על עולם השינה, מזרנים אורטופדיים, מיטות נוער והיגיינת שינה — מהמומחים של קינג דיויד." />
        <link rel="canonical" href={`${SITE_URL}/Blog`} />
        <meta property="og:title" content="הבלוג שלנו | קינג דיויד מזרנים" />
        <meta property="og:description" content="טיפים, מאמרים ומידע שימושי על עולם השינה והמזרנים." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/Blog`} />
        <meta property="og:locale" content="he_IL" />
        <script type="application/ld+json">{JSON.stringify(blogJsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="py-16 md:py-20 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight">
            הבלוג שלנו
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            טיפים, מאמרים ומידע שימושי על עולם השינה, מזרנים אורטופדיים והיגיינת שינה — מהמומחים של קינג דיויד.
          </p>
        </div>
      </section>

      {/* Filters + search */}
      <section className="sticky top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border/40 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-foreground/70 hover:bg-primary/10 hover:text-primary border border-border/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <Input
              placeholder="חפש מאמר..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <Skeleton className="aspect-video" />
                  <div className="p-5 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-foreground/60 text-lg mb-2">לא נמצאו מאמרים</p>
              <button
                onClick={() => { setSearch(""); setActiveCategory("הכל"); }}
                className="text-primary font-medium hover:underline"
              >
                נקה סינון
              </button>
            </div>
          ) : (
            <>
              {featured && (
                <div className="mb-12 md:mb-16">
                  <FeaturedCard post={featured} />
                </div>
              )}
              <AnimatePresence mode="popLayout">
                <motion.div
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {rest.map((post, i) => (
                    <PostCard key={post.id} post={post} index={i} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
