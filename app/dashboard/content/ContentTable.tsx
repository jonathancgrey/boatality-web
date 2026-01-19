"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteContent } from "./actions";

type ContentType = "video" | "podcast" | "article" | string;

type ContentRow = {
  id: string;
  title: string | null;
  content_type?: ContentType; // some queries return `content_type`
  type?: ContentType; // some queries may return `type`
  created_at: string;
  thumbnail_url?: string | null;
  channels_v2?: { name?: string | null }[] | null;
  categories?: { id?: string; name?: string | null } | null;
};

type Props = {
  content: ContentRow[];
  /** Hide/show columns depending on the parent view (videos/podcasts/articles vs all). */
  showType?: boolean;
  showChannel?: boolean;
  showCategory?: boolean;
};

export default function ContentTable({
  content,
  showType = true,
  showChannel = true,
  showCategory = true,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        setDeletingId(id);
        await deleteContent(id);
      } finally {
        setDeletingId(null);
      }
    });
  }

  const cols =
    2 + // thumbnail + title
    (showType ? 1 : 0) +
    (showChannel ? 1 : 0) +
    (showCategory ? 1 : 0) +
    1 + // date
    1; // actions

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden">
      <table className="min-w-full text-sm text-slate-200">
        <thead className="bg-white/10 text-left font-semibold text-slate-300">
          <tr>
            <th className="p-4">Thumbnail</th>
            <th className="p-4">Title</th>
            {showType && <th className="p-4">Type</th>}
            {showChannel && <th className="p-4">Channel</th>}
            {showCategory && <th className="p-4">Primary Category</th>}
            <th className="p-4">Date</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {content.map((item: ContentRow) => {
            const title = item.title || "(Untitled)";
            const type = (item.content_type || item.type || "").toString();
            const channelName = item.channels_v2?.[0]?.name ?? "—";
            const catName = item.categories?.name || "—";
            const date = item.created_at
              ? new Date(item.created_at).toLocaleDateString()
              : "—";
            const isDeletingThis = isPending && deletingId === item.id;

            return (
              <tr key={item.id} className="hover:bg-white/5 transition">
                <td className="p-4">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt=""
                      className="w-20 h-12 object-cover rounded-lg ring-1 ring-white/10 shadow"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-20 h-12 bg-white/10 rounded-lg" />
                  )}
                </td>

                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <div className="font-medium text-slate-100 line-clamp-2">
                      {title}
                    </div>
                    <div className="text-xs text-slate-400">
                      ID: <span className="font-mono">{item.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </td>

                {showType && (
                  <td className="p-4 capitalize text-slate-300">
                    {type || "—"}
                  </td>
                )}

                {showChannel && (
                  <td className="p-4 text-sky-300">{channelName}</td>
                )}

                {showCategory && (
                  <td className="p-4 text-amber-300">{catName}</td>
                )}

                <td className="p-4 text-slate-400">{date}</td>

                <td className="p-4">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/dashboard/content/${item.id}`}
                      className="text-slate-200 hover:text-white font-medium transition"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      className="text-red-400 hover:text-red-300 font-medium disabled:opacity-40 transition"
                      aria-label={`Delete ${title}`}
                    >
                      {isDeletingThis ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {content.length === 0 && (
            <tr>
              <td colSpan={cols} className="p-10 text-center text-slate-500">
                No content uploaded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
