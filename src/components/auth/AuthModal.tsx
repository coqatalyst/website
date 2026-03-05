import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { withConvexProvider } from "../../lib/convex";

type View = "login" | "register" | "verify" | "resend";

interface AuthModalProps {
  onSuccess?: (
    user: { id: string; name: string; email: string; isAdmin: boolean },
    token: string,
  ) => void;
  onClose?: () => void;
  initialView?: View;
}

function AuthModal({
  onSuccess,
  onClose,
  initialView = "login",
}: AuthModalProps) {
  const [view, setView] = useState<View>(initialView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  const login = useAction(api.auth.login);
  const register = useAction(api.auth.register);
  const verifyEmail = useMutation(api.auth.verifyEmail);
  const resendToken = useAction(api.auth.resendVerificationToken);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const res = await login({ email, password });
      if (!res.success) {
        setError(res.error ?? "Login failed.");
        return;
      }
      localStorage.setItem("cq_session", res.sessionToken!);
      onSuccess?.(res.user!, res.sessionToken!);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await register({ name, email, password });
      if (!res.success) {
        setError(res.error ?? "Registration failed.");
        return;
      }
      setPendingEmail(email);
      setSuccess("Account created! Check your email for a verification token.");
      setTimeout(() => setView("verify"), 1200);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const res = await verifyEmail({ token: token.trim() });
      if (!res.success) {
        setError(res.error ?? "Verification failed.");
        return;
      }
      setSuccess("Email verified! You can now log in.");
      setTimeout(() => setView("login"), 1200);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const res = await resendToken({ email: pendingEmail || email });
      if (!res.success) {
        setError(res.error ?? "Failed to resend.");
        return;
      }
      setSuccess("New token sent! Check your email.");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="auth-modal sharp-card">
        <button className="auth-close font-mono" onClick={onClose}>
          ✕
        </button>

        {view === "login" && (
          <>
            <div className="auth-header">
              <div className="section-tag" style={{ marginBottom: 12 }}>
                Account
              </div>
              <h2 className="font-display auth-title">SIGN IN</h2>
            </div>
            <form onSubmit={handleLogin} className="auth-form">
              <div className="field">
                <label className="field-label font-mono">Email</label>
                <input
                  className="sharp-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              <div className="field">
                <label className="field-label font-mono">Password</label>
                <input
                  className="sharp-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="auth-error font-mono">{error}</p>}
              {success && <p className="auth-success font-mono">{success}</p>}
              <button
                className="btn-primary w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign In →"}
              </button>
            </form>
            <div className="auth-links">
              <span>Don't have an account?</span>
              <button
                className="auth-link font-mono"
                onClick={() => {
                  clearMessages();
                  setView("register");
                }}
              >
                Register
              </button>
            </div>
            <div className="auth-links">
              <span>Need to verify?</span>
              <button
                className="auth-link font-mono"
                onClick={() => {
                  clearMessages();
                  setView("verify");
                }}
              >
                Verify Email
              </button>
            </div>
          </>
        )}

        {view === "register" && (
          <>
            <div className="auth-header">
              <div className="section-tag" style={{ marginBottom: 12 }}>
                Join Us
              </div>
              <h2 className="font-display auth-title">CREATE ACCOUNT</h2>
            </div>
            <form onSubmit={handleRegister} className="auth-form">
              <div className="field">
                <label className="field-label font-mono">Name</label>
                <input
                  className="sharp-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                />
              </div>
              <div className="field">
                <label className="field-label font-mono">Email</label>
                <input
                  className="sharp-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              <div className="field">
                <label className="field-label font-mono">Password</label>
                <input
                  className="sharp-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                />
              </div>
              {error && <p className="auth-error font-mono">{error}</p>}
              {success && <p className="auth-success font-mono">{success}</p>}
              <button
                className="btn-primary w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating…" : "Create Account →"}
              </button>
            </form>
            <div className="auth-links">
              <span>Already have an account?</span>
              <button
                className="auth-link font-mono"
                onClick={() => {
                  clearMessages();
                  setView("login");
                }}
              >
                Sign In
              </button>
            </div>
          </>
        )}

        {view === "verify" && (
          <>
            <div className="auth-header">
              <div className="section-tag" style={{ marginBottom: 12 }}>
                Verification
              </div>
              <h2 className="font-display auth-title">VERIFY EMAIL</h2>
              <p className="auth-subtitle">
                Enter the token sent to your email.
              </p>
            </div>
            <form onSubmit={handleVerify} className="auth-form">
              <div className="field">
                <label className="field-label font-mono">
                  Verification Token
                </label>
                <input
                  className="sharp-input font-mono"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  placeholder="Paste token here"
                  style={{ letterSpacing: "0.1em", fontSize: "1rem" }}
                />
              </div>
              {error && <p className="auth-error font-mono">{error}</p>}
              {success && <p className="auth-success font-mono">{success}</p>}
              <button
                className="btn-primary w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Verifying…" : "Verify →"}
              </button>
            </form>
            <div className="auth-links">
              <span>Didn't get one?</span>
              <button
                className="auth-link font-mono"
                onClick={() => {
                  clearMessages();
                  setView("resend");
                }}
              >
                Resend Token
              </button>
            </div>
            <div className="auth-links">
              <button
                className="auth-link font-mono"
                onClick={() => {
                  clearMessages();
                  setView("login");
                }}
              >
                ← Back to Login
              </button>
            </div>
          </>
        )}

        {view === "resend" && (
          <>
            <div className="auth-header">
              <div className="section-tag" style={{ marginBottom: 12 }}>
                Resend
              </div>
              <h2 className="font-display auth-title">RESEND TOKEN</h2>
            </div>
            <form onSubmit={handleResend} className="auth-form">
              <div className="field">
                <label className="field-label font-mono">Email</label>
                <input
                  className="sharp-input"
                  type="email"
                  value={pendingEmail || email}
                  onChange={(e) => setPendingEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              {error && <p className="auth-error font-mono">{error}</p>}
              {success && <p className="auth-success font-mono">{success}</p>}
              <button
                className="btn-primary w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending…" : "Send New Token →"}
              </button>
            </form>
            <div className="auth-links">
              <button
                className="auth-link font-mono"
                onClick={() => {
                  clearMessages();
                  setView("verify");
                }}
              >
                ← Back to Verify
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .auth-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .auth-modal {
          background: #111; width: 100%; max-width: 440px;
          padding: 40px; position: relative;
        }
        .auth-close {
          position: absolute; top: 16px; right: 16px;
          background: none; border: none; color: rgba(245,240,232,0.4);
          cursor: pointer; font-size: 0.75rem; letter-spacing: 0.1em;
          transition: color 0.2s;
        }
        .auth-close:hover { color: #cb1b3a; }
        .auth-header { margin-bottom: 28px; }
        .auth-title { font-size: 2rem; letter-spacing: 0.04em; color: #f5f0e8; line-height: 1; }
        .auth-subtitle { color: rgba(245,240,232,0.5); font-size: 0.88rem; margin-top: 8px; line-height: 1.6; }
        .auth-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 0.6rem; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(245,240,232,0.4); }
        .auth-error { color: #cb1b3a; font-size: 0.72rem; letter-spacing: 0.05em; padding: 8px 12px; background: rgba(203,27,58,0.1); border: 1px solid rgba(203,27,58,0.3); }
        .auth-success { color: #226d0b; font-size: 0.72rem; letter-spacing: 0.05em; padding: 8px 12px; background: rgba(34,109,11,0.1); border: 1px solid rgba(34,109,11,0.3); }
        .auth-links { display: flex; gap: 8px; align-items: center; font-size: 0.78rem; color: rgba(245,240,232,0.4); margin-top: 8px; flex-wrap: wrap; }
        .auth-link { background: none; border: none; color: #dfa651; cursor: pointer; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: underline; text-decoration-color: rgba(223,166,81,0.4); padding: 0; }
        .auth-link:hover { text-decoration-color: #dfa651; }
        .w-full { width: 100%; text-align: center; }
      `}</style>
    </div>
  );
}

export default withConvexProvider(AuthModal);
