import { Link } from 'react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { BlogLayout } from '@/components/landing/BlogLayout'

function formatDate(ts: number | null): string {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function Blog() {
  const posts = useQuery(api.blog.listPublished, {})

  return (
    <BlogLayout>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Blog</h1>
      <p className="mb-10 text-muted-foreground">
        Notes on webhook reliability and building Eventsnare.
      </p>

      {posts === undefined ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts yet. Check back soon.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {posts.map((post) => (
            <Link
              key={post._id}
              to={`/blog/${post.slug}`}
              className="group flex flex-col gap-3 rounded-xl border border-border p-5 transition-colors hover:border-foreground/30"
            >
              {post.coverImageUrl && (
                <img
                  src={post.coverImageUrl}
                  alt=""
                  className="aspect-[2/1] w-full rounded-lg object-cover"
                />
              )}
              <div className="flex flex-col gap-1.5">
                <h2 className="text-xl font-semibold tracking-tight transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                {post.publishedAt && (
                  <p className="text-xs text-muted-foreground">{formatDate(post.publishedAt)}</p>
                )}
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </BlogLayout>
  )
}
