import React, { useRef, useState } from 'react';
import api from '../services/api';

function UploadModal({ open, onClose, onUpload }) {
  const fileRef = useRef();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    setUploadProgress(0);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Select a file');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('video', file);
      if (title) form.append('title', title);
      if (description) form.append('description', description);

      // Upload with progress tracking
      await api.post('/api/v1/videos/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      // Close modal and reset
      onClose();
      setTitle('');
      setDescription('');
      setUploadProgress(0);
      fileRef.current.value = '';
      
      // Trigger parent refresh
      if (onUpload) {
        await onUpload({ file, title, description });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload Video</h2>
          <button className="text-sm" onClick={onClose} disabled={loading}>
            Close
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <input 
            className="w-full rounded border px-3 py-2" 
            placeholder="Title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
          <textarea 
            className="w-full rounded border px-3 py-2" 
            placeholder="Description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
          <input 
            ref={fileRef} 
            type="file" 
            accept="video/mp4,video/x-matroska"
            disabled={loading}
          />
          
          {loading && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}
          
          <p className="text-xs text-slate-500">
            Note: Demo environment resets uploads on server restart.
          </p>
          
          <button 
            className="btn bg-slate-900 text-white w-full" 
            onClick={submit} 
            disabled={loading}
          >
            {loading ? `Uploading... ${uploadProgress}%` : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
