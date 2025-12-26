import React from 'react';

function TimelineHeatmap({ duration, comments, sensitivitySegments, currentTime, onSeek }) {
  const percent = (value) => (duration > 0 ? (value / duration) * 100 : 0);

  const handleClick = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const target = Math.max(0, Math.min(duration, ratio * duration));
    onSeek?.(target);
  };

  return (
    <div className="space-y-2">
      <div className="relative h-3 w-full cursor-pointer overflow-hidden rounded-full bg-slate-200" onClick={handleClick} aria-label="Timeline heatmap">
        {/* Sensitivity segments */}
        {sensitivitySegments?.map((seg, idx) => (
          <div
            key={`${seg.start}-${seg.end}-${idx}`}
            className="absolute inset-y-0 bg-rose-400/80"
            style={{ left: `${percent(seg.start)}%`, width: `${Math.max(0.5, percent(seg.end - seg.start))}%` }}
            title={seg.reason}
          />
        ))}
        {/* Comment dots */}
        {comments?.map((c) => (
          <div
            key={c.id || `${c.timestamp}-${c.userId}`}
            className="absolute top-0 h-full w-1 rounded-full bg-sky-500"
            style={{ left: `${percent(c.timestamp)}%` }}
            title={c.text}
          />
        ))}
        {/* Playback position */}
        <div
          className="absolute top-0 h-full w-0.5 bg-slate-900"
          style={{ left: `${percent(currentTime)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{currentTime.toFixed(1)}s</span>
        <span>{duration ? `${duration.toFixed(1)}s` : '0.0s'}</span>
      </div>
    </div>
  );
}

export default TimelineHeatmap;
