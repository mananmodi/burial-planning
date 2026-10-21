import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { FullSkeleton } from '../Skeleton.jsx';

export default function AdminMessages() {
  const [list, setList] = useState(null);
  const load = () => api('/admin/messages').then(setList);
  useEffect(() => { load(); }, []);
  const remove = async (id) => { if (confirm('Delete this message?')) { await api(`/admin/messages/${id}`, { method: 'DELETE' }); load(); } };
  if (!list) return <FullSkeleton />;
  return (
    <div className="wide">
      <h1>Contact messages</h1>
      {!list.length && <p className="muted">No messages yet.</p>}
      {list.map((m) => (
        <div className="card" key={m.id}>
          <div className="row between">
            <strong>{m.name}</strong>
            <span className="muted">{new Date(m.created_at.replace(' ', 'T') + 'Z').toLocaleString()}</span>
          </div>
          <p className="muted">{[m.phone, m.email].filter(Boolean).join(' · ')}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{m.message}</p>
          <button className="danger" onClick={() => remove(m.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
