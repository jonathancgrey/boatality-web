"use client";

import { deleteContent } from "./actions";
import { useTransition } from "react";

export default function ContentTable({ content }) {
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id: string) {
    startTransition(async () => {
      await deleteContent(id);
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden">
      <table className="min-w-full text-sm text-slate-200">
        <thead className="bg-white/10 text-left font-semibold text-slate-300">
          <tr>
            <th className="p-4">Thumbnail</th>
            <th className="p-4">Title</th>
            <th className="p-4">Type</th>
            <th className="p-4">Channel</th>
            <th className="p-4">Primary Category</th>
            <th className="p-4">Date</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {content.map((item) => (
            <tr key={item.id} className="hover:bg-white/5 transition">
              <td className="p-4">
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    className="w-20 h-12 object-cover rounded-lg ring-1 ring-white/10 shadow"
                  />
                ) : (
                  <div className="w-20 h-12 bg-white/10 rounded-lg" />
                )}
              </td>

              <td className="p-4 font-medium text-slate-100">{item.title}</td>
              <td className="p-4 capitalize text-slate-300">{item.content_type}</td>
              <td className="p-4 text-sky-300">{item.channels_v2?.name}</td>
              <td className="p-4 text-amber-300">{item.categories?.name}</td>

              <td className="p-4 text-slate-400">
                {new Date(item.created_at).toLocaleDateString()}
              </td>

              <td className="p-4 text-right">
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isPending}
                  className="text-red-400 hover:text-red-300 font-medium disabled:opacity-40 transition"
                >
                  {isPending ? "Deleting…" : "Delete"}
                </button>
              </td>
            </tr>
          ))}

          {content.length === 0 && (
            <tr>
              <td colSpan={7} className="p-10 text-center text-slate-500">
                No content uploaded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
