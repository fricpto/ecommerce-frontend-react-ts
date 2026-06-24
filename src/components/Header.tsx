import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, User, LogOut, X, Menu, LayoutDashboard } from 'lucide-react';

interface HeaderProps {
    cartCount: number;
    onCartClick: () => void;
    onNavClick: (category: string) => void;
    onSearchChange: (query: string) => void;
    user: { email: string; name: string; role?: string } | null;
    onLoginClick: () => void;
    onLogout: () => void;
    onAdminClick?: () => void;
}

const NAV_LINKS = [
    { label: 'New Arrivals', value: 'new' },
    { label: 'Men', value: 'men' },
    { label: 'Women', value: 'women' },
    { label: 'Sale', value: 'sale' },
];

function isAdmin(role?: string) {
    return role === 'ADMIN' || role === 'ROLE_ADMIN';
}

export function Header({
    cartCount, onCartClick, onNavClick, onSearchChange,
    user, onLoginClick, onLogout, onAdminClick,
}: HeaderProps) {
    const [scrolled, setScrolled] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
                setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const closeSearch = () => { setSearchOpen(false); setSearchQuery(''); onSearchChange(''); };

    const S: Record<string, React.CSSProperties> = {
        header: {
            position: 'sticky', top: 0, zIndex: 100,
            backgroundColor: scrolled ? 'rgba(250,250,248,0.88)' : 'var(--color-bg)',
            backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
            borderBottom: '1px solid var(--color-border)',
            boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.35s ease',
        },
        inner: {
            maxWidth: 1320, margin: '0 auto', padding: '0 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: 70, gap: 24,
        },
        left: { display: 'flex', alignItems: 'center', gap: 20 },
        right: { display: 'flex', alignItems: 'center', gap: 4 },
        logo: {
            fontFamily: 'var(--font-display)', fontSize: 27, fontWeight: 500,
            letterSpacing: '0.18em', background: 'none', border: 'none',
            color: 'var(--color-text)', cursor: 'pointer', padding: 0, lineHeight: 1,
        },
        nav: { display: 'flex', gap: 36, alignItems: 'center' },
        navBtn: {
            background: 'none', border: 'none', padding: '4px 0',
            fontSize: 12, fontWeight: 500, letterSpacing: '0.1em',
            textTransform: 'uppercase' as const, color: 'var(--color-text)',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
        },
        iconBtn: {
            background: 'none', border: 'none', padding: 10,
            color: 'var(--color-text)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', borderRadius: 6,
            transition: 'background 0.15s',
        },
        // ── Prominent admin button shown directly in header bar ──────
        adminBtn: {
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            background: 'var(--color-text)', color: 'var(--color-bg)',
            border: 'none', borderRadius: 7,
            fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'opacity 0.15s',
        },
        searchInput: {
            border: '1px solid var(--color-border)', borderRadius: 6,
            padding: '8px 14px', fontSize: 13, fontFamily: 'var(--font-body)',
            outline: 'none', width: 200, backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)', transition: 'border-color 0.15s',
        },
        cartBadge: {
            position: 'absolute' as const, top: 5, right: 5,
            background: 'var(--color-text)', color: 'var(--color-bg)',
            fontSize: 9, fontWeight: 700, borderRadius: '50%',
            width: 16, height: 16, display: 'flex',
            alignItems: 'center', justifyContent: 'center', letterSpacing: 0,
        },
        dropdown: {
            position: 'absolute' as const, right: 0, top: 'calc(100% + 8px)',
            width: 210, background: 'var(--color-surface)',
            border: '1px solid var(--color-border)', borderRadius: 10,
            boxShadow: '0 16px 40px rgba(0,0,0,0.12)', overflow: 'hidden',
            animation: 'scaleIn 0.2s ease', transformOrigin: 'top right',
        },
        dropdownHead: {
            padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface-alt)',
        },
        dropdownBtn: {
            width: '100%', padding: '11px 16px', border: 'none', background: 'none',
            textAlign: 'left' as const, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 13.5, color: 'var(--color-text)', fontFamily: 'var(--font-body)',
            transition: 'background 0.12s',
        },
    };

    return (
        <>
            <header style={S.header}>
                <div style={S.inner}>
                    {/* Left: hamburger + logo */}
                    <div style={S.left}>
                        <button
                            onClick={() => setMobileOpen(true)}
                            style={{ ...S.iconBtn, display: 'flex' }}
                            className="lg:hidden"
                            aria-label="Open menu"
                        >
                            <Menu size={20} />
                        </button>
                        <button onClick={() => onNavClick('all')} style={S.logo} aria-label="Home">
                            STYLE
                        </button>
                    </div>

                    {/* Centre nav */}
                    <nav style={S.nav} className="hidden lg:flex">
                        {NAV_LINKS.map(({ label, value }) => (
                            <button key={value} onClick={() => onNavClick(value)} style={S.navBtn} className="nav-link">
                                {label}
                            </button>
                        ))}
                    </nav>

                    {/* Right icons */}
                    <div style={S.right}>
                        {/* Search */}
                        {searchOpen ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input
                                    type="text" value={searchQuery} autoFocus
                                    onChange={e => { setSearchQuery(e.target.value); onSearchChange(e.target.value); }}
                                    placeholder="Search products…"
                                    style={S.searchInput}
                                    onFocus={e => (e.target.style.borderColor = 'var(--color-text)')}
                                    onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                                />
                                <button onClick={closeSearch} style={S.iconBtn}><X size={17} /></button>
                            </div>
                        ) : (
                            <button onClick={() => setSearchOpen(true)} style={S.iconBtn} aria-label="Search">
                                <Search size={18} />
                            </button>
                        )}

                        {/* ── ADMIN BUTTON — always visible in header when admin ── */}
                        {user && isAdmin(user.role) && onAdminClick && (
                            <button
                                onClick={onAdminClick}
                                style={S.adminBtn}
                                onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
                                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                aria-label="Open Admin Dashboard"
                            >
                                <LayoutDashboard size={14} />
                                Admin
                            </button>
                        )}

                        {/* User menu */}
                        {user ? (
                            <div ref={userMenuRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setUserMenuOpen(v => !v)}
                                    style={S.iconBtn}
                                    aria-label="Account"
                                >
                                    <User size={18} />
                                </button>
                                {userMenuOpen && (
                                    <div style={S.dropdown}>
                                        <div style={S.dropdownHead}>
                                            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>{user.name}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-text-muted)' }}>{user.email}</p>
                                            {isAdmin(user.role) && (
                                                <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)', padding: '2px 7px', borderRadius: 4 }}>
                                                    ADMIN
                                                </span>
                                            )}
                                        </div>
                                        {isAdmin(user.role) && onAdminClick && (
                                            <button
                                                style={S.dropdownBtn}
                                                onClick={() => { onAdminClick(); setUserMenuOpen(false); }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-alt)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                            >
                                                <LayoutDashboard size={15} color="var(--color-accent-dark)" />
                                                Admin Dashboard
                                            </button>
                                        )}
                                        <button
                                            style={S.dropdownBtn}
                                            onClick={() => { onLogout(); setUserMenuOpen(false); }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-alt)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                        >
                                            <LogOut size={15} />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={onLoginClick} style={S.iconBtn} aria-label="Sign in">
                                <User size={18} />
                            </button>
                        )}

                        {/* Cart */}
                        <button
                            onClick={onCartClick}
                            style={{ ...S.iconBtn, position: 'relative' }}
                            aria-label={`Cart (${cartCount})`}
                        >
                            <ShoppingBag size={18} />
                            {cartCount > 0 && <span style={S.cartBadge}>{cartCount}</span>}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', animation: 'fadeIn 0.25s ease' }}
                    onClick={() => setMobileOpen(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'absolute', top: 0, left: 0, bottom: 0, width: 280,
                            background: 'var(--color-surface)', padding: '80px 32px 40px',
                            animation: 'slideInLeft 0.3s ease', display: 'flex', flexDirection: 'column', gap: 0,
                        }}
                    >
                        <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', top: 20, right: 20, ...S.iconBtn }}>
                            <X size={20} />
                        </button>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, margin: '0 0 28px', letterSpacing: '0.15em', color: 'var(--color-text)' }}>
                            STYLE
                        </p>
                        {NAV_LINKS.map(({ label, value }) => (
                            <button key={value} onClick={() => { onNavClick(value); setMobileOpen(false); }}
                                style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--color-border)', padding: '16px 0', fontSize: 13, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}
                            >
                                {label}
                            </button>
                        ))}
                        {user && isAdmin(user.role) && onAdminClick && (
                            <button
                                onClick={() => { onAdminClick(); setMobileOpen(false); }}
                                style={{ marginTop: 24, ...S.adminBtn, justifyContent: 'center' }}
                            >
                                <LayoutDashboard size={14} /> Admin Dashboard
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}