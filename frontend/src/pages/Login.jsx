import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import '../styles/login.css';
import Loader from "../components/Loader";   // ⬅️ Import del nuevo componente

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
  const loaderShown = typeof window !== 'undefined' && sessionStorage.getItem('nova_loader_shown') === '1';

  let navType = 'navigate';
  try {
    const entries = (typeof performance !== 'undefined' && performance.getEntriesByType) ? performance.getEntriesByType('navigation') : null;
    if (entries && entries[0] && entries[0].type) navType = entries[0].type;
    else if (typeof window !== 'undefined' && window.performance && window.performance.navigation) {
      navType = window.performance.navigation.type === 1 ? 'reload' : 'navigate';
    }
  } catch { /* ignore */ }

  let forceLoaderParam = false;
  let skipLoaderParam = false;
  try {
    const qp = (typeof window !== 'undefined' && window.location && window.location.search) ? new URLSearchParams(window.location.search) : null;
    forceLoaderParam = qp ? (qp.get('forceLoader') === '1' || qp.get('loader') === '1') : false;
    skipLoaderParam = qp ? qp.get('skipLoader') === '1' : false;
  } catch { /* ignore */ }

  const shouldSkipLoader = forcedSkip || skipLoaderParam || (loaderShown && navType !== 'navigate' && !forceLoaderParam);

  const [loaderVisible, setLoaderVisible] = useState(!shouldSkipLoader);
  const [contentVisible, setContentVisible] = useState(shouldSkipLoader);
  const [removeLoader, setRemoveLoader] = useState(shouldSkipLoader);
  const [showTransitionLoader, setShowTransitionLoader] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '430026294395-41egmg0q1jj0krs2l9q67dmg0b82plt8.apps.googleusercontent.com';
  const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '';
  
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [captchaToken, setCaptchaToken] = useState(null);

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

  useEffect(() => {
    let mounted = true;

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

    return () => { mounted = false; };
  }, []); // eslint-disable-line

  // ============================================================
  // 🔹 LOGIN CON GOOGLE usando @react-oauth/google
  // ============================================================
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);

      // Datos del usuario Google
      const googleData = {
        email: decoded.email,
        name: decoded.name,
        image: decoded.picture,
        sub: decoded.sub, // ID único de Google
        credential: credentialResponse.credential,
      };

      const res = await fetch(`${API_URL}/users/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData),
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        try { sessionStorage.setItem('nova_loader_shown', '1'); } catch { /* ignore */ }
        setAlert({ show: true, type: 'success', text: 'Inicio de sesión con Google exitoso' });
        setShowTransitionLoader(true);
        setTimeout(() => navigate('/home'), 700);
      } else {
        setAlert({ show: true, type: 'error', text: data.message || 'Error al iniciar sesión con Google' });
      }
    } catch (error) {
      console.error('Error en login con Google:', error);
      setAlert({ show: true, type: 'error', text: 'Error al procesar el inicio de sesión con Google' });
    }
  };

  const handleGoogleError = () => {
    setAlert({ show: true, type: 'error', text: 'Error en la autenticación con Google' });
  };

  const handleFacebookLogin = () => {
    if (!FACEBOOK_APP_ID || !window.FB) {
      setAlert({ show: true, type: 'error', text: 'Facebook login no está configurado' });
      return;
    }
    window.FB.login(function(response) {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        (async () => {
          try {
            const res = await fetch('/api/auth/facebook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken }) });
            const data = await res.json();
            if (res.ok) {
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              try { sessionStorage.setItem('nova_loader_shown', '1'); } catch { /* ignore */ }
              setShowTransitionLoader(true);
              setTimeout(() => navigate('/home'), 700);
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

  const verifyRecaptcha = async () => {
    if (!executeRecaptcha) {
      console.log('reCAPTCHA no disponible aún');
      return null;
    }

    try {
      const token = await executeRecaptcha('login');
      return token;
    } catch (error) {
      console.error('Error ejecutando reCAPTCHA:', error);
      return null;
    }
  };

  const [errors, setErrors] = useState({ email: '', password: '' });
  const [alert, setAlert] = useState({ show: false, type: 'error', text: '' });
  const [remember, setRemember] = useState(false);

  const handleClearOnFocus = (setter, placeholder) => (e) => {
    void setter;
    try {
      e.target.dataset.ph = placeholder || e.target.placeholder || '';
      e.target.placeholder = '';
      if (typeof e.target.select === 'function') e.target.select();
    } catch { /* ignore */ }
  };

  const handleRestorePlaceholder = (placeholder) => (e) => {
    try { if (!e.target.value) e.target.placeholder = placeholder; } catch { /* ignore */ }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nova_remember');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.email) {
          setEmail(obj.email);
          setRemember(true);
        }
      }
    } catch { /* ignore */ }

    const el = gradientRef.current;
    if (!el) return;
    const basePalettes = [
      ['62,35,255', '60,255,60'],
      ['255,35,98', '45,175,230'],
      ['214,41,118', '254,218,117'],
      ['255,0,255', '255,128,0'],
    ];
    
    // Agregar el primer color al final para crear un loop circular suave
    const palettes = [...basePalettes, basePalettes[0]];

    let idx = 0;
    let animationId = null;
    let start = null;
    const DURATION = 3200;

    const parse = (s) => s.split(',').map(Number);
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / DURATION, 1);
      const t = easeInOutCubic(progress);

      const c0 = palettes[idx];
      const c1 = palettes[idx + 1];
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

      if (progress < 1) {
        animationId = requestAnimationFrame(step);
      } else {
        // Reiniciar al principio cuando llegue al último color
        idx = idx + 1 >= palettes.length - 1 ? 0 : idx + 1;
        start = null;
        animationId = requestAnimationFrame(step);
      }
    };

    animationId = requestAnimationFrame(step);
    return () => { if (animationId) cancelAnimationFrame(animationId); };
  }, []);

  useEffect(() => {
    if (shouldSkipLoader) return;
    let mounted = true;
    const wait = new Promise((r) => setTimeout(r, LOADER_MS));
    const img = new Image();
    const imgLoad = new Promise((r) => { img.onload = () => r(true); img.onerror = () => r(false); img.src = '/img/nova.png'; });
    Promise.all([wait, imgLoad]).then(() => {
      if (!mounted) return;
      setContentVisible(true);
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
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(val)) e.email = 'Email inválido';
      } else {
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
    
    // Ejecutar reCAPTCHA v3
    const captchaToken = await verifyRecaptcha();
    if (!captchaToken) { 
      setAlert({ show: true, type: 'error', text: '❌ Error al verificar reCAPTCHA. Intenta de nuevo.' }); 
      return; 
    }

    try {
      const res = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAlert({ show: true, type: 'success', text: '✅ Inicio de sesión exitoso' });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        try { sessionStorage.setItem('nova_loader_shown', '1'); } catch { /* ignore */ }
        try {
          if (remember) localStorage.setItem('nova_remember', JSON.stringify({ email }));
          else localStorage.removeItem('nova_remember');
        } catch { /* ignore */ }
        setShowTransitionLoader(true);
        setTimeout(() => navigate('/home'), 700);
      } else {
        setAlert({ show: true, type: 'error', text: `❌ ${data.message || 'Credenciales inválidas'}` });
      }
    } catch (err) {
      console.error(err);
      setAlert({ show: true, type: 'error', text: '❌ Error de conexión con el servidor' });
    }
  };

  return (
    <>
      {/* Loader al loguear */}
      <Loader 
        show={showTransitionLoader} 
        text="Ingresando al sistema" 
        fixed 
        image="/img/nova.png"
        hideText={true}
      />

      {/* Loader inicial */}
      <Loader 
        show={!removeLoader && loaderVisible} 
        text="Espere un momento" 
        image="/img/nova.png" 
      />

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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.78 21.78 0 015.06-5.94" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    {errors.password && <p className="field-error">{errors.password}</p>}
                  </div>

                  <div style={{ height: 10 }} />

                  <div className="remember">
                    <label className="remember-label"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Recuérdame</label>
                    <a href="#">Olvidaste la contraseña</a>
                  </div>

                  {/* ✅ reCAPTCHA v3 es invisible - se ejecuta automáticamente al enviar */}
                  
                  <button type="submit" className="btnn">Iniciar Sesión</button>

                  <div className="button">
                    {/* LOGIN CON GOOGLE usando @react-oauth/google */}
                    <div className="social-google-wrapper">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_blue"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                        logo_alignment="left"
                        width="100%"
                      />
                    </div>
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
