import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { BlogForm } from '@/features/blog-dashboard/components/BlogForm';
import type { BlogFormValues } from '@/features/blog-dashboard/components/BlogForm';

const emptyValues: BlogFormValues = {
  title: '',
  slug: '',
  excerpt: '',
  contentMarkdown: '',
  status: 'draft',
};

export function BlogEditor() {
  const { postId } = useParams<{ postId: string }>();
  const isCreate = !postId || postId === 'new';
  const navigate = useNavigate();

  const createPost = useMutation(api.blog.createPost);
  const updatePost = useMutation(api.blog.updatePost);
  const generateCoverUploadUrl = useMutation(api.blog.generateCoverUploadUrl);
  const setCoverImage = useMutation(api.blog.setCoverImage);

  const post = useQuery(
    api.blog.getById,
    isCreate ? 'skip' : { postId: postId as Id<'blogPosts'> },
  );

  if (isCreate) {
    const handleCreate = async (values: BlogFormValues) => {
      const newId = await createPost({
        title: values.title,
        slug: values.slug,
        excerpt: values.excerpt || undefined,
        contentMarkdown: values.contentMarkdown,
        status: values.status,
      });
      navigate(`/blog/${newId}`);
    };

    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">New post</h1>
        <BlogForm
          initialValues={emptyValues}
          submitLabel="Create post"
          onSubmit={handleCreate}
        />
        <p className="text-xs text-muted-foreground">
          Save the post first to enable cover image upload.
        </p>
      </div>
    );
  }

  if (post === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (post === null) {
    return <p className="text-sm text-muted-foreground">Post not found, or access denied.</p>;
  }

  const id = post._id;

  const handleUpdate = async (values: BlogFormValues) => {
    await updatePost({
      postId: id,
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt || undefined,
      contentMarkdown: values.contentMarkdown,
      status: values.status,
    });
    navigate('/blog');
  };

  const handleUploadCover = async (file: File) => {
    const uploadUrl = await generateCoverUploadUrl();
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!res.ok) throw new Error('Upload failed');
    const { storageId } = (await res.json()) as { storageId: Id<'_storage'> };
    await setCoverImage({ postId: id, storageId });
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit post</h1>
      <BlogForm
        initialValues={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? '',
          contentMarkdown: post.contentMarkdown,
          status: post.status,
        }}
        submitLabel="Save changes"
        onSubmit={handleUpdate}
        coverImageUrl={post.coverImageUrl}
        onUploadCover={handleUploadCover}
      />
    </div>
  );
}
