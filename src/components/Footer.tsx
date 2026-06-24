import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

const SHOP_LINKS = ['New Arrivals', 'Men', 'Women', 'Sale', 'All Products'];
const HELP_LINKS = ['FAQ', 'Shipping & Returns', 'Size Guide', 'Contact Us', 'Privacy Policy'];

function InstagramIcon() {
    return (
        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
        </svg>
    );
}
function TiktokIcon() {
    return (
        <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.99a8.16 8.16 0 004.77 1.52V7.07a4.85 4.85 0 01-1-.38z" />
        </svg>
    );
}
function PinterestIcon() {
    return (
        <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
        </svg>
    );
}

const SOCIALS = [
    { Icon: InstagramIcon, label: 'Instagram' },
    { Icon: TiktokIcon, label: 'TikTok' },
    { Icon: PinterestIcon, label: 'Pinterest' },
] as const;

export function Footer() {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.includes('@')) { setSubscribed(true); setEmail(''); }
    };

    const linkHover = (enter: boolean) => (e: React.MouseEvent<HTMLButtonElement>) =>
        (e.currentTarget.style.color = enter ? '#FAFAF8' : '#6B6B65');

    const colLinkHover = (enter: boolean) => (e: React.MouseEvent<HTMLButtonElement>) =>
        (e.currentTarget.style.color = enter ? '#FAFAF8' : '#8A8A82');

    return (
        <footer style={{
            background: '#111110',
            color: '#8A8A82',
            fontFamily: 'var(--font-body)',
            marginTop: 'auto',
        }}>
            {/* ── Newsletter band ───────────────────────────────────── */}
            <div style={{
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                padding: '56px 28px',
            }}>
                <div style={{
                    maxWidth: 1320, margin: '0 auto',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 48,
                    flexWrap: 'wrap',
                }}>
                    <div style={{ maxWidth: 440 }}>
                        <p style={{
                            fontSize: 10.5, fontWeight: 600, letterSpacing: '0.2em',
                            textTransform: 'uppercase', color: 'var(--color-accent)',
                            margin: '0 0 12px',
                        }}>
                            The Edit — Weekly
                        </p>
                        <h3 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(26px, 4vw, 38px)',
                            fontWeight: 400, lineHeight: 1.15,
                            color: '#FAFAF8', margin: '0 0 12px',
                            letterSpacing: '-0.01em',
                        }}>
                            Stay ahead of the<br />
                            <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>season</em>
                        </h3>
                        <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: 0, color: '#8A8A82' }}>
                            New arrivals, exclusive offers, and style notes — straight to your inbox.
                        </p>
                    </div>

                    {/* Subscribe form */}
                    <div style={{ flex: '1 1 320px', maxWidth: 440 }}>
                        {subscribed ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '18px 24px',
                                border: '1px solid rgba(201,169,110,0.35)',
                                borderRadius: 8,
                                background: 'rgba(201,169,110,0.07)',
                            }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: 'var(--color-accent)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Check size={16} color="#1A1A1A" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-accent)' }}>
                                        You're on the list!
                                    </p>
                                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#8A8A82' }}>
                                        Expect something good in your inbox soon.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe}>
                                <div style={{
                                    display: 'flex',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: 8, overflow: 'hidden',
                                    transition: 'border-color 0.2s',
                                }}
                                    onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
                                    onBlurCapture={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                                >
                                    <input
                                        type="email" required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        style={{
                                            flex: 1, padding: '15px 18px',
                                            background: 'rgba(255,255,255,0.04)',
                                            border: 'none', outline: 'none',
                                            color: '#FAFAF8', fontSize: 14,
                                            fontFamily: 'var(--font-body)',
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '15px 22px',
                                            background: 'var(--color-accent)',
                                            border: 'none', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            fontSize: 12, fontWeight: 700,
                                            letterSpacing: '0.1em', textTransform: 'uppercase',
                                            color: '#1A1A1A', fontFamily: 'var(--font-body)',
                                            transition: 'background 0.2s',
                                            flexShrink: 0,
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-dark)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
                                    >
                                        Subscribe <ArrowRight size={14} />
                                    </button>
                                </div>
                                <p style={{ fontSize: 11.5, color: '#555550', margin: '10px 0 0' }}>
                                    No spam, ever. Unsubscribe anytime.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Main grid ─────────────────────────────────────────── */}
            <div style={{
                maxWidth: 1320, margin: '0 auto',
                padding: '64px 28px 48px',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                gap: '0 48px',
            }}>
                {/* Brand column */}
                <div style={{ paddingRight: 24, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
                    <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 30, fontWeight: 500,
                        letterSpacing: '0.18em', color: '#FAFAF8',
                        margin: '0 0 14px',
                    }}>
                        STYLE
                    </p>
                    <p style={{
                        fontSize: 13.5, lineHeight: 1.75,
                        color: '#6B6B65', margin: '0 0 28px', maxWidth: 240,
                    }}>
                        Curated fashion for the modern wardrobe — quality pieces, timeless design.
                    </p>

                    {/* Socials */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        {SOCIALS.map(({ Icon, label }) => (
                            <button
                                key={label}
                                aria-label={label}
                                style={{
                                    width: 36, height: 36,
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#6B6B65',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.color = '#FAFAF8';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.color = '#6B6B65';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.background = 'none';
                                }}
                            >
                                <Icon />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Shop */}
                <div style={{ paddingLeft: 24 }}>
                    <p style={{
                        fontSize: 10.5, fontWeight: 700,
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: '#FAFAF8', margin: '0 0 22px',
                    }}>
                        Shop
                    </p>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
                        {SHOP_LINKS.map(l => (
                            <li key={l}>
                                <button
                                    style={{
                                        background: 'none', border: 'none', padding: 0,
                                        fontSize: 13.5, color: '#8A8A82',
                                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                                        textAlign: 'left', transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={colLinkHover(true)}
                                    onMouseLeave={colLinkHover(false)}
                                >
                                    {l}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Help */}
                <div>
                    <p style={{
                        fontSize: 10.5, fontWeight: 700,
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: '#FAFAF8', margin: '0 0 22px',
                    }}>
                        Help
                    </p>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
                        {HELP_LINKS.map(l => (
                            <li key={l}>
                                <button
                                    style={{
                                        background: 'none', border: 'none', padding: 0,
                                        fontSize: 13.5, color: '#8A8A82',
                                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                                        textAlign: 'left', transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={colLinkHover(true)}
                                    onMouseLeave={colLinkHover(false)}
                                >
                                    {l}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Store info */}
                <div>
                    <p style={{
                        fontSize: 10.5, fontWeight: 700,
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: '#FAFAF8', margin: '0 0 22px',
                    }}>
                        Our Store
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                            { label: 'Hours', value: 'Mon – Sat: 10am – 8pm\nSun: 11am – 6pm' },
                            { label: 'Email', value: 'hello@style.com' },
                            { label: 'Phone', value: '+961 12 34 56 78' },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p style={{
                                    margin: '0 0 3px', fontSize: 11,
                                    fontWeight: 600, letterSpacing: '0.1em',
                                    textTransform: 'uppercase', color: '#555550',
                                }}>
                                    {label}
                                </p>
                                <p style={{
                                    margin: 0, fontSize: 13.5,
                                    color: '#8A8A82', lineHeight: 1.65,
                                    whiteSpace: 'pre-line',
                                }}>
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Bottom bar ────────────────────────────────────────── */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{
                    maxWidth: 1320, margin: '0 auto',
                    padding: '18px 28px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 16,
                    flexWrap: 'wrap',
                }}>
                    <p style={{ fontSize: 12, color: '#3E3E3A', margin: 0 }}>
                        © {new Date().getFullYear()} STYLE. All rights reserved.
                    </p>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        {['Terms of Service', 'Privacy Policy', 'Cookie Settings', 'Accessibility'].map(l => (
                            <button
                                key={l}
                                style={{
                                    background: 'none', border: 'none', padding: 0,
                                    fontSize: 12, color: '#3E3E3A',
                                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                                    transition: 'color 0.15s',
                                }}
                                onMouseEnter={linkHover(true)}
                                onMouseLeave={linkHover(false)}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}