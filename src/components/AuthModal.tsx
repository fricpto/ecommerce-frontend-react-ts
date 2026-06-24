import { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (email: string, password: string) => void;
}

export function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const reset = () => {
        setEmail(''); setPassword(''); setName('');
        setConfirmPassword(''); setError(null);
        setShowPassword(false); setShowConfirm(false);
    };

    const switchMode = () => { reset(); setIsLoginMode(v => !v); };

    const isValidEmail = (value: string) => value.includes('@') && value.includes('.com');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!isValidEmail(email)) {
                setError('Please enter a valid email address.');
                setLoading(false);
                return;
            }

            if (!isLoginMode) {
                if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
                if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, fullName: name, role: 'USER' }),
                });
                if (!res.ok) throw new Error('Registration failed. Please try again.');
                reset();
                setIsLoginMode(true);
                setError(null);
                return;
            }

            await onLogin(email, password);
            reset();
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Shared input style ────────────────────────────────────
    const inputWrap: React.CSSProperties = {
        position: 'relative', display: 'flex', alignItems: 'center',
    };
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 14px 12px 42px',
        border: '1px solid var(--color-border)',
        borderRadius: 6, fontSize: 14,
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text)',
        background: 'var(--color-surface)',
        outline: 'none', transition: 'border-color 0.15s',
        boxSizing: 'border-box',
    };
    const iconStyle: React.CSSProperties = {
        position: 'absolute', left: 14,
        color: 'var(--color-text-muted)', pointerEvents: 'none',
    };

    const onFocus = (e: React.FocusEvent<HTMLInputElement>) =>
        (e.target.style.borderColor = 'var(--color-text)');
    const onBlur = (e: React.FocusEvent<HTMLInputElement>) =>
        (e.target.style.borderColor = 'var(--color-border)');

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(10,10,10,0.60)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
                animation: 'fadeIn 0.2s ease',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: '100%', maxWidth: 420,
                    background: 'var(--color-surface)',
                    borderRadius: 12,
                    boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
                    overflow: 'hidden',
                    animation: 'scaleIn 0.22s ease',
                    fontFamily: 'var(--font-body)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Top accent bar */}
                <div style={{ height: 3, background: 'var(--color-text)' }} />

                <div style={{ padding: '32px 32px 36px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                        <div>
                            <p style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: 10.5, fontWeight: 600,
                                letterSpacing: '0.18em', textTransform: 'uppercase',
                                color: 'var(--color-text-muted)', margin: '0 0 6px',
                            }}>
                                STYLE
                            </p>
                            <h2 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 28, fontWeight: 500,
                                color: 'var(--color-text)',
                                margin: 0, letterSpacing: '-0.01em',
                            }}>
                                {isLoginMode ? 'Welcome back' : 'Create account'}
                            </h2>
                            <p style={{
                                fontSize: 13.5, color: 'var(--color-text-muted)',
                                margin: '6px 0 0', lineHeight: 1.5,
                            }}>
                                {isLoginMode
                                    ? 'Sign in to access your orders and saved items.'
                                    : 'Join us for exclusive access and curated picks.'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: 6, borderRadius: 6, marginTop: -4,
                                color: 'var(--color-text-muted)',
                                display: 'flex', alignItems: 'center',
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div style={{
                            padding: '10px 14px', borderRadius: 6, marginBottom: 20,
                            background: '#FEE2E2', border: '1px solid #FECACA',
                            fontSize: 13, color: '#991B1B', lineHeight: 1.5,
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                        {/* Full name (register only) */}
                        {!isLoginMode && (
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: '0.04em' }}>
                                    Full Name
                                </label>
                                <div style={inputWrap}>
                                    <User size={15} style={iconStyle} />
                                    <input
                                        type="text" value={name} required
                                        onChange={e => setName(e.target.value)}
                                        onFocus={onFocus} onBlur={onBlur}
                                        placeholder="Your full name"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: '0.04em' }}>
                                Email Address
                            </label>
                            <div style={inputWrap}>
                                <Mail size={15} style={iconStyle} />
                                <input
                                    type="email" value={email} required
                                    onChange={e => setEmail(e.target.value)}
                                    onFocus={onFocus} onBlur={onBlur}
                                    placeholder="you@example.com"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: '0.04em' }}>
                                Password
                            </label>
                            <div style={inputWrap}>
                                <Lock size={15} style={iconStyle} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password} required minLength={6}
                                    onChange={e => setPassword(e.target.value)}
                                    onFocus={onFocus} onBlur={onBlur}
                                    placeholder="Min. 6 characters"
                                    style={{ ...inputStyle, paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    style={{
                                        position: 'absolute', right: 12,
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: 4, color: 'var(--color-text-muted)',
                                        display: 'flex', alignItems: 'center',
                                    }}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm password (register only) */}
                        {!isLoginMode && (
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: '0.04em' }}>
                                    Confirm Password
                                </label>
                                <div style={inputWrap}>
                                    <Lock size={15} style={iconStyle} />
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirmPassword} required minLength={6}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        onFocus={onFocus} onBlur={onBlur}
                                        placeholder="Re-enter your password"
                                        style={{ ...inputStyle, paddingRight: 44 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(v => !v)}
                                        style={{
                                            position: 'absolute', right: 12,
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            padding: 4, color: 'var(--color-text-muted)',
                                            display: 'flex', alignItems: 'center',
                                        }}
                                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: 6,
                                width: '100%', padding: '14px',
                                background: loading ? 'var(--color-text-muted)' : 'var(--color-text)',
                                color: 'var(--color-bg)',
                                border: 'none', borderRadius: 6,
                                fontSize: 12, fontWeight: 700,
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'var(--font-body)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                transition: 'background 0.2s ease',
                            }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--color-accent)'; }}
                            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--color-text)'; }}
                        >
                            {loading && (
                                <span style={{
                                    width: 14, height: 14,
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderTopColor: 'white',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'spin 0.7s linear infinite',
                                }} />
                            )}
                            {isLoginMode ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    {/* Switch mode */}
                    <div style={{
                        marginTop: 24,
                        paddingTop: 20,
                        borderTop: '1px solid var(--color-border)',
                        textAlign: 'center',
                    }}>
                        <span style={{ fontSize: 13.5, color: 'var(--color-text-muted)' }}>
                            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                        </span>
                        <button
                            onClick={switchMode}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: 13.5, fontWeight: 600,
                                color: 'var(--color-text)', fontFamily: 'var(--font-body)',
                                textDecoration: 'underline', textUnderlineOffset: 3,
                                padding: 0,
                            }}
                        >
                            {isLoginMode ? 'Register' : 'Sign In'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}