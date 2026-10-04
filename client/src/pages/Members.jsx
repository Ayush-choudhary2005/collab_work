import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import Button from '../components/Button';
import FormField from '../components/FormField';

const ROLE_BADGE = {
  owner: 'bg-indigo-100 text-indigo-700',
  admin: 'bg-blue-100 text-blue-700',
  member: 'bg-slate-100 text-slate-700',
  guest: 'bg-amber-100 text-amber-700',
};

export default function Members() {
  const { user } = useAuth();
  const { currentWorkspace, reload: reloadWorkspaces } = useTenant();
  const isManager = currentWorkspace.role === 'owner' || currentWorkspace.role === 'admin';

  const [members, setMembers] = useState(null);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [busyId, setBusyId] = useState(null); // membershipId currently being updated/removed
  const [rowErrors, setRowErrors] = useState({});

  const load = () => {
    setError('');
    api
      .get('/tenants/members')
      .then(({ data }) => setMembers(data.data.members))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    setMembers(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace.id]);

  const onInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError('');
    try {
      const { data } = await api.post('/tenants/members', { email: inviteEmail.trim(), role: inviteRole });
      setMembers((prev) => [...(prev || []), data.data.member]);
      setInviteEmail('');
      setInviteRole('member');
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (membershipId, role) => {
    setBusyId(membershipId);
    setRowErrors((prev) => ({ ...prev, [membershipId]: '' }));
    try {
      await api.patch(`/tenants/members/${membershipId}`, { role });
      setMembers((prev) => prev.map((m) => (m.membershipId === membershipId ? { ...m, role } : m)));
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [membershipId]: err.message }));
    } finally {
      setBusyId(null);
    }
  };

  const removeMember = async (membershipId, isSelf) => {
    setBusyId(membershipId);
    setRowErrors((prev) => ({ ...prev, [membershipId]: '' }));
    try {
      await api.delete(`/tenants/members/${membershipId}`);
      setMembers((prev) => prev.filter((m) => m.membershipId !== membershipId));
      // Leaving a workspace changes the set of workspaces this user has —
      // refresh TenantContext so the switcher/guard reflects it immediately.
      if (isSelf) reloadWorkspaces();
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [membershipId]: err.message }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-indigo-600 hover:underline">&larr; Dashboard</Link>
          <span className="font-bold text-slate-900">{currentWorkspace.name} — Members</span>
        </div>
        <span className="text-sm text-slate-500">{user.fullName}</span>
      </header>

      <main className="mx-auto max-w-2xl p-6">
        {isManager && (
          <form onSubmit={onInvite} className="mb-6 rounded-xl bg-white p-4 shadow">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Invite someone</h2>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <FormField
                  id="inviteEmail"
                  type="email"
                  label="Email"
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="inviteRole" className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="admin">admin</option>
                  <option value="member">member</option>
                  <option value="guest">guest</option>
                </select>
              </div>
              <Button type="submit" loading={inviting}>Invite</Button>
            </div>
            {inviteError && <p role="alert" className="mt-2 text-sm text-red-600">{inviteError}</p>}
            <p className="mt-2 text-xs text-slate-400">They need an existing CollabFlow AI account — invites don't send an email yet.</p>
          </form>
        )}

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {!error && members === null && <p className="text-sm text-slate-500">Loading members…</p>}

        {members && (
          <ul className="divide-y divide-slate-200 rounded-xl bg-white shadow">
            {members.map((m) => (
              <li key={m.membershipId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {m.fullName} {m.isSelf && <span className="text-slate-400">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">{m.email}</p>
                  {rowErrors[m.membershipId] && (
                    <p role="alert" className="mt-1 text-xs text-red-600">{rowErrors[m.membershipId]}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isManager && !m.isSelf ? (
                    <select
                      aria-label={`Change role for ${m.fullName}`}
                      value={m.role}
                      disabled={busyId === m.membershipId}
                      onChange={(e) => changeRole(m.membershipId, e.target.value)}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                      <option value="guest">guest</option>
                    </select>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[m.role]}`}>{m.role}</span>
                  )}
                  {(isManager && !m.isSelf) || m.isSelf ? (
                    <Button
                      variant="secondary"
                      className="!px-2 !py-1 text-xs"
                      loading={busyId === m.membershipId}
                      onClick={() => removeMember(m.membershipId, m.isSelf)}
                    >
                      {m.isSelf ? 'Leave' : 'Remove'}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
