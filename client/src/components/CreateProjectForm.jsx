import { useState } from 'react';
import Button from './Button';
import FormField from './FormField';

export default function CreateProjectForm({ onCreate }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onCreate(name.trim());
      setName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <FormField
          id="newProjectName"
          label="New project"
          placeholder="e.g. Website Revamp"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <Button type="submit" loading={submitting}>Create</Button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
