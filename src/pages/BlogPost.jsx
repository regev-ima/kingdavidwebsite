import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import DOMPurify from "dompurify";

const DEFAULT_OG_IMAGE =
  "https://media.base44.com/images/public/69ba8e801b8d893fdd14efd0/26ed85e1e_Logo-2025-03.png";
const SITE_URL = "https://kingdavid4u.co.il";

function buildDescription(post) {
  const raw = post?.excerpt || post?.content || "";
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export default function BlogPostPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", postId],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ id: postId });
      return posts[0];
    },
    enabled: !!postId,
  });

  const sanitizedContent = useMemo(
    () => ({ __html: post?.content ? DOMPurify.sanitize(post.content) : "" }),
    [post?.content],
  );

  const seo = useMemo(() => {
    if (!post) return null;
    const description = buildDescription(post);
    const canonical = `${SITE_URL}/BlogPost?id=${post.id}`;
    const image = post.image_url || DEFAULT_OG_IMAGE;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description,
      image,
      datePublished: post.created_date,
      dateModified: post.created_date,
      author: { "@type": "Organization", name: "קינג דיויד מזרנים" },
      publisher: {
        "@type": "Organization",
        name: "קינג דיויד מזרנים",
        logo: { "@type": "ImageObject", url: DEFAULT_OG_IMAGE },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      articleSection: post.category || undefined,
    };
    return { description, canonical, image, jsonLd };
  }, [post]);

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

  return (
    <div className="min-h-screen">
      {seo && (
        <Helmet>
          <title>{`${post.title} | בלוג קינג דיויד`}</title>
          <meta name="description" content={seo.description} />
          <link rel="canonical" href={seo.canonical} />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={seo.description} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={seo.canonical} />
          <meta property="og:image" content={seo.image} />
          <meta property="og:locale" content="he_IL" />
          <meta property="article:published_time" content={post.created_date} />
          {post.category && <meta property="article:section" content={post.category} />}
          <script type="application/ld+json">{JSON.stringify(seo.jsonLd)}</script>
        </Helmet>
      )}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link to="/Blog" className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-6 text-sm">
          <ArrowRight className="w-4 h-4" />
          חזרה לבלוג
        </Link>

        <div className="glass-card rounded-2xl p-8 md:p-12">
          {post.category && <Badge variant="secondary" className="mb-3">{post.category}</Badge>}

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{post.title}</h1>

          <p className="text-muted-foreground flex items-center gap-2 mb-8">
            <Calendar className="w-4 h-4" />
            {format(new Date(post.created_date), "dd/MM/yyyy")}
          </p>

          {post.image_url && (
            <div className="rounded-2xl overflow-hidden mb-8">
              <img src={post.image_url} alt={post.title} className="w-full h-64 md:h-96 object-cover" />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={sanitizedContent}
          />
        </div>
      </div>
    </div>
  );
}