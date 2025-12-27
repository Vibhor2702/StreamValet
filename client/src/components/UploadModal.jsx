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
    
    console.log('📤 [FRONTEND] Starting upload...');
    console.log('📁 [FRONTEND] File:', file.name, '|', (file.size / (1024 * 1024)).toFixed(2), 'MB');
    
    setLoading(true);
    try {
      const form = new FormData();
      form.append('video', file);
      if (title) form.append('title', title);
      if (description) form.append('description', description);

      const uploadUrl = `${import.meta.env.VITE_API_URL || ''}/api/v1/videos/upload`;
      console.log('🌐 [FRONTEND] Attempting Upload to:', uploadUrl);
      console.log('🔑 [FRONTEND] API Base URL:', import.meta.env.VITE_API_URL || 'NOT SET');

      // Upload with progress tracking
      const response = await api.post('/api/v1/videos/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
          console.log('📊 [FRONTEND] Upload Progress:', percentCompleted + '%');
        },
      });

      console.log('✅ [FRONTEND] Upload Success!', response.data);

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
      console.error('❌ [FRONTEND] Upload Failed:', err);
      console.error('❌ [FRONTEND] Error Response:', err.response?.data);
      console.error('❌ [FRONTEND] Error Status:', err.response?.status);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">Upload Video</h2>
          <button className="text-sm text-zinc-400 hover:text-zinc-200" onClick={onClose} disabled={loading}>
            Close
          </button>
        </div>
        <div className="space-y-4">
          <input 
            className="w-full bg-zinc-950 text-zinc-100 border border-zinc-700 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-zinc-500" 
            placeholder="Title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
          <textarea 
            className="w-full bg-zinc-950 text-zinc-100 border border-zinc-700 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-zinc-500" 
            placeholder="Description" 
            rows={3}
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
          <input 
            ref={fileRef} 
            type="file" 
            accept="video/mp4,video/x-matroska"
            disabled={loading}
            className="w-full text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer"
          />
          
          {loading && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div 
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-rose-400">{error}</p>}
          
          <p className="text-xs text-zinc-500">
            Note: Demo environment resets uploads on server restart.
          </p>
          
          <button 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
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
