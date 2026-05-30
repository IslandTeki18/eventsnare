import { useState } from 'react';
import { slugify } from '@/features/blog-dashboard/lib/slugify';

export type BlogStatus = 'draft' | 'published';

export interface BlogFormValues {
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  status: BlogStatus;
}

interface BlogFormProps {
  initialValues: BlogFormValues;
  submitLabel: string;
  onSubmit: (values: BlogFormValues) => Promise<void>;
  coverImageUrl?: string | null;
  onUploadCover?: (file: File) => Promise<void>;
}

const inputClass =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40';
const labelClass = 'text-xs font-semibold uppercase tracking-wider text-muted-foreground';

export function BlogForm({
  initialValues,
  submitLabel,
  onSubmit,
  coverImageUrl,
  onUploadCover,
}: BlogFormProps) {
  const [values, setValues] = useState<BlogFormValues>(initialValues);
  const [slugEdited, setSlugEdited] = useState(initialValues.slug.length > 0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof BlogFormValues>(key: K, value: BlogFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleTitleChange = (title: string) => {
    setValues((prev) => ({
      ...prev,
      title,
      slug: slugEdited ? prev.slug : slugify(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadCover) return;
    setError(null);
    setUploading(true);
    try {
      await onUploadCover(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className={inputClass}
          value={values.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="slug">
          Slug
        </label>
        <input
          id="slug"
          className={inputClass}
          value={values.slug}
          onChange={(e) => {
            setSlugEdited(true);
            update('slug', slugify(e.target.value));
          }}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="excerpt">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          className={`${inputClass} min-h-16 resize-y`}
          value={values.excerpt}
          onChange={(e) => update('excerpt', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="content">
          Content (Markdown)
        </label>
        <textarea
          id="content"
          className={`${inputClass} min-h-80 resize-y font-mono`}
          value={values.contentMarkdown}
          onChange={(e) => update('contentMarkdown', e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="status">
          Status
        </label>
        <select
          id="status"
          className={inputClass}
          value={values.status}
          onChange={(e) => update('status', e.target.value as BlogStatus)}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {onUploadCover && (
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Cover image</span>
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt="Cover"
              className="max-h-48 w-auto rounded-md border border-border object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            disabled={uploading}
            className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted"
          />
          {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
