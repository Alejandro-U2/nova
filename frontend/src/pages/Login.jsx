import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import '../styles/login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const gradientRef = useRef(null);
  const LOADER_MS = 900; // slightly faster loader
  const CROSSFADE_MS = 420;
  const location = useLocation();
  const forcedSkip = !!(location && location.state && location.state.skipLoader);
  // sessionStorage flag to show loader only once per browser session
  const loaderShown = typeof window !== 'undefined' && sessionStorage.getItem('nova_loader_shown') === '1';
  // Detect navigation type: on a fresh page load (type 'navigate') we want the loader to show
  let navType = 'navigate';
  try {
    const entries = (typeof performance !== 'undefined' && performance.getEntriesByType) ? performance.getEntriesByType('navigation') : null;
    if (entries && entries[0] && entries[0].type) navType = entries[0].type;
    else if (typeof window !== 'undefined' && window.performance && window.performance.navigation) {
      // fallback: 0 = navigate, 1 = reload, 2 = back_forward
      navType = window.performance.navigation.type === 1 ? 'reload' : 'navigate';
    }
  } catch { /* ignore */ }
  // Allow forcing the loader via URL param for testing (e.g. ?forceLoader=1)
  let forceLoaderParam = false;
  try {
    const qp = (typeof window !== 'undefined' && window.location && window.location.search) ? new URLSearchParams(window.location.search) : null;
    forceLoaderParam = qp ? (qp.get('forceLoader') === '1' || qp.get('loader') === '1') : false;
  } catch { /* ignore */ }

  // Skip loader only if forcedSkip OR loader was shown this session AND this is NOT a fresh navigate load, unless forceLoaderParam is true
  const shouldSkipLoader = forcedSkip || (loaderShown && navType !== 'navigate' && !forceLoaderParam);
  // If shouldSkipLoader is true, start with loader hidden and content visible
  const [loaderVisible, setLoaderVisible] = useState(!shouldSkipLoader);
  const [contentVisible, setContentVisible] = useState(shouldSkipLoader);
  const [removeLoader, setRemoveLoader] = useState(shouldSkipLoader);
  // show a transition loader when logging in successfully
  const [showTransitionLoader, setShowTransitionLoader] = useState(false);

  // --- Social & Captcha configuration (from environment) ---
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '';
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState(null);

  const loadScript = (src, id) => new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no-window'));
    if (id && document.getElementById(id)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    if (id) s.id = id;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });

  // Initialize social SDKs and reCAPTCHA if keys present
  useEffect(() => {
    let mounted = true;
    if (GOOGLE_CLIENT_ID) {
      loadScript('https://accounts.google.com/gsi/client', 'gsi-client').then(() => {
        try {
          if (!mounted) return;
          if (window.google && window.google.accounts && window.google.accounts.id) {
            window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential });
          }
        } catch { /* ignore */ }
      }).catch(() => { /* ignore */ });
    }

    if (FACEBOOK_APP_ID) {
      loadScript('https://connect.facebook.net/en_US/sdk.js', 'fb-sdk').then(() => {
        try {
          if (!mounted) return;
          if (window.FB) {
            window.FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v12.0' });
          }
        } catch { /* ignore */ }
      }).catch(() => { /* ignore */ });
    }

    if (RECAPTCHA_SITE_KEY) {
      loadScript('https://www.google.com/recaptcha/api.js?render=explicit', 'recaptcha').then(() => {
        try {
          if (!mounted) return;
          if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
            const id = window.grecaptcha.render('recaptcha-container', {
              sitekey: RECAPTCHA_SITE_KEY,
              size: 'normal',
            });
            setRecaptchaWidgetId(id);
          }
        } catch { /* ignore */ }
      }).catch(() => { /* ignore */ });
    }

    return () => { mounted = false; };
  }, []); // eslint-disable-line

  // Google credential callback
  const handleGoogleCredential = async (response) => {
    // response.credential is a JWT token containing Google user info
    // Send to backend for verification / sign-in or create
    if (!response || !response.credential) return;
    try {
      const res = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: response.credential }) });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        try { sessionStorage.setItem('nova_loader_shown', '1'); } catch { /* ignore */ }
        try {
          if (remember) localStorage.setItem('nova_remember', JSON.stringify({ email }));
          else localStorage.removeItem('nova_remember');
        } catch { /* ignore */ }
        setShowTransitionLoader(true);
        setTimeout(() => navigate('/inicio'), 700);
      } else {
        setAlert({ show: true, type: 'error', text: data.message || 'Error en inicio con Google' });
      }
    } catch {
      setAlert({ show: true, type: 'error', text: 'Error de conexión con el servidor' });
    }
  };

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID || !window.google || !window.google.accounts || !window.google.accounts.id) {
      setAlert({ show: true, type: 'error', text: 'Google login no está configurado' });
      return;
    }
    // Use the One Tap / prompt flow
  try { window.google.accounts.id.prompt(); } catch { setAlert({ show: true, type: 'error', text: 'No se pudo iniciar Google Sign-In' }); }
  };

  const handleFacebookLogin = () => {
    if (!FACEBOOK_APP_ID || !window.FB) {
      setAlert({ show: true, type: 'error', text: 'Facebook login no está configurado' });
      return;
    }
    window.FB.login(function(response) {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        // send token to backend for verification/exchange
        (async () => {
          try {
            const res = await fetch('/api/auth/facebook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken }) });
            const data = await res.json();
            if (res.ok) {
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              try { sessionStorage.setItem('nova_loader_shown', '1'); } catch { /* ignore */ }
              setShowTransitionLoader(true);
              setTimeout(() => navigate('/inicio'), 700);
            } else {
              setAlert({ show: true, type: 'error', text: data.message || 'Error en inicio con Facebook' });
            }
          } catch { setAlert({ show: true, type: 'error', text: 'Error de conexión con el servidor' }); }
        })();
      } else {
        setAlert({ show: true, type: 'error', text: 'No se autorizó Facebook' });
      }
    }, { scope: 'email' });
  };

  const verifyRecaptcha = () => {
    if (!RECAPTCHA_SITE_KEY) return true; // no captcha configured -> pass
    try {
      if (!window.grecaptcha || recaptchaWidgetId === null) return false;
      const resp = window.grecaptcha.getResponse(recaptchaWidgetId);
      return !!resp;
    } catch { return false; }
  };

  // form UI state
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [alert, setAlert] = useState({ show: false, type: 'error', text: '' });
  const [remember, setRemember] = useState(false);

  // clear-on-focus behavior: DO NOT remove existing text on focus; just hide placeholder and optionally select
  const handleClearOnFocus = (setter, placeholder) => (e) => {
    // keep the setter argument for compatibility with call sites
    void setter;
    try {
      // store original placeholder and clear it
      e.target.dataset.ph = placeholder || e.target.placeholder || '';
      e.target.placeholder = '';
      if (typeof e.target.select === 'function') e.target.select();
    } catch { /* ignore */ }
  };

  const handleRestorePlaceholder = (placeholder) => (e) => {
    try { if (!e.target.value) e.target.placeholder = placeholder; } catch { /* ignore */ }
  };

  useEffect(() => {
    // load remembered credentials (email/nickname) if present
    try {
      const raw = localStorage.getItem('nova_remember');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.email) {
          setEmail(obj.email);
          setRemember(true);
        }
      }
    } catch {
      // ignore parse errors
    }
    const el = gradientRef.current;
    if (!el) return;
    // Smooth gradient interpolation using requestAnimationFrame
    const palettes = [
      ['62,35,255', '60,255,60'],
      ['255,35,98', '45,175,230'],
      ['214,41,118', '254,218,117'],
      ['255,0,255', '255,128,0'],
    ];

    let idx = 0;
    let animationId = null;
    let start = null;
    const DURATION = 3200; // ms for each transition

    const parse = (s) => s.split(',').map(Number);
    const lerp = (a, b, t) => a + (b - a) * t;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const t = Math.min((timestamp - start) / DURATION, 1);

      const c0 = palettes[idx % palettes.length];
      const c1 = palettes[(idx + 1) % palettes.length];
      const fromA = parse(c0[0]);
      const fromB = parse(c0[1]);
      const toA = parse(c1[0]);
      const toB = parse(c1[1]);

      const r1 = Math.round(lerp(fromA[0], toA[0], t));
      const g1 = Math.round(lerp(fromA[1], toA[1], t));
      const b1 = Math.round(lerp(fromA[2], toA[2], t));

      const r2 = Math.round(lerp(fromB[0], toB[0], t));
      const g2 = Math.round(lerp(fromB[1], toB[1], t));
      const b2 = Math.round(lerp(fromB[2], toB[2], t));

      el.style.backgroundImage = `linear-gradient(45deg, rgb(${r1},${g1},${b1}), rgb(${r2},${g2},${b2}))`;

      if (t < 1) {
        animationId = requestAnimationFrame(step);
      } else {
        // move to next
        idx = (idx + 1) % palettes.length;
        start = null;
        animationId = requestAnimationFrame(step);
      }
    };

    animationId = requestAnimationFrame(step);
    return () => { if (animationId) cancelAnimationFrame(animationId); };
  }, []);

  useEffect(() => {
    // If navigation requested to skip the loader or the loader was already shown this session, do nothing — states were initialized above
    if (shouldSkipLoader) return;
    let mounted = true;
    const wait = new Promise((r) => setTimeout(r, LOADER_MS));
    const img = new Image();
    const imgLoad = new Promise((r) => { img.onload = () => r(true); img.onerror = () => r(false); img.src = '/img/nova.png'; });
    Promise.all([wait, imgLoad]).then(() => {
      if (!mounted) return;
      setContentVisible(true);
      // mark that loader was shown for this session so it won't reappear on simple navigations
      try { sessionStorage.setItem('nova_loader_shown', '1'); } catch { /* ignore */ }
      setTimeout(() => setLoaderVisible(false), 40);
      setTimeout(() => setRemoveLoader(true), CROSSFADE_MS + 80);
    });
    return () => { mounted = false; };
  }, [shouldSkipLoader]);

  const validate = () => {
    const e = { email: '', password: '' };
    const val = (email || '').trim();
    if (!val) {
      e.email = 'El correo o nickname es requerido';
    } else {
      if (val.indexOf('@') >= 0) {
        // treat as email
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(val)) e.email = 'Email inválido';
      } else {
        // treat as nickname: allow letters, numbers, underscore, dot and hyphen, min 3 chars
        if (!/^[\w.-]{3,}$/i.test(val)) e.email = 'Nickname inválido (mín. 3 caracteres)';
      }
    }
    if (!password) e.password = 'La contraseña es requerida';
    setErrors(e);
    return !e.email && !e.password;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setAlert({ show: false, text: '' });
    if (!validate()) return;
    if (!verifyRecaptcha()) { setAlert({ show: true, type: 'error', text: 'Completa el captcha antes de continuar' }); return; }
    try {
      const res = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({ show: true, type: 'success', text: 'Inicio de sesión exitoso' });
        // Save auth and show a transition loader while entering the system
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        try { sessionStorage.setItem('nova_loader_shown', '1'); } catch { /* ignore */ }
        try {
          if (remember) localStorage.setItem('nova_remember', JSON.stringify({ email }));
          else localStorage.removeItem('nova_remember');
        } catch { /* ignore */ }
        setShowTransitionLoader(true);
        setTimeout(() => navigate('/inicio'), 700);
      } else {
        setAlert({ show: true, type: 'error', text: data.message || 'Credenciales inválidas' });
      }
    } catch (err) {
      console.error(err);
      setAlert({ show: true, type: 'error', text: 'Error de conexión con el servidor' });
    }
  };

  return (
    <>
      {showTransitionLoader && (
        <div className="loader-screen visible" style={{ position: 'fixed', inset: 0, zIndex: 1200 }}>
          <div className="loader-content">
            <img src="/gif/snoopu.gif" alt="loading" className="loader-gif" />
            <h2 className="loader-text">Ingresando <span>al sistema</span></h2>
          </div>
        </div>
      )}
      {!removeLoader && (
        <div className={`loader-screen ${loaderVisible ? 'visible' : 'hidden'}`}>
          <div className="loader-content">
            <img src="/gif/snoopu.gif" alt="loading" className="loader-gif" />
            <h2 className="loader-text">Espere un <span>momento</span></h2>
          </div>
        </div>
      )}

  <div className={`main-wrap ${contentVisible ? 'visible' : ''} login-page`}>
        <div id="gradient" ref={gradientRef} className="fade-in">
          <div className="wrapper">
            <div className="container">
              <img src="/img/nova.png" alt="Nova" className="logo-img" />
              <p className="login-subtitle">Ingresa con tu email y contraseña</p>

              <div className={`alert-card ${alert.type} ${alert.show ? 'show' : ''}`} role="status" aria-hidden={!alert.show}>
                {alert.type === 'success' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#2ecc71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 9v4" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 17h.01" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
                <div style={{ marginLeft: 8 }}>{alert.text}</div>
              </div>

              <div className="login-form-container">
                <form onSubmit={handleSubmit}>
                  <div className="input-with-icon">
                    <svg className="input-icon" width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M10 10a3.333 3.333 0 100-6.667 3.333 3.333 0 000 6.667zM15 16.667a5 5 0 10-10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input type="text" placeholder="Correo electrónico o nickname" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" onFocus={handleClearOnFocus(setEmail, 'Correo electrónico o nickname')} onBlur={handleRestorePlaceholder('Correo electrónico o nickname')} />
                    {errors.email && <p className="field-error">{errors.email}</p>}
                  </div>

                  <div className="input-with-icon password-group">
                    <svg className="input-icon" width="22" height="22" viewBox="0 0 20 20" fill="none">
                      <path d="M15.833 9.167H4.167C3.247 9.167 2.5 9.914 2.5 10.833v4.167c0 .92.747 1.667 1.667 1.667h11.666c.92 0 1.667-.746 1.667-1.667v-4.167c0-.92-.746-1.666-1.667-1.666zM5.833 9.167V5.833a4.167 4.167 0 018.334 0v3.334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" onFocus={handleClearOnFocus(setPassword, 'Contraseña')} onBlur={handleRestorePlaceholder('Contraseña')} />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword((s) => !s)} aria-pressed={showPassword} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                      {showPassword ? (
                        // eye open SVG
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        // eye closed SVG
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.78 21.78 0 015.06-5.94" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    {errors.password && <p className="field-error">{errors.password}</p>}
                  </div>

                  <div style={{ height: 10 }} />

                  {/* Remember + social buttons block (migrated from provided HTML) */}
                  <div className="remember">
                    <label className="remember-label"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Recuérdame</label>
                    <a href="#">Olvidaste la contraseña</a>
                  </div>

                  <button type="submit" className="btnn">Iniciar Sesión</button>

                  <div className="button">
                    <button type="button" onClick={handleGoogleLogin} className="social google"> 
                      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="#ffffff"><path d="M21.8 10.1h-9.8v3.8h5.6c-.6 2-2.6 3.9-5.6 3.9-3.2 0-5.8-2.7-5.8-6s2.6-6 5.8-6c1.9 0 3.1.8 3.8 1.5l2.7-2.6C17 3.1 15 2.2 12 2.2 6.6 2.2 2.2 6.7 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.8-4 9.8-9.8 0-.7-.1-1.4-.2-1.9z"/></svg>
                      <span>Iniciar sesión con Google</span>
                    </button>
                    <button type="button" onClick={handleFacebookLogin} className="social facebook">
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="#ffffff"><path d="M22 12.07C22 6.61 17.52 2.13 12.06 2.13 6.61 2.13 2.13 6.61 2.13 12.07c0 4.89 3.55 8.94 8.19 9.75v-6.9H8.2v-2.85h2.12V9.03c0-2.08 1.23-3.22 3.12-3.22.9 0 1.84.16 1.84.16v2.03h-1.04c-1.02 0-1.34.64-1.34 1.29v1.56h2.28l-.36 2.85h-1.92v6.9c4.63-.81 8.19-4.86 8.19-9.75z"/></svg>
                      <span>Iniciar sesión con Facebook</span>
                    </button>
                  </div>

                  <p className="create-account">¿No tienes cuenta? <Link to="/register">Crea una cuenta aquí</Link></p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
