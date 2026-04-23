import React, { useMemo, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Calendar, Clock, Share2, Facebook, MessageCircle, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import LeadInlineForm from "@/components/blog/LeadInlineForm";
import { useToast } from "@/components/ui/use-toast";

const DEFAULT_OG_IMAGE =
  "https://media.base44.com/images/public/69ba8e801b8d893fdd14efd0/26ed85e1e_Logo-2025-03.png";
const SITE_URL = "https://kingdavid4u.co.il";

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function readingTime(html) {
  if (!html) return 1;
  const words = stripHtml(html).split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function buildDescription(post) {
  return stripHtml(post?.excerpt || post?.content || "").slice(0, 160);
}

function postHref(post) {
  return post.slug ? `/blog/${encodeURIComponent(post.slug)}` : `/BlogPost?id=${post.id}`;
}

function ShareButtons({ url, title }) {
  const { toast } = useToast();
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "הקישור הועתק" });
    } catch {
      toast({ title: "לא הצלחנו להעתיק", variant: "destructive" });
    }
  };

  const btn = "w-10 h-10 rounded-full bg-card border border-border/60 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center text-foreground/70 hover:text-primary transition-all";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-foreground/60 flex items-center gap-1.5">
        <Share2 className="w-4 h-4" />
        שיתוף:
      </span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="שתף בפייסבוק"
      >
        <Facebook className="w-4 h-4" />
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="שתף בוואטסאפ"
      >
        <MessageCircle className="w-4 h-4" />
      </a>
      <button type="button" onClick={copyLink} className={btn} aria-label="העתק קישור">
        <LinkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

function RelatedCard({ post }) {
  return (
    <Link
      to={postHref(post)}
      className="group block rounded-2xl overflow-hidden bg-card border border-border/60 hover:border-primary/40 hover:shadow-lg transition-all"
    >
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
            <span className="text-4xl font-sans-hebrew text-primary/20">KD</span>
          </div>
        )}
      </div>
      <div className="p-5">
        {post.category && <Badge variant="secondary" className="text-xs mb-2">{post.category}</Badge>}
        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {post.title}
        </h4>
      </div>
    </Link>
  );
}

