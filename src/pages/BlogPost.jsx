import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import DOMPurify from "dompurify";

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