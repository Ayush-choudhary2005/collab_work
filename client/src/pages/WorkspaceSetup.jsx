import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { useTenant } from '../hooks/useTenant';

export default function WorkspaceSetup() {
  const { createWorkspace, workspaces } = useTenant();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a workspace name.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await createWorkspace(name.trim());
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create a workspace"
      subtitle="A workspace is where your team's projects and tasks live."
      footer={
        workspaces.length > 0 && (
          <Link to="/" className="font-medium text-indigo-600 hover:underline">
            Cancel
          </Link>
        )
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField id="name" name="name" label="Workspace name" placeholder="e.g. Acme Team" required value={name} onChange={(e) => setName(e.target.value)} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={submitting} className="w-full">Create workspace</Button>
      </form>
    </AuthLayout>
  );
}