export default function BlogPostPage() {
  const { slug: slugParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const legacyId = searchParams.get("id");

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slugParam || legacyId],
    queryFn: async () => {
      if (slugParam) {
        const rows = await base44.entities.BlogPost.filter({ slug: decodeURIComponent(slugParam) });
        return rows[0] || null;
      }
      if (legacyId) {
        const rows = await base44.entities.BlogPost.filter({ id: legacyId });
        return rows[0] || null;
      }
      return null;
    },
    enabled: !!(slugParam || legacyId),
  });

  // Prefer the slug URL: if we arrived via ?id= but the post has a slug, swap the URL.
  useEffect(() => {
    if (legacyId && post?.slug) {
      navigate(`/blog/${encodeURIComponent(post.slug)}`, { replace: true });
    }
  }, [legacyId, post?.slug, navigate]);

  const { data: allPosts } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => base44.entities.BlogPost.list("-created_date", 100),
    initialData: [],
    enabled: !!post,
  });

  const relatedPosts = useMemo(() => {
    if (!post || !allPosts.length) return [];
    const byCat = allPosts.filter((p) => p.id !== post.id && p.category === post.category);
    const rest = allPosts.filter((p) => p.id !== post.id && p.category !== post.category);
    return [...byCat, ...rest].slice(0, 3);
  }, [post, allPosts]);

  const sanitizedContent = useMemo(
    () => ({ __html: post?.content ? DOMPurify.sanitize(post.content) : "" }),
    [post?.content],
  );

  const canonicalSlug = post?.slug ? encodeURIComponent(post.slug) : null;
  const canonical = canonicalSlug ? `${SITE_URL}/blog/${canonicalSlug}` : post ? `${SITE_URL}/BlogPost?id=${post.id}` : null;

  const seo = useMemo(() => {
    if (!post) return null;
    const description = buildDescription(post);
    const image = post.image_url || DEFAULT_OG_IMAGE;
    const published = post.created_date;
    const articleJsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description,
      image,
      datePublished: published,
      dateModified: published,
      author: { "@type": "Organization", name: "קינג דיויד מזרנים" },
      publisher: {
        "@type": "Organization",
        name: "קינג דיויד מזרנים",
        logo: { "@type": "ImageObject", url: DEFAULT_OG_IMAGE },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      articleSection: post.category || undefined,
      wordCount: stripHtml(post.content).split(/\s+/).length,
      inLanguage: "he-IL",
    };
    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "בית", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "בלוג", item: `${SITE_URL}/Blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: canonical },
      ],
    };
    return { description, image, articleJsonLd, breadcrumbJsonLd };
  }, [post, canonical]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <Skeleton className="h-64 w-full rounded-2xl mb-8" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">המאמר לא נמצא</p>
          <Link to="/Blog"><Button>חזרה לבלוג</Button></Link>
        </div>
      </div>
    );
  }

  const mins = readingTime(post.content);

  return (
    <article className="min-h-screen">
      {seo && (
        <Helmet>
          <title>{`${post.title} | בלוג קינג דיויד`}</title>
          <meta name="description" content={seo.description} />
          <link rel="canonical" href={canonical} />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={seo.description} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={canonical} />
          <meta property="og:image" content={seo.image} />
          <meta property="og:locale" content="he_IL" />
          <meta property="article:published_time" content={post.created_date} />
          {post.category && <meta property="article:section" content={post.category} />}
          <script type="application/ld+json">{JSON.stringify(seo.articleJsonLd)}</script>
          <script type="application/ld+json">{JSON.stringify(seo.breadcrumbJsonLd)}</script>
        </Helmet>
      )}

      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <ol className="flex items-center gap-2 text-sm text-foreground/60">
          <li><Link to="/Home" className="hover:text-primary">בית</Link></li>
          <ChevronLeft className="w-3.5 h-3.5" />
          <li><Link to="/Blog" className="hover:text-primary">בלוג</Link></li>
          <ChevronLeft className="w-3.5 h-3.5" />
          <li className="text-foreground/90 line-clamp-1 max-w-[50vw]">{post.title}</li>
        </ol>
      </nav>

      {/* Header */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 pb-8 md:pb-12">
        {post.category && (
          <Link to="/Blog" className="inline-block">
            <Badge variant="secondary" className="mb-5 hover:bg-primary/10 transition-colors">
              {post.category}
            </Badge>
          </Link>
        )}
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight tracking-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground/60 pb-6 border-b border-border/40">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <time dateTime={post.created_date}>
              {format(new Date(post.created_date), "dd/MM/yyyy")}
            </time>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {mins} דקות קריאה
          </span>
          <span className="text-foreground/40">·</span>
          <span>מאת צוות קינג דיויד</span>
        </div>
      </header>

      {/* Featured image */}
      {post.image_url && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-10 md:mb-14">
          <div className="rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[21/9]">
            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Article body — no card, constrained prose width */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div
          className="prose prose-lg md:prose-xl max-w-none prose-headings:text-foreground prose-headings:font-bold prose-strong:text-foreground prose-a:text-primary prose-a:font-medium prose-img:rounded-2xl prose-img:w-full prose-img:mx-auto text-foreground/90 leading-relaxed blog-content"
          dangerouslySetInnerHTML={sanitizedContent}
        />
      </div>

      {/* Share + back */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-12 md:mt-16 flex flex-wrap items-center justify-between gap-4 pb-10 border-b border-border/40">
        <ShareButtons url={canonical} title={post.title} />
        <Link to="/Blog" className="inline-flex items-center gap-1 text-foreground/70 hover:text-primary text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          כל המאמרים
        </Link>
      </div>

      {/* Lead form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-12 md:mt-16">
        <LeadInlineForm postTitle={post.title} postSlug={post.slug} />
      </div>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-16 md:mt-24 pb-16">
          <div className="flex items-baseline justify-between mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">מאמרים נוספים</h2>
            <Link to="/Blog" className="text-primary text-sm font-medium hover:underline">
              לכל המאמרים
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rp) => (
              <RelatedCard key={rp.id} post={rp} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
