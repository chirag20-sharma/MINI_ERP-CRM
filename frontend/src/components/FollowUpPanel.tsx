import { useState, useEffect, FormEvent } from 'react';
import { FollowUp } from '../types';
import { getFollowUps, addFollowUp } from '../services/customer.service';
import { Spinner, EmptyState } from './UI';
import { useAuth } from '../context/AuthContext';

export default function FollowUpPanel({ customerId }: { customerId: string }) {
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getFollowUps(customerId)
      .then(r => setFollowUps(r.followUps))
      .finally(() => setLoading(false));
  }, [customerId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!note.trim() || !date) { setError('Note and date are required'); return; }
    setSaving(true);
    setError('');
    try {
      const { followUp } = await addFollowUp(customerId, {
        note,
        followUpDate: new Date(date).toISOString(),
      });
      setFollowUps(prev => [followUp, ...prev]);
      setNote('');
      setDate('');
    } catch {
      setError('Failed to add follow-up');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="followup-panel">
      <h3>Follow-up History</h3>

      {canWrite && (
        <form className="followup-form" onSubmit={handleAdd}>
          <textarea
            placeholder="Add a follow-up note..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
          />
          <div className="followup-form-row">
            <input
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add Follow-up'}
            </button>
          </div>
          {error && <span className="field-error">{error}</span>}
        </form>
      )}

      {loading ? (
        <Spinner />
      ) : followUps.length === 0 ? (
        <EmptyState message="No follow-ups yet." />
      ) : (
        <ul className="followup-list">
          {followUps.map(f => (
            <li key={f.id} className="followup-item">
              <div className="followup-meta">
                <span className="followup-author">{f.createdBy.name}</span>
                <span className="followup-date">
                  {new Date(f.followUpDate).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
              <p className="followup-note">{f.note}</p>
              <span className="followup-created">
                Added {new Date(f.createdAt).toLocaleDateString('en-IN')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
