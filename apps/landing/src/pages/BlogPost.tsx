import { Link, useParams } from 'react-router'
import { useQuery } from 'convex/react'
import ReactMarkdown from 'react-markdown'
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

const proseClass = [
  'max-w-none text-foreground/90',
  '[&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight',
  '[&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight',
  '[&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold',
  '[&_p]:my-4 [&_p]:leading-7',
  '[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_li]:my-1',
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm',
  '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_img]:my-6 [&_img]:rounded-lg',
].join(' ')

export function BlogPost() {
  const { id } = useParams<{ id: string }>()
  const post = useQuery(api.blog.getPublishedBySlug, id ? { slug: id } : 'skip')

  if (post === undefined) {
    return (
      <BlogLayout>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </BlogLayout>
    )
  }

  if (post === null) {
    return (
      <BlogLayout>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight">Post not found</h1>
        <Link to="/blog" className="text-sm text-primary underline underline-offset-2">
          Back to blog
        </Link>
      </BlogLayout>
    )
  }

  return (
    <BlogLayout>
      <article className="flex flex-col gap-6">
        <Link
          to="/blog"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to blog
        </Link>
        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt=""
            className="aspect-[2/1] w-full rounded-xl object-cover"
          />
        )}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
          {post.publishedAt && (
            <p className="text-sm text-muted-foreground">{formatDate(post.publishedAt)}</p>
          )}
        </div>
        <div className={proseClass}>
          <ReactMarkdown>{post.contentMarkdown}</ReactMarkdown>
        </div>
      </article>
    </BlogLayout>
  )
}
