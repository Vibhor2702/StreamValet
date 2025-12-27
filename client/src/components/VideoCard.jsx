import React, { useEffect, useMemo, useState } from 'react';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import VideoPlayer from './VideoPlayer';
import CommentSidebar from './CommentSidebar';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

function VideoCard({ video, onRetry, progress, token }) {
  const { socket } = useSocket();
  const [comments, setComments] = useState([]);
  const [duration, setDuration] = useState(video.durationSeconds || 0);
  const [currentTime, setCurrentTime] = useState(0);

  const streamSrc = useMemo(() => `${API_BASE}/api/v1/videos/stream/${video._id}?token=${encodeURIComponent(token)}`, [video._id, token]);

  useEffect(() => {
    const loadComments = async () => {
      try {
        const { data } = await api.get(`/api/v1/comments/${video._id}`);
        setComments(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load comments', err.message);
      }
    };
    loadComments();
  }, [video._id]);

  useEffect(() => {
    if (!socket) return undefined;
    const handler = (payload) => {
      if (payload.videoId?.toString() === video._id?.toString()) {
        setComments((prev) => [...prev, payload]);
      }
    };
    socket.on('NEW_COMMENT', handler);
    return () => socket.off('NEW_COMMENT', handler);
  }, [socket, video._id]);

  const handleAddComment = async (text) => {
    const { data } = await api.post('/api/v1/comments', {
      videoId: video._id,
      text,
      timestamp: currentTime,
    });
    setComments((prev) => [...prev, data]);
  };

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-start gap-4">
        <img src={video.thumbnailPath ? `${API_BASE}/thumbnails/${video.thumbnailPath.split('\\').pop().split('/').pop()}` : 'https://via.placeholder.com/160x90'} alt={video.title} className="h-24 w-40 rounded object-cover border border-zinc-800 bg-zinc-900" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-zinc-200">{video.title}</h3>
              <p className="text-sm text-zinc-400">{video.description}</p>
            </div>
            <StatusBadge status={video.processingStatus} sensitivity={video.sensitivityStatus} />
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span>{(video.size / (1024 * 1024)).toFixed(1)} MB</span>
            {video.durationSeconds ? <span>{video.durationSeconds.toFixed(1)}s</span> : null}
            {video.resolution?.width ? <span>{video.resolution.width}x{video.resolution.height}</span> : null}
          </div>
          {(video.processingStatus === 'PROCESSING' || video.processingStatus === 'PENDING') && (
            <ProgressBar value={progress ?? 10} />
          )}
          <div className="flex gap-2">
            <a className="btn bg-zinc-800 text-zinc-200 border border-zinc-700" href={streamSrc} target="_blank" rel="noreferrer">
              Stream
            </a>
            {video.processingStatus === 'FAILED' && (
              <button className="btn bg-amber-900 text-amber-200 border border-amber-700" onClick={() => onRetry(video._id)}>
                Retry
              </button>
            )}
          </div>
        </div>
      </div>

      {video.processingStatus === 'READY' || video.processingStatus === 'FLAGGED' ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-3">
            <VideoPlayer
              src={streamSrc}
              poster={video.thumbnailPath ? `${API_BASE}/thumbnails/${video.thumbnailPath.split('\\').pop().split('/').pop()}` : undefined}
              comments={comments}
              sensitivitySegments={video.sensitivitySegments || []}
              currentTime={currentTime}
              onTimeChange={setCurrentTime}
              onDuration={setDuration}
              duration={duration}
            />
          </div>
          <CommentSidebar comments={comments} onAdd={handleAddComment} currentTime={currentTime} />
        </div>
      ) : null}
    </div>
  );
}

export default VideoCard;
