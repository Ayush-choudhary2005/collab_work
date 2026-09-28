import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await register(form);
      // Success: PublicOnly sees the new session and redirects.
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start collaborating with your team"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField id="fullName" name="fullName" label="Full name" autoComplete="name" required value={form.fullName} onChange={onChange} />
        <FormField id="email" name="email" type="email" label="Email" autoComplete="email" required value={form.email} onChange={onChange} />
        <FormField id="password" name="password" type="password" label="Password (min 8 characters)" autoComplete="new-password" required value={form.password} onChange={onChange} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={submitting} className="w-full">Create account</Button>
      </form>
    </AuthLayout>
  );
}
