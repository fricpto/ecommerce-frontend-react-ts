// utility/api.ts

function authHeaders(): Record<string, string> {
    const t = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${res.status}: ${text || res.statusText}`);
    }
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) return res.json() as Promise<T>;
    return (await res.text()) as unknown as T;
}

export async function logoutUser() {
    const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: authHeaders(),
    });
    // 200 or 204 both mean success
    return res.ok;
}

// ── Admin: Items ──────────────────────────────────────────────
export async function getAdminItems() {
    const res = await fetch('/api/admin/items', { headers: authHeaders() });
    return handleResponse<unknown[]>(res);
}

export async function addProduct(product: {
    name: string; description: string; price: number;
    stockQuantity: number; category: string;
    image?: string; gender?: string; tags?: string[];
}) {
    const res = await fetch('/api/admin/items', {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(product),
    });
    return handleResponse<unknown>(res);
}

export async function updateProduct(id: number, product: {
    name: string; description: string; price: number;
    stockQuantity: number; category: string;
    image?: string; gender?: string; tags?: string[];
}) {
    const res = await fetch(`/api/admin/items/${id}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(product),
    });
    return handleResponse<unknown>(res);
}

export async function deleteProduct(id: number) {
    const res = await fetch(`/api/admin/items/${id}`, {
        method: 'DELETE', headers: authHeaders(),
    });
    if (res.status === 204) return;
    return handleResponse<unknown>(res);
}

// ── Admin: Users ──────────────────────────────────────────────
export async function getAdminUsers() {
    const res = await fetch('/api/admin/users', { headers: authHeaders() });
    return handleResponse<unknown[]>(res);
}

export async function deleteUser(id: number) {
    const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE', headers: authHeaders(),
    });
    if (res.status === 204) return;
    return handleResponse<unknown>(res);
}

export async function addUser(user: {
    email: string; password: string; fullName?: string; role?: string;
}) {
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
    });
    return handleResponse<unknown>(res);
}

export async function changeUserRole(id: number, role: 'ADMIN' | 'USER') {
    const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify({ role }),
    });
    return handleResponse<unknown>(res);
}

export async function updateUserCredentials(token: string, userId: number, email?: string, password?: string) {
    const body: any = {};
    if (email) body.email = email;
    if (password) body.password = password;
    const res = await fetch(`/api/admin/users/${userId}/credentials`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// ── Admin: Orders ─────────────────────────────────────────────
// getAdminOrders was previously calling /api/admin/items (wrong URL).
// Both functions are kept so existing imports don't break, but both
// now correctly call /api/admin/orders.
export async function getAdminOrders(page = 0, size = 50) {
    const res = await fetch(`/api/admin/orders?page=${page}&size=${size}`, {
        headers: authHeaders(),
    });
    return handleResponse<unknown>(res);
}

export async function ViewAllorders(page = 0, size = 100) {
    const res = await fetch(`/api/admin/orders?page=${page}&size=${size}`, {
        headers: authHeaders(),
    });
    return handleResponse<unknown>(res);
}

// cancelAdminOrder was previously calling /api/admin/items/{id}/cancel (wrong).
export async function cancelAdminOrder(id: number) {
    const res = await fetch(`/api/admin/orders/${id}/cancel`, {
        method: 'PUT', headers: authHeaders(),
    });
    if (res.status === 204) return;
    return handleResponse<unknown>(res);
}

// ── Blacklist cleanup ─────────────────────────────────────────
export async function cleanupBlacklist(): Promise<{ message: string }> {
    const res = await fetch('/api/admin/blacklist/cleanup', {
        method: 'DELETE', headers: authHeaders(),
    });
    if (res.status === 204) return { message: 'Cleanup completed.' };
    const text = await res.text().catch(() => '');
    if (!res.ok) throw new Error(`${res.status}: ${text}`);
    return { message: text || 'Cleanup completed.' };
}

export async function forceCleanupBlacklist(): Promise<{ message: string }> {
    const res = await fetch('/api/admin/blacklist/force-cleanup', {
        method: 'DELETE', headers: authHeaders(),
    });
    if (res.status === 204) return { message: 'Force cleanup completed.' };
    const text = await res.text().catch(() => '');
    if (!res.ok) throw new Error(`${res.status}: ${text}`);
    return { message: text || 'Force cleanup completed.' };
}

// ── Cards (Wallet) ────────────────────────────────────────────
// WalletController returns GET /api/user/cards
// The card number field is "number" (from CreditCard.getNumber()),
// NOT "cardNumber". Map both for safety.
export async function getUserCards() {
    const res = await fetch('/api/user/cards', { headers: authHeaders() });
    return handleResponse<unknown[]>(res);
}

// Keep getWallet as alias for compatibility
export async function getWallet() {
    return getUserCards();
}

// ── Cart backend sync ─────────────────────────────────────────
// Called before placeOrder() so the backend cart matches the frontend cart.
// All cart functions fail silently (non-blocking) when the user isn't logged in.

export async function addItemToBackendCart(itemId: number, quantity: number) {
    if (!localStorage.getItem('token')) return;
    const res = await fetch('/api/user/cart/add', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ itemId, quantity }),
    });
    if (!res.ok) console.warn('Cart add failed:', res.status);
}

