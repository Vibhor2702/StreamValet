import React, { useState } from 'react';

function CommentSidebar({ comments, onAdd, currentTime }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onAdd(text.trim());
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 shadow-sm">
      <h4 className="text-sm font-semibold text-zinc-200">Comments & Review</h4>
      <p className="text-xs text-zinc-400">Timestamp: {currentTime.toFixed(1)}s</p>
      <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
        {comments?.length ? (
          comments.map((c) => (
            <div key={c.id || `${c.timestamp}-${c.text}`} className="rounded border border-zinc-800 bg-zinc-950 p-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{c.user?.name || 'User'}</span>
                <span>{c.timestamp?.toFixed ? c.timestamp.toFixed(1) : c.timestamp}s</span>
              </div>
              <p className="text-sm text-zinc-200">{c.text}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-zinc-500">No comments yet.</p>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <textarea
          className="w-full rounded border border-zinc-700 bg-zinc-950 text-zinc-200 px-2 py-2 text-sm"
          rows={3}
          value={text}
          placeholder="Add a comment at this moment"
          onChange={(e) => setText(e.target.value)}
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button className="btn w-full bg-red-600 text-white" onClick={submit} disabled={loading}>
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </div>
  );
}

export default CommentSidebar;
