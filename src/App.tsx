import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductGrid } from './components/ProductGrid';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { Checkout } from './components/Checkout';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/Adminpanel';
import type { Product, CartItem, LoggedInUser, CreditCard } from './types';
import {
  getUserCards,
  addItemToBackendCart,
  removeItemFromBackendCart,
  updateBackendCartQuantity,
} from './utility/api';

function decodeJwt(token: string): Record<string, any> | null {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
}

function normaliseRole(raw: string | null | undefined): string {
  if (!raw) return 'USER';
  return raw.replace(/^ROLE_/i, '').toUpperCase();
}

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  // Saved credit cards (from /api/user/cards)
  const [savedCards, setSavedCards] = useState<CreditCard[]>([]);

  // ── Products (public, no auth) ────────────────────────────
  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error(`${res.status}`);
      const raw: any[] = await res.json();
      // ── Diagnostic: open browser DevTools console to see this ──
      console.table(raw.map(p => ({
        id: p.id,
        name: p.name,
        gender: p.gender ?? '(null)',
        tags: JSON.stringify(p.tags ?? []),
      })));
      setProducts(raw.map(p => ({
        id: Number(p.id),
        name: p.name ?? '',
        price: Number(p.price ?? 0),
        image: p.image ?? null,
        category: p.category ?? null,
        description: p.description ?? '',
        tags: Array.isArray(p.tags) ? p.tags : [],
        gender: p.gender ?? null,
      })));
    } catch (err) { console.error('fetchProducts:', err); }
  }

  useEffect(() => { fetchProducts(); }, []);

  // ── Saved cards ───────────────────────────────────────────
  // WalletController: GET /api/user/cards
  // The card number field the backend returns is "number" (from CreditCard.getNumber()),
  // NOT "cardNumber". Map both so the UI works regardless.
  async function fetchSavedCards() {
    try {
      const raw = await getUserCards() as any[];
      setSavedCards(raw.map(c => ({
        id: Number(c.id),
        number: c.number ?? c.cardNumber ?? '',   // real backend field
        cardNumber: c.number ?? c.cardNumber ?? '',   // alias for Checkout
        cardHolderName: c.cardHolderName ?? undefined,
        expiryMonth: Number(c.expiryMonth ?? 0),
        expiryYear: Number(c.expiryYear ?? 0),
        last4: c.last4 ?? undefined,
      })));
    } catch {
      // 404 if user has no wallet yet — that's fine, show no saved cards
      setSavedCards([]);
    }
  }

  // ── Login ─────────────────────────────────────────────────
  async function handleLogin(email: string, password: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(`Login ${res.status}`);

      const data = await res.json();
      const token = data.jwt ?? data.token;
      if (!token) throw new Error('No token returned by server');
      localStorage.setItem('token', token);

      const jwt = decodeJwt(token);
      console.log('Login response body:', data);
      console.log('JWT payload:', jwt);

      const rawRole =
        data.user?.role
        ?? data.role
        ?? jwt?.role
        ?? jwt?.roles?.[0]
        ?? (typeof jwt?.authorities?.[0] === 'string'
          ? jwt.authorities[0]
          : jwt?.authorities?.[0]?.authority)
        ?? 'USER';

      const loggedInUser: LoggedInUser = {
        email: data.user?.email ?? data.email ?? jwt?.sub ?? email,
        name: data.user?.fullName ?? data.user?.name ?? email.split('@')[0],
        role: normaliseRole(rawRole),
        walletId: data.user?.walletId ?? data.walletId ?? undefined,
      };

      console.log('Resolved user:', loggedInUser);
      setUser(loggedInUser);
      setIsAuthModalOpen(false);

      // Load saved cards after login (fails silently for new users without a wallet)
      await fetchSavedCards();
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed. Please check your credentials.');
    }
  }

  function handleLogout() {
    setUser(null);
    setSavedCards([]);
    localStorage.removeItem('token');
  }

  // ── Cart helpers (sync to backend when logged in) ─────────
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      return existing
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...product, quantity: 1 }];
    });
    if (user) addItemToBackendCart(product.id, 1).catch(console.error);
  };

  const removeFromCart = (id: number) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
    if (user) removeItemFromBackendCart(id).catch(console.error);
  };

  const updateQuantity = (id: number, qty: number) => {
    if (qty === 0) { removeFromCart(id); return; }
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
    if (user) updateBackendCartQuantity(id, qty).catch(console.error);
  };

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = () => {
    if (!user) { setIsAuthModalOpen(true); setIsCartOpen(false); }
    else { setIsCartOpen(false); setIsCheckoutOpen(true); }
  };

  // ── Filtering ─────────────────────────────────────────────
  // Case-insensitive tag/category helpers
  const hasTag = (p: typeof products[0], ...values: string[]) =>
    p.tags?.some(t => values.includes(t.toLowerCase())) ?? false;
  const catIs = (p: typeof products[0], val: string) =>
    p.category?.toLowerCase() === val;

  let filtered = products;
  if (selectedCategory === 'new') {
    filtered = filtered.filter(p => hasTag(p, 'new'));

  } else if (selectedCategory === 'sale') {
    filtered = filtered.filter(p => hasTag(p, 'sale'));

  } else if (selectedCategory === 'men') {
    // Matches: gender = men or unisex  |  tag = men/male  |  category = men
    filtered = filtered.filter(p =>
      p.gender === 'men' || p.gender === 'unisex'
      || hasTag(p, 'men', 'male')
      || catIs(p, 'men')
    );

  } else if (selectedCategory === 'women') {
    // Matches: gender = women or unisex  |  tag = women/female  |  category = women
    filtered = filtered.filter(p =>
      p.gender === 'women' || p.gender === 'unisex'
      || hasTag(p, 'women', 'female')
      || catIs(p, 'women')
    );

  } else if (selectedCategory !== 'all') {
    filtered = filtered.filter(p => p.category === selectedCategory);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q));
  }

  const totalAmount = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <>
      {/* Page layout — flex column; overlays are siblings below, NOT children */}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
        <Header
          cartCount={cartCount}
          onCartClick={() => setIsCartOpen(true)}
          onNavClick={cat => { setSelectedCategory(cat); setSearchQuery(''); }}
          onSearchChange={setSearchQuery}
          user={user}
          onLoginClick={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onAdminClick={() => setIsAdminPanelOpen(true)}
        />
        <Hero />
        <main style={{ flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto', padding: '48px 28px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
            {(['all', 'tops', 'bottoms', 'outerwear', 'shoes', 'dress'] as const).map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
                padding: '8px 20px', borderRadius: 999, border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--color-text)' : 'var(--color-border)',
                background: selectedCategory === cat ? 'var(--color-text)' : 'transparent',
                color: selectedCategory === cat ? 'var(--color-bg)' : 'var(--color-text)',
                fontSize: 12.5, fontWeight: 500, letterSpacing: '0.06em',
                textTransform: 'capitalize', cursor: 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 0.2s ease',
              }}>
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-muted)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, margin: '0 0 8px' }}>No products found</p>
              <p style={{ fontSize: 14 }}>Try a different filter or search term.</p>
            </div>
          ) : (
            <ProductGrid products={filtered} onAddToCart={addToCart} />
          )}
        </main>
        <Footer />
      </div>

      {/*
              ── Overlays ────────────────────────────────────────────────────
              Rendered OUTSIDE the flex column so that `position: fixed` is
              always resolved against the viewport (the initial containing
              block), not against any flex/transform ancestor.

              When fixed elements are children of a flex or transformed
              element some browsers position them relative to the document
              instead of the viewport, which pushes modals below the fold.
            */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
      />
      <Checkout
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onClearCart={() => setCartItems([])}
        userEmail={user?.email ?? ''}
        savedCards={savedCards}
        totalAmount={totalAmount}
        onCardsUpdated={fetchSavedCards}
      />
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onItemsChanged={fetchProducts}
      />
    </>
  );
}