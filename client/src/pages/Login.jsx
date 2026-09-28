import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      // Success: PublicOnly sees the new session and redirects.
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your CollabFlow AI account"
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField id="email" name="email" type="email" label="Email" autoComplete="email" required value={form.email} onChange={onChange} />
        <FormField id="password" name="password" type="password" label="Password" autoComplete="current-password" required value={form.password} onChange={onChange} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={submitting} className="w-full">Log in</Button>
      </form>
    </AuthLayout>
  );
}
