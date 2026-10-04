import { useState } from 'react';
import Button from '../Button';
import FormField from '../FormField';

export default function CreateTaskForm({ onCreate }) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onCreate(title.trim());
      setTitle('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2 rounded-xl bg-white p-3 shadow">
      <div className="flex-1">
        <FormField
          id="newTaskTitle"
          label="New task"
          placeholder="e.g. Build login page"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <Button type="submit" loading={submitting}>Add</Button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
