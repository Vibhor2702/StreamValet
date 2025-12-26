import React, { useRef, useState } from 'react';

function UploadModal({ open, onClose, onUpload }) {
  const fileRef = useRef();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Select a file');
      return;
    }
    setLoading(true);
    try {
      await onUpload({ file, title, description });
      onClose();
      setTitle('');
      setDescription('');
      fileRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload Video</h2>
          <button className="text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded border px-3 py-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="w-full rounded border px-3 py-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input ref={fileRef} type="file" accept="video/mp4,video/x-matroska" />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="btn bg-slate-900 text-white" onClick={submit} disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
