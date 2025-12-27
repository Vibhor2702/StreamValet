import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import CommentSidebar from '../components/CommentSidebar';
import { AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function VideoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(null);
  const playerRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: v } = await api.get(`/api/v1/videos`);
        const found = v.find((vid) => vid._id === id);
        if (!found) throw new Error('Video not found');
        setVideo(found);
        const { data: comms } = await api.get(`/api/v1/comments?videoId=${id}`);
        setComments(comms);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddComment = async (text) => {
    const timestamp = currentTime;
    const { data: newComment } = await api.post(`/api/v1/comments`, {
      videoId: id,
      text,
      timestamp,
    });
    setComments((prev) => [...prev, newComment]);
  };

  if (loading) return <div className="p-8 text-zinc-400">Loading...</div>;
  if (error) return <div className="p-8 text-rose-500">{error}</div>;
  if (!video) return <div className="p-8 text-zinc-400">Video not found.</div>;

  return (
    <div className="flex gap-8 min-h-screen bg-zinc-950 text-zinc-200 p-8">
      {/* Left: Video Player and Info */}
      <div className="flex-1 max-w-3xl">
        <button className="mb-4 text-zinc-400 hover:text-zinc-200" onClick={() => navigate(-1)}>&larr; Back to list</button>
        
        {/* Sensitivity Warning */}
        {video.sensitivityStatus === 'FLAGGED' && (
          <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-200 font-semibold mb-1">Content Warning: Flagged Material</h3>
              <p className="text-red-400 text-sm">
                Automated analysis detected potential policy violations. Viewer discretion is advised.
              </p>
              {video.sensitivityReason && (
                <p className="text-red-400/80 text-xs mt-2">
                  Reason: {video.sensitivityReason}
                </p>
              )}
            </div>
          </div>
        )}
        
        <VideoPlayer
          ref={playerRef}
          src={`${API_BASE}/api/v1/videos/stream/${video._id}?token=${encodeURIComponent(token)}`}
          poster={video.thumbnailPath ? `${API_BASE}/thumbnails/${video.thumbnailPath}` : undefined}
          comments={comments}
          sensitivitySegments={video.sensitivitySegments}
          currentTime={currentTime}
          onTimeChange={setCurrentTime}
          duration={video.durationSeconds}
        />
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-2">{video.title}</h2>
          <p className="text-zinc-400 mb-2">{video.description}</p>
          <div className="flex gap-4 text-sm text-zinc-500">
            <span>Status: <span className="font-semibold text-zinc-200">{video.processingStatus}</span></span>
            <span>Uploaded: {new Date(video.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
      {/* Right: Comments */}
      <div className="w-96">
        <CommentSidebar comments={comments} onAdd={handleAddComment} currentTime={currentTime} />
      </div>
    </div>
  );
}