export async function removeItemFromBackendCart(itemId: number) {
    if (!localStorage.getItem('token')) return;
    const res = await fetch(`/api/user/cart/remove?itemId=${itemId}`, {
        method: 'DELETE', headers: authHeaders(),
    });
    if (!res.ok) console.warn('Cart remove failed:', res.status);
}

export async function updateBackendCartQuantity(itemId: number, quantity: number) {
    if (!localStorage.getItem('token')) return;
    const res = await fetch(`/api/user/cart/items/${itemId}?quantity=${quantity}`, {
        method: 'PUT', headers: authHeaders(),
    });
    if (!res.ok) console.warn('Cart update failed:', res.status);
}

export async function clearBackendCart() {
    if (!localStorage.getItem('token')) return;
    await fetch('/api/user/cart/clear', { method: 'DELETE', headers: authHeaders() });
}

/**
 * Wipe and rebuild the backend cart to exactly match the frontend cart.
 * Must be called immediately before placeOrder().
 */
export async function syncCartToBackend(items: Array<{ id: number; quantity: number }>) {
    await clearBackendCart();
    for (const item of items) {
        await addItemToBackendCart(item.id, item.quantity);
    }
}

// ── Real order flow ───────────────────────────────────────────
/**
 * Step 1: place order from the backend cart.
 * POST /api/user/orders/place → returns the created Order (with id).
 */
export async function placeOrder() {
    const res = await fetch('/api/user/orders/place', {
        method: 'POST', headers: authHeaders(),
    });
    return handleResponse<any>(res);
}

/**
 * Step 2: pay for the placed order.
 * PUT /api/user/orders/{orderId}/pay
 *
 * method = "CREDIT_CARD"  → always authorised (demo), no cardId needed
 * method = "WALLET"       → requires a saved card by id
 */
export async function payOrder(orderId: number, method: string, cardId?: number | null) {
    const res = await fetch(`/api/user/orders/${orderId}/pay`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ method, cardId: cardId ?? null }),
    });
    return handleResponse<any>(res);
}

// ── Simulate payment (dry-run, kept for backward compat) ──────
// This does NOT create or pay an order. Use placeOrder + payOrder instead.
export async function simulatePayment(values: {
    cardNumber: string; expiryMonth: number; expiryYear: number;
    cvv: string; walletId: number; amount: number; savedCardId?: number;
}) {
    const res = await fetch('/api/user/payments/simulate', {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(values),
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, body };
}

// ── Card management ───────────────────────────────────────────
// POST /api/user/cards — save a new card to the wallet
// WalletController.AddCardRequest only has { number } — backend does NOT store
// expiry or CVV (correct PCI-DSS practice). Only the card number is persisted.
export async function addCardToWallet(cardNumber: string) {
    const res = await fetch('/api/user/cards', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ number: cardNumber }),   // ← backend field is "number"
    });
    return handleResponse<unknown>(res);
}

// DELETE /api/user/cards/{cardId} — remove a saved card
// Backend returns 200 + { message: "Card removed" } (not 204)
export async function removeCardFromWallet(cardId: number) {
    const res = await fetch(`/api/user/cards/${cardId}`, {
        method: 'DELETE', headers: authHeaders(),
    });
    if (res.status === 204) return;
    return handleResponse<unknown>(res);
}