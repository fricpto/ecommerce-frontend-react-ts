export function Hero() {
    return (
        <section
            style={{
                position: 'relative',
                height: '88vh',
                minHeight: 560,
                maxHeight: 920,
                overflow: 'hidden',
                background: '#0A0A0A',
            }}
        >
            {/* Hero image */}
            <img
                src="https://images.unsplash.com/photo-1620777888789-0ee95b57a277?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBjbG90aGluZ3xlbnwxfHx8fDE3NjM4NTUyNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="New Collection 2026"
                style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 20%',
                    opacity: 0.72,
                }}
            />

            {/* Left-to-right gradient so text is legible without killing the photo */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(105deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.52) 45%, rgba(0,0,0,0.10) 100%)',
            }} />

            {/* Bottom vignette */}
            <div style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                height: '35%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
                pointerEvents: 'none',
            }} />

            {/* Content */}
            <div style={{
                position: 'relative',
                height: '100%',
                maxWidth: 1320,
                margin: '0 auto',
                padding: '0 28px',
                display: 'flex',
                alignItems: 'center',
            }}>
                <div style={{ maxWidth: 620 }}>

                    {/* Season label */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 28,
                    }}>
                        <div style={{ width: 28, height: 1, background: 'var(--color-accent)' }} />
                        <span style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 10.5,
                            fontWeight: 600,
                            letterSpacing: '0.22em',
                            textTransform: 'uppercase',
                            color: 'var(--color-accent)',
                        }}>
                            Spring / Summer 2026
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(54px, 8.5vw, 100px)',
                        fontWeight: 400,
                        lineHeight: 0.96,
                        letterSpacing: '-0.02em',
                        color: '#FAFAF8',
                        margin: '0 0 28px',
                    }}>
                        New<br />
                        <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.85)' }}>
                            Collection
                        </em>
                    </h1>

                    {/* Divider line */}
                    <div style={{
                        width: 48,
                        height: 1,
                        background: 'rgba(255,255,255,0.35)',
                        marginBottom: 24,
                    }} />

                    {/* Body copy */}
                    <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 15.5,
                        fontWeight: 300,
                        lineHeight: 1.75,
                        color: 'rgba(255,255,255,0.72)',
                        margin: '0 0 44px',
                        maxWidth: 400,
                    }}>
                        Discover the latest trends in fashion. Elevate your style
                        with our carefully curated selection of timeless pieces.
                    </p>

                    {/* CTA row */}
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Primary CTA */}
                        <button
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: 11.5,
                                fontWeight: 700,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                background: '#FAFAF8',
                                color: '#1A1A1A',
                                border: 'none',
                                padding: '15px 40px',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease, transform 0.15s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--color-accent)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#FAFAF8';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            Shop Now
                        </button>

                        {/* Ghost CTA */}
                        <button
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: 11.5,
                                fontWeight: 600,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.85)',
                                border: '1px solid rgba(255,255,255,0.4)',
                                padding: '15px 36px',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s ease, background 0.2s ease, color 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#FAFAF8';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                                e.currentTarget.style.color = '#FAFAF8';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                            }}
                        >
                            Explore
                        </button>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div style={{
                position: 'absolute',
                bottom: 36,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                pointerEvents: 'none',
            }}>
                <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.4)',
                }}>
                    Scroll
                </span>
                {/* Animated line */}
                <div style={{ position: 'relative', width: 1, height: 44, overflow: 'hidden' }}>
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.5), rgba(255,255,255,0))',
                        animation: 'slideUp 1.8s ease-in-out infinite',
                    }} />
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    0%   { transform: translateY(44px);  opacity: 0; }
                    30%  { opacity: 1; }
                    100% { transform: translateY(-44px); opacity: 0; }
                }
            `}</style>
        </section>
    );
}