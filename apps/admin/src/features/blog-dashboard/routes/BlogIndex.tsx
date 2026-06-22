import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery } from 'convex/react';
import { DataTable } from '@/components/DataTable';
import { LoadingState } from '@/components/LoadingState';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

function formatDate(ts: number | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function BlogIndex() {
  const posts = useQuery(api.blog.listAll);
  const deletePost = useMutation(api.blog.deletePost);
  const navigate = useNavigate();
  const [pending, setPending] = useState<string | null>(null);

  const handleDelete = async (postId: Id<'blogPosts'>, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setPending(postId);
    try {
      await deletePost({ postId });
    } finally {
      setPending(null);
    }
  };

  if (posts === undefined) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
        <button
          type="button"
          onClick={() => navigate('/blog/new')}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          New post
        </button>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts yet.</p>
      ) : (
        <DataTable
          columns={[
            { label: 'Title' },
            { label: 'Status' },
            { label: 'Published' },
            { label: 'Actions', align: 'right' },
          ]}
        >
          {posts.map((post) => (
                <tr key={post._id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{post.title}</p>
                    <p className="truncate text-xs text-muted-foreground">/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    {post.status === 'published' ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-900">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(post.publishedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/blog/${post._id}`}
                        className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete(post._id, post.title)}
                        disabled={pending === post._id}
                        className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-destructive hover:bg-muted disabled:opacity-60"
                      >
                        {pending === post._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
        </DataTable>
      )}
    </div>
  );
}
