import React from 'react';

const colors = {
  READY: 'bg-emerald-100 text-emerald-700',
  FLAGGED: 'bg-rose-100 text-rose-700',
  FAILED: 'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-slate-100 text-slate-700',
};

function StatusBadge({ status, sensitivity }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
      {sensitivity ? ` · ${sensitivity}` : ''}
    </span>
  );
}

export default StatusBadge;
