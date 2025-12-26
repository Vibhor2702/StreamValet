import React, { useEffect, useMemo, useRef, useState } from 'react';
import TimelineHeatmap from './TimelineHeatmap';

function VideoPlayer({ src, poster, comments, sensitivitySegments, currentTime, onTimeChange, onDuration, duration }) {
  const videoRef = useRef(null);
  const [localDuration, setLocalDuration] = useState(duration || 0);
  const [activeSegment, setActiveSegment] = useState(null);
  const [toast, setToast] = useState(null);
  const lastToastReason = useRef(null);

  const segments = useMemo(() => sensitivitySegments || [], [sensitivitySegments]);

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const d = videoRef.current.duration || 0;
    setLocalDuration(d);
    onDuration?.(d);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime || 0;
    onTimeChange?.(t);
    const hit = segments.find((s) => t >= s.start && t <= s.end);
    setActiveSegment(hit || null);
  };

  const handleSeek = (value) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value;
      onTimeChange?.(value);
    }
  };

  useEffect(() => {
    if (typeof duration === 'number' && duration > 0) {
      setLocalDuration(duration);
    }
  }, [duration]);

  useEffect(() => {
    if (activeSegment && activeSegment.reason !== lastToastReason.current) {
      setToast(`Sensitivity Alert: ${activeSegment.reason}`);
      lastToastReason.current = activeSegment.reason;
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [activeSegment]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-black">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full"
          controls
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>

      <TimelineHeatmap
        duration={localDuration}
        comments={comments}
        sensitivitySegments={segments}
        currentTime={currentTime}
        onSeek={handleSeek}
      />

      {toast ? (
        <div className="fixed right-4 top-4 z-20 rounded-lg border border-rose-800 bg-rose-950 px-4 py-2 text-sm text-rose-400 shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

export default VideoPlayer;
