import React, { useEffect, useMemo, useState } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SocketProvider, useSocket } from '../context/SocketContext';
import api from '../services/api';
import UploadModal from '../components/UploadModal';
import VideoList from '../components/VideoList';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import VideoDetailPage from './VideoDetailPage';

function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@pulsegen.io');
  const [password, setPassword] = useState('admin123');
  const [tenant, setTenant] = useState('pulsegen');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (creds) => {
    setError(null);
    setLoading(true);
    try {
      const payload = creds || { email, password, tenant };
      await login(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role) => {
    const map = {
      admin: { email: 'admin@pulsegen.io', password: 'admin123', tenant: 'pulsegen' },
      editor: { email: 'editor@pulsegen.io', password: 'editor123', tenant: 'pulsegen' },
      viewer: { email: 'viewer@pulsegen.io', password: 'viewer123', tenant: 'pulsegen' },
    };
    const creds = map[role];
    if (!creds) return;
    setEmail(creds.email);
    setPassword(creds.password);
    setTenant(creds.tenant);
    submit(creds);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-xl font-semibold">StreamValet</h1>
        <p className="text-sm text-slate-600">Sign in to manage videos</p>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input className="w-full rounded border px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <input className="w-full rounded border px-3 py-2" value={tenant} onChange={(e) => setTenant(e.target.value)} placeholder="Tenant" />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="btn w-full justify-center bg-slate-900 text-white" onClick={() => submit()} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Demo Access</p>
          <p className="text-xs text-slate-600">One-click logins for evaluators.</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button className="btn bg-slate-100 text-slate-800" onClick={() => quickLogin('admin')} disabled={loading}>
              Login as Admin
            </button>
            <button className="btn bg-slate-100 text-slate-800" onClick={() => quickLogin('editor')} disabled={loading}>
              Login as Editor
            </button>
            <button className="btn bg-slate-100 text-slate-800" onClick={() => quickLogin('viewer')} disabled={loading}>
              Login as Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, logout, token } = useAuth();
  const { socket } = useSocket();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [progressMap, setProgressMap] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (message, duration = 3000) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  };

  const loadVideos = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/videos');
      setVideos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('VIDEO_PROGRESS', (payload) => {
      setProgressMap((prev) => ({ ...prev, [payload.videoId]: payload.progress }));
    });
    socket.on('VIDEO_PROCESSED', (payload) => {
      setProgressMap((prev) => {
        const next = { ...prev };
        delete next[payload.videoId];
        return next;
      });
      showToast('Video Ready! Processing complete.');
      loadVideos();
    });
    socket.on('VIDEO_FAILED', (payload) => {
      setProgressMap((prev) => {
        const next = { ...prev };
        delete next[payload.videoId];
        return next;
      });
      showToast('Video processing failed. Please try again.', 5000);
      loadVideos();
    });
    return () => {
      socket.off('VIDEO_PROGRESS');
      socket.off('VIDEO_PROCESSED');
      socket.off('VIDEO_FAILED');
    };
  }, [socket]);

  const onUpload = async ({ file, title, description }) => {
    // This is called after upload completes in the modal
    showToast('Upload Complete! Processing started...');
    await loadVideos();
  };

  const onRetry = async (id) => {
    await api.post(`/api/v1/videos/${id}/retry`);
    await loadVideos();
  };

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  const handleDelete = (id) => {
    setVideos((prev) => prev.filter((v) => v._id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">StreamValet</h1>
            <p className="text-sm text-zinc-400">Tenant: {user.tenantId}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <span>{user.email} · {user.role}</span>
            <button className="btn bg-zinc-800 text-zinc-200" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Videos</h2>
          <div className="flex gap-2">
            <button className="btn bg-zinc-900 text-white" onClick={() => setShowUpload(true)}>
              Upload
            </button>
          </div>
        </div>

        <VideoList videos={videos} onDelete={handleDelete} loading={loading} />

        {isAdmin && <AdminPanel />}
      </main>

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onUpload={onUpload} />
      
      {toast && (
        <div className="fixed right-4 top-4 z-20 rounded-lg border border-blue-800 bg-blue-950 px-4 py-2 text-sm text-blue-200 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function AdminPanel() {
  const [metrics, setMetrics] = useState(null);

  const loadMetrics = async () => {
    const { data } = await api.get('/api/v1/admin/metrics');
    setMetrics(data);
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (!metrics) return null;
  return (
    <div className="card p-4">
      <h3 className="text-base font-semibold">Admin Analytics</h3>
      <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Metric label="Total Storage" value={`${(metrics.totalStorageBytes / (1024 * 1024)).toFixed(1)} MB`} />
        <Metric label="Total Videos" value={metrics.totalVideos} />
        <Metric label="Sensitivity" value={`Safe ${metrics.safeCount} / Flagged ${metrics.flaggedCount}`} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function AppShell() {
  const { user } = useAuth();
  if (!user) return <LoginScreen />;
  return <Dashboard />;
}


export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AppShell />} />
            <Route path="/video/:id" element={<VideoDetailPage />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
