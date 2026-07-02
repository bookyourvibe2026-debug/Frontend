"use client";

import { useMemo, useRef, useState } from "react";
import { Bold, Italic, List, Quote, Code2, ImagePlus, Pencil, Trash2, Send } from "lucide-react";
import { Badge } from "@/components/vendor/ui";
import { Toast } from "@/components/admin/Toast";
import { getBlogPosts, saveBlogPosts } from "@/lib/admin-mock-data";
import { readFileAsDataUrl } from "@/lib/files";
import { BlogPost } from "@/lib/types";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(() => getBlogPosts());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publishedCount = useMemo(() => posts.filter((p) => p.status === "Published").length, [posts]);

  function persist(next: BlogPost[]) {
    setPosts(next);
    saveBlogPosts(next);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setContent("");
    setThumbnail(undefined);
  }

  function wrapSelection(before: string, after = before) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const selected = value.slice(selectionStart, selectionEnd) || "text";
    const next = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = selectionStart + before.length;
      el.selectionEnd = selectionStart + before.length + selected.length;
    });
  }

  async function handleThumbnail(file: File | undefined) {
    if (!file) return;
    setThumbnail(await readFileAsDataUrl(file));
  }

  function handlePublish() {
    if (!title.trim()) {
      setToast("Add a post title first.");
      return;
    }
    const post: BlogPost = {
      id: editingId ?? `bp-${Date.now()}`,
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      thumbnail,
      content,
      status: "Published",
      publishedOn: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    };

    if (editingId) {
      persist(posts.map((p) => (p.id === editingId ? post : p)));
      setToast("Post updated");
    } else {
      persist([post, ...posts]);
      setToast("Post published");
    }
    resetForm();
  }

  function handleEdit(post: BlogPost) {
    setEditingId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setContent(post.content);
    setThumbnail(post.thumbnail);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this post?")) return;
    persist(posts.filter((p) => p.id !== id));
    setToast("Post deleted");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-vibe-violet">Blog Management System</p>
          <h1 className="font-display text-xl font-semibold text-ink">{editingId ? "Edit Post" : "Create New Post"}</h1>
        </div>
        <div className="flex gap-2">
          {editingId && (
            <button onClick={resetForm} className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-cream-300">
              Cancel Edit
            </button>
          )}
          <button
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 rounded-lg bg-vibe-violet px-4 py-2 text-sm font-semibold text-white hover:bg-vibe-violetSoft"
          >
            <Send size={14} /> {editingId ? "Update Post" : "Publish Post"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Post Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a catchy title..."
            className="w-full rounded-lg border border-surface-border bg-cream-200/40 px-3 py-2.5 text-lg font-semibold outline-none focus:border-vibe-violet"
          />

          <div className="mt-4 flex items-center gap-1 rounded-t-lg border border-b-0 border-surface-border bg-cream-200/60 px-2 py-1.5">
            <ToolbarButton icon={<Bold size={14} />} onClick={() => wrapSelection("**")} title="Bold" />
            <ToolbarButton icon={<Italic size={14} />} onClick={() => wrapSelection("_")} title="Italic" />
            <ToolbarButton icon={<List size={14} />} onClick={() => wrapSelection("\n- ", "")} title="Bullet list" />
            <ToolbarButton icon={<Quote size={14} />} onClick={() => wrapSelection("\n> ", "")} title="Quote" />
            <ToolbarButton icon={<Code2 size={14} />} onClick={() => wrapSelection("`")} title="Code" />
            <span className="ml-auto text-[10px] text-ink-faint">Markdown supported</span>
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="Start writing your story..."
            className="w-full rounded-b-lg border border-surface-border px-3 py-2.5 text-sm outline-none focus:border-vibe-violet"
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Post Settings</p>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-faint">URL Slug</label>
            <div className="flex items-center rounded-lg border border-surface-border bg-cream-200/40 px-3 py-2 text-sm text-ink-soft">
              <span className="text-ink-faint">/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={slugify(title) || "url-friendly-slug"}
                className="w-full bg-transparent pl-1 outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] italic text-ink-faint">Auto-generated from title if left blank.</p>

            <p className="mb-1.5 mt-4 text-[11px] font-semibold text-ink-faint">Featured Image (Thumbnail)</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleThumbnail(e.target.files?.[0])} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-32 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-surface-border bg-cream-200/40 hover:bg-cream-200"
            >
              {thumbnail ? (
                <img src={thumbnail} alt="thumbnail" className="h-full w-full object-cover" />
              ) : (
                <>
                  <ImagePlus size={20} className="text-ink-faint" />
                  <span className="text-xs text-ink-faint">Click to upload thumbnail (Max 5MB)</span>
                </>
              )}
            </button>
          </div>

          <div className="rounded-xl2 bg-vibe-violet p-5 text-white">
            <p className="text-sm font-bold">Writing Tips</p>
            <ul className="mt-2 space-y-1.5 text-xs text-white/85">
              <li>• Use short paragraphs — mobile readers scan quickly.</li>
              <li>• Add a clear H1-style title; keep the slug short and descriptive.</li>
              <li>• Real photos of venues perform better than stock imagery.</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-display font-semibold text-ink">Manage Published Blogs</p>
            <p className="text-xs text-ink-faint">You have {publishedCount} published articles.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div key={post.id} className="overflow-hidden rounded-xl2 border border-surface-border bg-white shadow-panel">
              <div className="relative h-36 bg-cream-300">
                {post.thumbnail && <img src={post.thumbnail} alt={post.title} className="h-full w-full object-cover" />}
                <div className="absolute right-2 top-2 flex gap-1.5">
                  <button onClick={() => handleEdit(post)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-vibe-violet shadow">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-vibe-coral shadow">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <Badge tone={post.status === "Published" ? "success" : "neutral"}>{post.status.toUpperCase()}</Badge>
                  <span className="text-[11px] text-ink-faint">{post.publishedOn}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-ink">{post.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function ToolbarButton({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-md text-ink-soft hover:bg-white hover:text-vibe-violet"
    >
      {icon}
    </button>
  );
}
