import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2 } from 'lucide-react';
import api from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
            <tr>
              <td colSpan={4} className="px-4 py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <svg className="w-16 h-16 text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-semibold text-zinc-300 mb-2">No videos yet</p>
                  <p className="text-sm text-zinc-500">Upload your first video to get started</p>
                </div>
              </td>
            </tr>
          ) : (
            videos.map((video) => (
              <tr key={video._id} className="bg-zinc-900 border-b border-zinc-800 hover:bg-zinc-800 transition">
                <td className="flex items-center gap-3 px-4 py-4">
                  <img
                    src={video.thumbnailPath ? `${API_BASE}/thumbnails/${video.thumbnailPath}` : 'https://via.placeholder.com/160x90'}
                    alt={video.title}
                    className="w-32 h-20 object-cover rounded-md border border-zinc-700 hover:shadow-lg hover:shadow-cyan-500/20 transition-shadow duration-300"
                  />
                  <span className="font-medium text-zinc-200">{video.title}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${video.processingStatus === 'READY' ? 'bg-green-700 text-green-100' : 'bg-blue-700 text-blue-100'}`}>
                    {video.processingStatus}
                  </span>
                </td>
                <td className="px-4 py-4 text-zinc-400">
                  {new Date(video.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-4 flex gap-2">
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
