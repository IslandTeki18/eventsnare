import { Link } from 'react-router'
import { Newspaper } from 'lucide-react'
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
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-muted-foreground">
            <Newspaper className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold tracking-tight">No posts yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              We are working on writing about webhook reliability and building Eventsnare. Check
              back soon.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Back to home
          </Link>
        </div>
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
