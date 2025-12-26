import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function VideoList({ videos, onDelete, loading }) {
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video?')) return;
    await api.delete(`/api/v1/videos/${id}`);
    if (onDelete) onDelete(id);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-zinc-900 border-b border-zinc-800">
            <th className="px-4 py-3 text-left font-semibold text-zinc-400">Video</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-400">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-400">Date</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-zinc-400">Loading...</td></tr>
          ) : videos.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-zinc-400">No videos found.</td></tr>
          ) : (
            videos.map((video) => (
              <tr key={video._id} className="bg-zinc-900 border-b border-zinc-800 hover:bg-zinc-800 transition">
                <td className="flex items-center gap-3 px-4 py-3">
                  <img
                    src={video.thumbnailPath ? `/thumbnails/${video.thumbnailPath}` : '/placeholder.png'}
                    alt={video.title}
                    className="w-32 h-20 object-cover rounded"
                  />
                  <span className="font-medium text-zinc-200">{video.title}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${video.processingStatus === 'READY' ? 'bg-green-700 text-green-100' : 'bg-blue-700 text-blue-100'}`}>
                    {video.processingStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {new Date(video.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    className="btn btn-xs bg-zinc-800 text-zinc-200 hover:bg-zinc-700 flex items-center gap-1"
                    title="Watch"
                    onClick={() => navigate(`/video/${video._id}`)}
                  >
                    <Eye size={16} /> Watch
                  </button>
                  <button
                    className="btn bg-rose-700 text-white hover:bg-rose-600 flex items-center gap-2 font-bold border-2 border-rose-500 shadow-lg"
                    style={{ minWidth: 90 }}
                    title="Delete"
                    onClick={() => handleDelete(video._id)}
                  >
                    <Trash2 size={18} /> Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
