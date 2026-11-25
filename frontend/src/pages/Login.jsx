
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LockKeyhole, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('admin@vaultpay.demo');
  const [password, setPassword] = useState('Admin@12345');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError('');

    try {
      const user = await login(email, password);

      nav(
        user.role === 'Admin' ? '/dashboard' : '/invoices',
        { replace: true }
      );
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to sign in'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-brand">
          <div className="brand-icon">
            <ShieldCheck />
          </div>
          <div>
            VaultPay
            <small>FINANCIAL CORE</small>
          </div>
        </div>

        <div className="eyebrow">
          NEXUS CORPORATE SERVICES
        </div>

        <h1>Welcome back.</h1>

        <p className="muted">
          Sign in to your secure financial workspace.
        </p>

        <form onSubmit={submit}>
          <label>Work email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="8"
          />

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            className="primary full"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Authenticating…' : 'Secure sign in'}
            <ArrowRight size={17} />
          </button>
        </form>

        <div className="login-note">
          <LockKeyhole size={15} />
          Protected with encrypted authentication
        </div>

        <div className="demo-box">
          <b>Demo accounts</b>
          <br />
          Admin: admin@vaultpay.demo / Admin@12345
          <br />
          Client: jordan@client.demo / Client@12345
        </div>

      </div>

      <div className="login-footer">
        © 2026 Nexus Corporate Services · VaultPay
      </div>
    </div>
  );
}
