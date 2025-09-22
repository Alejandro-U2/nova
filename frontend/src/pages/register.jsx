import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/login.css';

export default function Register() {
	const navigate = useNavigate();

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

	useEffect(() => {
		let mounted = true;
		if (GOOGLE_CLIENT_ID) {
			loadScript('https://accounts.google.com/gsi/client', 'gsi-client').then(() => {
				if (!mounted) return;
			}).catch(() => { /* ignore */ });
		}
		if (FACEBOOK_APP_ID) {
			loadScript('https://connect.facebook.net/en_US/sdk.js', 'fb-sdk').then(() => {
				if (!mounted) return;
			}).catch(() => { /* ignore */ });
		}
		if (RECAPTCHA_SITE_KEY) {
			loadScript('https://www.google.com/recaptcha/api.js?render=explicit', 'recaptcha').then(() => {
				if (!mounted) return;
				if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
					const id = window.grecaptcha.render('recaptcha-container-register', { sitekey: RECAPTCHA_SITE_KEY, size: 'normal' });
					setRecaptchaWidgetId(id);
				}
			}).catch(() => { /* ignore */ });
		}
		return () => { mounted = false; };
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const verifyRecaptcha = () => {
		if (!RECAPTCHA_SITE_KEY) return true;
		try { if (!window.grecaptcha || recaptchaWidgetId === null) return false; const resp = window.grecaptcha.getResponse(recaptchaWidgetId); return !!resp; } catch { return false; }
	};

	const [name, setName] = useState('');
	const [lastname, setLastname] = useState('');
	const [nickname, setNickname] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [message, setMessage] = useState(null);
	const [messageExpanded, setMessageExpanded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
		const [validation, setValidation] = useState({
			name: null,
			lastname: null,
			nickname: null,
			email: null,
			password: null,
		});
			const [toast, setToast] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();

			// Basic client-side validation matching backend requirements
				// Validate fields and update inline validation state
				const nextValidation = { ...validation };
				nextValidation.name = name.trim().length > 1;
				nextValidation.lastname = lastname.trim().length > 1;
				nextValidation.nickname = nickname.trim().length >= 3;
				nextValidation.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
				nextValidation.password = password.length >= 6;
				setValidation(nextValidation);

				const allOk = Object.values(nextValidation).every(Boolean);
				if (!allOk) {
					// Build specific error messages for the alert area
					const messages = [];
					if (nextValidation.name === false) messages.push('El nombre debe tener al menos 2 caracteres.');
					if (nextValidation.lastname === false) messages.push('El apellido debe tener al menos 2 caracteres.');
					if (nextValidation.nickname === false) messages.push('El nickname debe tener al menos 3 caracteres.');
					if (nextValidation.email === false) messages.push('Correo electrónico inválido.');
					if (nextValidation.password === false) messages.push('La contraseña debe tener al menos 6 caracteres.');
					setMessage({ text: messages.join(' '), color: 'crimson' });
					return;
				}

		if (!verifyRecaptcha()) { setMessage({ text: 'Completa el captcha antes de continuar', color: 'crimson' }); return; }
		setLoading(true);
		try {
			const res = await fetch('http://localhost:5000/api/users/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, lastname, nickname, email, password }),
			});

			const data = await res.json();
			if (res.ok) {
				setMessage({ text: 'Registro exitoso. Redirigiendo...', color: 'green' });
					setToast({ type: 'ok', text: 'Usuario creado' });
				setTimeout(() => navigate('/login'), 1100);
			} else {
					setMessage({ text: data.message || 'Error en el registro', color: 'crimson' });
					setToast({ type: 'err', text: data.message || 'Error en el registro' });
			}
		} catch (error) {
			console.error('Register error:', error);
			setMessage({ text: 'No se pudo conectar al servidor', color: 'crimson' });
		} finally {
			setLoading(false);
		}
	};

		// auto-hide toast
		useEffect(() => {
			if (!toast) return;
			const t = setTimeout(() => setToast(null), 2800);
			return () => clearTimeout(t);
		}, [toast]);

	// clear-on-focus and placeholder restore (same behavior as Login)
	// Do NOT clear existing input value on focus; only manage placeholder and selection
	const handleClearOnFocus = (setter, placeholder) => (e) => {
		// keep setter param for backward compatibility with call sites
		void setter;
		if (e && e.target) {
			// store original placeholder and clear it
			e.target.dataset.ph = placeholder || e.target.placeholder || '';
			e.target.placeholder = '';
			if (typeof e.target.select === 'function') e.target.select();
		}
	};

	const handleRestorePlaceholder = (placeholder) => (e) => {
		if (e && e.target && !e.target.value) {
			e.target.placeholder = placeholder;
		}
	};

		return (
					<div className="main-wrap visible register-page">
				<div id="gradient" className="fade-in">
					<div className="wrapper">
						<div className="container">
							<img src="/img/nova.png" alt="Nova" className="logo-img" />
							{/* Hide subtitle when message is present and show alert in its place */}
							{!message && <p className="login-subtitle">Crea tu cuenta</p>}

							{message && (
								<div className={`alert-card ${message ? 'error show' : ''} ${messageExpanded ? 'expanded' : ''}`} role="status" aria-hidden={!message}>
									<div className="alert-body" style={{ marginLeft: 8 }}>{message ? message.text : ''}</div>
									{message && message.text && message.text.length > 120 && (
										<button type="button" className="alert-toggle" onClick={() => setMessageExpanded(s => !s)} aria-expanded={messageExpanded}>
											{messageExpanded ? 'Ver menos' : 'Ver más'}
										</button>
									)}
								</div>
							)}

							<div className="login-form-container">
								<form onSubmit={handleSubmit}>
									<div className={`input-with-icon ${validation.name === false ? 'invalid' : validation.name === true ? 'valid' : ''}`}>
										<svg className="input-icon" width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 10a3.333 3.333 0 100-6.667 3.333 3.333 0 000 6.667zM15 16.667a5 5 0 10-10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
										<input value={name} onChange={(e) => { setName(e.target.value); setValidation(v => ({ ...v, name: null })); }} placeholder="Nombre" required onFocus={handleClearOnFocus(setName, 'Nombre')} onBlur={handleRestorePlaceholder('Nombre')} />
									</div>

									<div className={`input-with-icon ${validation.lastname === false ? 'invalid' : validation.lastname === true ? 'valid' : ''}`}>
										<svg className="input-icon" width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 10a3.333 3.333 0 100-6.667 3.333 3.333 0 000 6.667zM15 16.667a5 5 0 10-10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
										<input value={lastname} onChange={(e) => { setLastname(e.target.value); setValidation(v => ({ ...v, lastname: null })); }} placeholder="Apellido" required onFocus={handleClearOnFocus(setLastname, 'Apellido')} onBlur={handleRestorePlaceholder('Apellido')} />
									</div>

									<div className={`input-with-icon ${validation.nickname === false ? 'invalid' : validation.nickname === true ? 'valid' : ''}`}>
										<svg className="input-icon" width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 4h12v12H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
										<input value={nickname} onChange={(e) => { setNickname(e.target.value); setValidation(v => ({ ...v, nickname: null })); }} placeholder="Nickname" required onFocus={handleClearOnFocus(setNickname, 'Nickname')} onBlur={handleRestorePlaceholder('Nickname')} />
									</div>

									<div className={`input-with-icon ${validation.email === false ? 'invalid' : validation.email === true ? 'valid' : ''}`}>
										<svg className="input-icon" width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2 5l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
										<input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setValidation(v => ({ ...v, email: null })); }} placeholder="Correo electrónico" required onFocus={handleClearOnFocus(setEmail, 'Correo electrónico')} onBlur={handleRestorePlaceholder('Correo electrónico')} />
									</div>

									<div className={`input-with-icon password-group ${validation.password === false ? 'invalid' : validation.password === true ? 'valid' : ''}`}>
										<svg className="input-icon" width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M15.833 9.167H4.167C3.247 9.167 2.5 9.914 2.5 10.833v4.167c0 .92.747 1.667 1.667 1.667h11.666c.92 0 1.667-.746 1.667-1.667v-4.167c0-.92-.746-1.666-1.667-1.666zM5.833 9.167V5.833a4.167 4.167 0 018.334 0v3.334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
										<input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setValidation(v => ({ ...v, password: null })); }} placeholder="Contraseña (mín. 6 caracteres)" required onFocus={handleClearOnFocus(setPassword, 'Contraseña (mín. 6 caracteres)')} onBlur={handleRestorePlaceholder('Contraseña (mín. 6 caracteres)')} />
										<button type="button" className="password-toggle" onClick={() => setShowPassword(s => !s)} aria-pressed={showPassword} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
											{showPassword ? (
												<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
											) : (
												<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.78 21.78 0 015.06-5.94" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
											)}
										</button>
									</div>

									<button type="submit" className="btnn" disabled={loading}>{loading ? 'Registrando...' : 'Registrar'}</button>

									<div className="button">
										<button type="button" onClick={() => { if (!GOOGLE_CLIENT_ID) setMessage({ text: 'Google no configurado', color: 'crimson' }); else window.google && window.google.accounts && window.google.accounts.id && window.google.accounts.id.prompt(); }} className="social google">
											<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="#ffffff"><path d="M21.8 10.1h-9.8v3.8h5.6c-.6 2-2.6 3.9-5.6 3.9-3.2 0-5.8-2.7-5.8-6s2.6-6 5.8-6c1.9 0 3.1.8 3.8 1.5l2.7-2.6C17 3.1 15 2.2 12 2.2 6.6 2.2 2.2 6.7 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.8-4 9.8-9.8 0-.7-.1-1.4-.2-1.9z"/></svg>
											<span>Iniciar sesión con Google</span>
										</button>
										<button type="button" onClick={() => { if (!FACEBOOK_APP_ID) setMessage({ text: 'Facebook no configurado', color: 'crimson' }); else window.FB && window.FB.login && window.FB.login(); }} className="social facebook">
											<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="#ffffff"><path d="M22 12.07C22 6.61 17.52 2.13 12.06 2.13 6.61 2.13 2.13 6.61 2.13 12.07c0 4.89 3.55 8.94 8.19 9.75v-6.9H8.2v-2.85h2.12V9.03c0-2.08 1.23-3.22 3.12-3.22.9 0 1.84.16 1.84.16v2.03h-1.04c-1.02 0-1.34.64-1.34 1.29v1.56h2.28l-.36 2.85h-1.92v6.9c4.63-.81 8.19-4.86 8.19-9.75z"/></svg>
											<span>Iniciar sesión con Facebook</span>
										</button>
									</div>

									{/* top alert used instead of bottom duplicate */}

									<p className="signup-text">¿Ya tienes una cuenta? <Link to="/login" state={{ skipLoader: true }}>Ingresa aquí</Link></p>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
