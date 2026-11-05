import React, { useState } from 'react';
import { loginWithEmail, signupWithEmail } from '../firebase.js';

function formatAuthErrorMessage(err) {
  if (!err) return "An unknown error occurred. Please try again.";
  const code = (err.code || err.message || '').toLowerCase();

  if (code.includes('user-not-found') || code.includes('invalid-credential') || code.includes('wrong-password')) {
    return "⚠️ Account not found or password incorrect. Check your email & password, or click Register to create a new account!";
  }
  if (code.includes('invalid-email')) {
    return "⚠️ Please enter a valid email address (e.g. player@example.com).";
  }
  if (code.includes('email-already-in-use')) {
    return "⚠️ This email is already registered! Please click Sign In instead.";
  }
  if (code.includes('weak-password')) {
    return "⚠️ Password is too weak. Please use at least 6 characters.";
  }
  if (code.includes('network-request-failed')) {
    return "⚠️ Connection error. Please check your internet connection and try again.";
  }
  if (code.includes('too-many-requests')) {
    return "⚠️ Too many attempts. Please wait a moment before trying again.";
  }

  return err.message ? err.message.replace(/^Firebase:\s*/i, '').replace(/\(auth\/[a-z-]+\)\.?/i, '').trim() : "Authentication failed.";
}

export default function AuthCard({ authStatus }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 7000);
  };

  const validateEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const handleSignIn = () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) return showError("Please enter both email and password.");
    if (!validateEmail(cleanEmail)) return showError("⚠️ Please enter a valid email format (e.g. player@example.com).");
    setLoading(true);
    loginWithEmail(cleanEmail, password)
      .catch(err => {
        showError(formatAuthErrorMessage(err));
      })
      .finally(() => setLoading(false));
  };

  const handleRegister = () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) return showError("Please enter both email and password.");
    if (!validateEmail(cleanEmail)) return showError("⚠️ Please enter a valid email format (e.g. player@example.com).");
    if (password.length < 6) return showError("Password must be at least 6 characters.");
    setLoading(true);
    signupWithEmail(cleanEmail, password)
      .catch(err => {
        showError(formatAuthErrorMessage(err));
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="card" id="authCard">
      <div className="retro-win-titlebar">
        <span>📁 C:\WINDOWS\SECURITY\GARY_LOGIN_CHECKPOINT_2004.EXE</span>
        <div className="retro-win-controls">
          <button className="retro-win-btn">_</button>
          <button className="retro-win-btn">□</button>
          <button className="retro-win-btn" onClick={() => alert("Windows cannot close this application. It is running at 3am.")}>X</button>
        </div>
      </div>

      <h1>VOXEL 2004</h1>
      <div className="tag">~*~ OFFICIAL 3D VOXEL CYBER-HOMEPAGE BY GARY (AGE 55) ~*~</div>

      <div className="under-construction">
        🚧 🚧 🚧 SITE UNDER HEAVY CONSTRUCTION — CODED AT 3:42 AM 🚧 🚧 🚧
      </div>

      <p style={{ marginBottom: '12px', fontSize: '11px', color: '#000080', fontWeight: 'bold' }}>
        ⚠️ AUTHENTICATION REQUIRED: ENTER YOUR CREDENTIALS SLOWLY. DAVE IF YOU FORGOT YOUR PASSWORD CALL MY LANDLINE AFTER 9AM.
      </p>

      <div className="cloud-panel" style={{ marginTop: 0 }}>
        <div className="cloud-title">🔑 Sign In or Create New Cyber-Account</div>
        <div className="cloud-input-group">
          <input
            id="authEmail"
            type="email"
            className="cloud-input"
            placeholder="Electronic Mail (e.g. gary_bowling1951@aol.com)"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            id="authPassword"
            type="password"
            className="cloud-input"
            placeholder="Secret Password Code (Do Not Share With Timmy)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            onKeyDown={e => {
              if (e.key === 'Enter' && !loading) handleSignIn();
            }}
          />
        </div>
        <div className="cloud-actions" style={{ marginTop: '12px', justifyContent: 'center', gap: '8px' }}>
          <button
            id="authSignInBtn"
            className="cloud-btn"
            disabled={loading}
            onClick={handleSignIn}
            style={{ flex: 1, padding: '10px' }}
          >
            {loading ? "⌛ DIALING MODEM..." : "👉 LOG IN TO THE MATRIX (CLICK HARD) 👈"}
          </button>
          <button
            id="authRegisterBtn"
            className="cloud-btn secondary"
            disabled={loading}
            onClick={handleRegister}
            style={{ flex: 1, padding: '10px' }}
          >
            {loading ? "⌛ TRANSMITTING..." : "📝 NEW CITIZEN REGISTRATION FORM 📝"}
          </button>
        </div>
        {error && (
          <div id="cloudAuthError" style={{ color: '#ff0000', fontSize: '11px', fontWeight: 'bold', marginTop: '8px', lineHeight: 1.3, textAlign: 'center', background: '#ffff99', border: '1px solid #ff0000', padding: '4px' }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ fontSize: '10px', color: '#000080', marginTop: '10px', fontWeight: 'bold', fontStyle: 'italic' }}>
        📌 Note from Gary: If screen flickers, hit the side of your CRT monitor. Cheryl went to bed at 11pm so keep your speakers down.
      </div>

      <div className="retro-badge-row">
        <div className="retro-badge">🌐 IE 6.0 OPTIMIZED</div>
        <div className="retro-badge">🛡️ MCAFEE 2003 VERIFIED</div>
        <div className="retro-badge">☕ SUN JAVA POWERED</div>
        <div className="hit-counter">VISITOR: 00042069</div>
      </div>
    </div>
  );
}
