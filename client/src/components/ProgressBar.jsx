import React from 'react';

export default function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-200">
      <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${value}%` }} />
    </div>
  );
}
