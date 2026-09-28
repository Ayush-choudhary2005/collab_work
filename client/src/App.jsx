import { useEffect, useState } from 'react';
import api from './services/api';

// Phase 3 smoke-test screen: proves React + Tailwind + the Axios client can
// reach the backend. Replaced by real routing/pages in Phase 4.
export default function App() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    api
      .get('/health')
      .then(() => setStatus('connected'))
      .catch(() => setStatus('unreachable'));
  }, []);

  const badge = {
    checking: 'bg-yellow-100 text-yellow-800',
    connected: 'bg-green-100 text-green-800',
    unreachable: 'bg-red-100 text-red-800',
  }[status];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900">CollabFlow AI</h1>
        <p className="mt-1 text-slate-500">Frontend setup complete</p>
        <span className={`inline-block mt-6 px-3 py-1 rounded-full text-sm font-medium ${badge}`}>
          Backend: {status}
        </span>
      </div>
    </div>
  );
}
