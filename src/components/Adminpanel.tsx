// src/components/Adminpanel.tsx
import { useState, useEffect, useCallback } from 'react';
import {
    X, LayoutDashboard, Package, ShoppingBag, Users, Shield,
    Trash2, Pencil, Plus, RefreshCw, CheckCircle, XCircle, Clock,
    AlertTriangle, Zap, UserCheck, UserX, UserPlus,
} from 'lucide-react';
import type { AdminItem, AdminUser, AdminOrder } from '../types';
import {
    getAdminItems, getAdminUsers, ViewAllorders,
    addProduct, updateProduct, deleteProduct,
    deleteUser, addUser, changeUserRole,
    cancelAdminOrder,
    cleanupBlacklist, forceCleanupBlacklist, updateUserCredentials
} from '../utility/api';

type Tab = 'dashboard' | 'products' | 'orders' | 'users' | 'system';

// ── Helpers ───────────────────────────────────────────────────

// Spring Boot's LocalDateTime serialises as an int array [year,month,day,h,m,s]
// OR as an ISO string depending on Jackson config. Handle both.
function parseSpringDate(raw: any): string {
    if (!raw) return '';
    if (Array.isArray(raw)) {
        // month in Spring is 1-based; JS Date() expects 0-based
        return new Date(raw[0], raw[1] - 1, raw[2], raw[3] ?? 0, raw[4] ?? 0).toISOString();
    }
    return String(raw);
}

function formatDate(raw: any): string {
    const iso = parseSpringDate(raw);
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    } catch { return iso; }
}

function Badge({ status }: { status: string }) {
    const map: Record<string, { bg: string; color: string }> = {
        PAID: { bg: '#DCFCE7', color: '#166534' },
        PENDING: { bg: '#FEF3C7', color: '#92400E' },
        CANCELLED: { bg: '#FEE2E2', color: '#991B1B' },
    };
    const s = map[status] ?? { bg: '#F3F4F6', color: '#374151' };
    const Icon = status === 'PAID' ? CheckCircle : status === 'PENDING' ? Clock : XCircle;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, padding: '3px 9px', borderRadius: 99, fontSize: 12, fontWeight: 500 }}>
            <Icon size={12} />{status}
        </span>
    );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '20px 24px' }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{label}</p>
            <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--color-text)' }}>{value}</p>
            {sub && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>{sub}</p>}
        </div>
    );
}

const BLANK_ITEM = { name: '', description: '', price: 0, stockQuantity: 0, category: '', image: '', gender: '', tags: '' };
const BLANK_USER = { email: '', password: '', fullName: '', role: 'USER' as 'USER' | 'ADMIN' };

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onItemsChanged?: () => void;
    token: string | null;

}

export function AdminPanel({ isOpen, onClose, onItemsChanged, token }: AdminPanelProps) {
    const [tab, setTab] = useState<Tab>('dashboard');

    const [items, setItems] = useState<AdminItem[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [dataError, setDataError] = useState<string | null>(null);

    // Product form
    const [showItemForm, setShowItemForm] = useState(false);
    const [editingItem, setEditingItem] = useState<AdminItem | null>(null);
    const [itemForm, setItemForm] = useState({ ...BLANK_ITEM });
    const [itemSaving, setItemSaving] = useState(false);
    const [itemFormError, setItemFormError] = useState<string | null>(null);

    // Add-user form
    const [showUserForm, setShowUserForm] = useState(false);
    const [userForm, setUserForm] = useState({ ...BLANK_USER });
    const [userSaving, setUserSaving] = useState(false);
    const [userFormError, setUserFormError] = useState<string | null>(null);

    // User credentials update form
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [editCredsForm, setEditCredsForm] = useState({ email: '', password: '' });
    const [editCredsSaving, setEditCredsSaving] = useState(false);
    const [editCredsError, setEditCredsError] = useState<string | null>(null);
    const editingUser = users.find(u => u.id === editingUserId) ?? null;

    const openEditCredentials = (userId: number) => {
        setEditingUserId(userId);
        setEditCredsForm({ email: '', password: '' });
        setEditCredsError(null);
    };

    // Order filter
    const [orderFilter, setOrderFilter] = useState('ALL');

    // Role-change loading (keyed by userId)
    const [roleLoading, setRoleLoading] = useState<number | null>(null);

    // System / cleanup
    const [cleanupMsg, setCleanupMsg] = useState<string | null>(null);
    const [cleanupError, setCleanupError] = useState<string | null>(null);
    const [cleanupLoading, setCleanupLoading] = useState<'cleanup' | 'force' | null>(null);

    // ── Fetch all ─────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setDataError(null);
        try {
            const [rawItems, rawUsers, rawOrders] = await Promise.all([
                getAdminItems(),
                getAdminUsers(),
                ViewAllorders(0, 200),
            ]);

            setItems((rawItems as any[]).map(i => ({
                id: Number(i.id), name: i.name ?? '', description: i.description ?? '',
                price: Number(i.price ?? 0), stockQuantity: Number(i.stockQuantity ?? i.stock ?? 0),
                category: i.category ?? '', image: i.image ?? null,
                tags: i.tags ?? [], gender: i.gender ?? '',
            })));

            setUsers((rawUsers as any[]).map(u => ({
                id: Number(u.id), email: u.email ?? '',
                fullName: u.fullName ?? u.name ?? '', role: u.role ?? 'USER',
            })));

            const arr: any[] = Array.isArray(rawOrders)
                ? rawOrders
                : (rawOrders as any)?.content ?? [];

            setOrders(arr.map(o => {
                // After the Order.java fix, 'userEmail' and 'userFullName' are flat
                // top-level fields exposed via @JsonProperty on getter methods.
                // They bypass the @JsonBackReference exclusion on Order.user.
                const email = o.userEmail ?? o.user?.email ?? '';
                const fullName = o.userFullName ?? o.user?.fullName ?? '';

                // Build a readable display string for the Customer column
                const customerDisplay = fullName && email
                    ? `${fullName} (${email})`
                    : fullName || email || '—';

                return {
                    id: Number(o.id),
                    status: o.status ?? 'PENDING',
                    totalAmount: Number(o.totalAmount ?? 0),
                    createdAt: parseSpringDate(o.createdAt),
                    userEmail: email,
                    customerDisplay,
                    orderItems: o.orderItems ?? o.items ?? [],
                };
            }));
        } catch (e: any) {
            setDataError(e.message ?? 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (isOpen) fetchAll(); }, [isOpen, fetchAll]);

    // ── Product CRUD ──────────────────────────────────────────
    const openAddItem = () => {
        setEditingItem(null); setItemForm({ ...BLANK_ITEM });
        setItemFormError(null); setShowItemForm(true);
    };
    const openEditItem = (item: AdminItem) => {
        setEditingItem(item);
        setItemForm({ name: item.name, description: item.description, price: item.price, stockQuantity: item.stockQuantity, category: item.category, image: item.image ?? '', gender: item.gender ?? '', tags: (item.tags ?? []).join(', ') });
        setItemFormError(null); setShowItemForm(true);
    };
    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setItemSaving(true); setItemFormError(null);
        try {
            const payload = { name: itemForm.name, description: itemForm.description, price: Number(itemForm.price), stockQuantity: Number(itemForm.stockQuantity), category: itemForm.category, image: itemForm.image || undefined, gender: itemForm.gender || undefined, tags: itemForm.tags ? itemForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
            if (editingItem) await updateProduct(editingItem.id, payload);
            else await addProduct(payload);
            setShowItemForm(false); fetchAll(); onItemsChanged?.();
        } catch (err: any) { setItemFormError(err.message ?? 'Save failed'); }
        finally { setItemSaving(false); }
    };
    const handleDeleteItem = async (item: AdminItem) => {
        if (!confirm(`Delete "${item.name}"?`)) return;
        try { await deleteProduct(item.id); fetchAll(); onItemsChanged?.(); }
        catch (e: any) { alert(e.message ?? 'Delete failed'); }
    };

    // ── User management ───────────────────────────────────────
    const handleDeleteUser = async (u: AdminUser) => {
        if (!confirm(`Delete user "${u.email}"?`)) return;
        try { await deleteUser(u.id); fetchAll(); }
        catch (e: any) { alert(e.message ?? 'Delete failed'); }
    };
    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserSaving(true); setUserFormError(null);
        try { await addUser(userForm); setShowUserForm(false); setUserForm({ ...BLANK_USER }); fetchAll(); }
        catch (err: any) { setUserFormError(err.message ?? 'Failed to create user'); }
        finally { setUserSaving(false); }
    };
    const handleChangeRole = async (u: AdminUser, newRole: 'ADMIN' | 'USER') => {
        if (!confirm(`${newRole === 'ADMIN' ? 'Promote' : 'Demote'} "${u.email}" to ${newRole}?`)) return;
        setRoleLoading(u.id);
        try { await changeUserRole(u.id, newRole); fetchAll(); }
        catch (e: any) { alert(e.message ?? 'Role change failed'); }
        finally { setRoleLoading(null); }
    };

    const handleUpdateCredentials = async (e: React.FormEvent, userId: number) => {
        e.preventDefault();
        setEditCredsError(null);

        if (!editCredsForm.email && !editCredsForm.password) {
            setEditCredsError('Please provide a new email or password to update.');
            return;
        }

        setEditCredsSaving(true);
        try {

            if (!token) throw new Error('Missing auth token. Please log in again.');

            await updateUserCredentials(
                token,
                userId,
                editCredsForm.email || undefined,
                editCredsForm.password || undefined
            );

            setEditingUserId(null);
            setEditCredsForm({ email: '', password: '' });
            fetchAll();
        } catch (err: any) {
            setEditCredsError(err.message || 'Failed to update credentials');
        } finally {
            setEditCredsSaving(false);
        }
    };

    // ── Orders ────────────────────────────────────────────────
    const handleCancelOrder = async (o: AdminOrder) => {
        if (!confirm(`Cancel order #${o.id}?`)) return;
        try { await cancelAdminOrder(o.id); fetchAll(); }
        catch (e: any) { alert(e.message ?? 'Cancel failed'); }
    };
    const visibleOrders = orderFilter === 'ALL' ? orders : orders.filter(o => o.status === orderFilter);

    // ── Cleanup ───────────────────────────────────────────────
    const runCleanup = async (type: 'cleanup' | 'force') => {
        if (!confirm(`Run ${type === 'force' ? 'force-cleanup' : 'cleanup'} on the token blacklist?`)) return;
        setCleanupLoading(type); setCleanupMsg(null); setCleanupError(null);
        try { const res = type === 'force' ? await forceCleanupBlacklist() : await cleanupBlacklist(); setCleanupMsg(res.message); }
        catch (e: any) { setCleanupError(e.message ?? 'Cleanup failed'); }
        finally { setCleanupLoading(null); }
    };

    // ── Stats ─────────────────────────────────────────────────
    const revenue = orders.filter(o => o.status === 'PAID').reduce((s, o) => s + o.totalAmount, 0);
    const pendingCount = orders.filter(o => o.status === 'PENDING').length;

    if (!isOpen) return null;

    // ── Shared styles ─────────────────────────────────────────
    const S: Record<string, React.CSSProperties> = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 300, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease', fontFamily: 'var(--font-body)' },
        topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: 60, borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', flexShrink: 0 },
        iconBtn: { background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: 'var(--color-text)', borderRadius: 6, display: 'flex', alignItems: 'center' },
        sidebar: { width: 220, borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '24px 12px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 },
        content: { flex: 1, overflow: 'auto', padding: '28px 32px' },
        h2: { margin: 0, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500 },
        label: { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: '0.04em' },
        primaryBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'var(--color-text)', color: 'var(--color-bg)', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' },
        dangerBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s' },
    };

    const tabBtn = (t: Tab): React.CSSProperties => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 8, border: 'none',
        background: tab === t ? 'var(--color-surface-alt)' : 'none',
        color: tab === t ? 'var(--color-text)' : 'var(--color-text-muted)',
        fontSize: 13.5, fontWeight: tab === t ? 600 : 400,
        cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'var(--font-body)',
        transition: 'all 0.15s',
    });

    const spinner = <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />;

    return (
        <div style={S.overlay}>
            {/* Top bar */}
            <div style={S.topBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500 }}>Admin Dashboard</p>
                    {loading && <span style={{ width: 16, height: 16, border: '2px solid var(--color-border)', borderTopColor: 'var(--color-text)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={fetchAll} style={{ ...S.iconBtn, color: 'var(--color-text-muted)' }} title="Refresh"><RefreshCw size={16} /></button>
                    <button onClick={onClose} style={S.iconBtn}><X size={18} /></button>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <aside style={S.sidebar}>
                    <p style={{ margin: '0 0 12px 14px', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Navigation</p>
                    {([
                        ['dashboard', 'Dashboard', LayoutDashboard],
                        ['products', 'Products', Package],
                        ['orders', 'Orders', ShoppingBag],
                        ['users', 'Users', Users],
                        ['system', 'System', Shield],
                    ] as [Tab, string, any][]).map(([t, label, Icon]) => (
                        <button key={t} style={tabBtn(t)} onClick={() => setTab(t)}
                            onMouseEnter={e => { if (tab !== t) e.currentTarget.style.background = 'var(--color-surface-alt)'; }}
                            onMouseLeave={e => { if (tab !== t) e.currentTarget.style.background = 'none'; }}
                        >
                            <Icon size={16} />{label}
                            {t === 'orders' && pendingCount > 0 && (
                                <span style={{ marginLeft: 'auto', background: 'var(--color-accent)', color: '#1A1A1A', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '2px 7px' }}>{pendingCount}</span>
                            )}
                        </button>
                    ))}
                </aside>

                {/* Content */}
                <main style={S.content}>
                    {dataError && <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: 13.5, marginBottom: 20 }}>{dataError}</div>}

                    {/* ── Dashboard ── */}
                    {tab === 'dashboard' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <h2 style={S.h2}>Overview</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                                <StatCard label="Revenue" value={`$${revenue.toFixed(2)}`} sub="from paid orders" />
                                <StatCard label="Orders" value={orders.length} sub={`${pendingCount} pending`} />
                                <StatCard label="Products" value={items.length} />
                                <StatCard label="Users" value={users.length} />
                            </div>
                            <div>
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, margin: '0 0 16px' }}>Recent Orders</h3>
                                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
                                    <table className="admin-table">
                                        <thead><tr><th>#</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                                        <tbody>
                                            {orders.slice(0, 10).map(o => (
                                                <tr key={o.id}>
                                                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>#{o.id}</td>
                                                    <td>{o.customerDisplay || '—'}</td>
                                                    <td style={{ fontWeight: 500 }}>${o.totalAmount.toFixed(2)}</td>
                                                    <td><Badge status={o.status} /></td>
                                                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12.5 }}>{formatDate(o.createdAt)}</td>
                                                </tr>
                                            ))}
                                            {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>No orders yet</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Products ── */}
                    {tab === 'products' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={S.h2}>Products <span style={{ fontSize: 15, color: 'var(--color-text-muted)', fontWeight: 400, fontFamily: 'var(--font-body)' }}>({items.length})</span></h2>
                                <button style={S.primaryBtn} onClick={openAddItem}><Plus size={15} />Add Product</button>
                            </div>
                            {showItemForm && (
                                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 24, animation: 'slideUp 0.25s ease' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500 }}>{editingItem ? `Edit — ${editingItem.name}` : 'New Product'}</h3>
                                        <button onClick={() => setShowItemForm(false)} style={{ ...S.iconBtn, color: 'var(--color-text-muted)' }}><X size={16} /></button>
                                    </div>
                                    <form onSubmit={handleSaveItem}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                            {([['name', 'Name', 'text', true], ['category', 'Category', 'text', false], ['price', 'Price ($)', 'number', true], ['stockQuantity', 'Stock', 'number', true]] as [string, string, string, boolean][]).map(([k, l, t, r]) => (
                                                <div key={k}>
                                                    <label style={S.label}>{l}</label>
                                                    <input className="form-input" type={t} required={r} step={t === 'number' ? '0.01' : undefined} min={t === 'number' ? 0 : undefined} value={(itemForm as any)[k]} onChange={e => setItemForm(f => ({ ...f, [k]: e.target.value }))} />
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ marginBottom: 14 }}>
                                            <label style={S.label}>Description</label>
                                            <textarea className="form-input" rows={3} style={{ resize: 'vertical' }} value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
                                            <div><label style={S.label}>Image URL</label><input className="form-input" type="url" placeholder="https://..." value={itemForm.image} onChange={e => setItemForm(f => ({ ...f, image: e.target.value }))} /></div>
                                            <div>
                                                <label style={S.label}>Gender</label>
                                                <select className="form-input" style={{ cursor: 'pointer' }} value={itemForm.gender} onChange={e => setItemForm(f => ({ ...f, gender: e.target.value }))}>
                                                    <option value="">Any</option><option value="men">Men</option><option value="women">Women</option><option value="unisex">Unisex</option>
                                                </select>
                                            </div>
                                            <div><label style={S.label}>Tags (comma-sep)</label><input className="form-input" placeholder="new, sale" value={itemForm.tags} onChange={e => setItemForm(f => ({ ...f, tags: e.target.value }))} /></div>
                                        </div>
                                        {itemFormError && <p style={{ color: 'var(--color-error)', fontSize: 13, margin: '0 0 12px' }}>{itemFormError}</p>}
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button type="submit" disabled={itemSaving} style={{ ...S.primaryBtn, opacity: itemSaving ? 0.7 : 1, cursor: itemSaving ? 'not-allowed' : 'pointer' }}>
                                                {itemSaving && spinner}{editingItem ? 'Save Changes' : 'Create Product'}
                                            </button>
                                            <button type="button" onClick={() => setShowItemForm(false)} style={{ padding: '10px 20px', background: 'none', border: '1px solid var(--color-border)', borderRadius: 7, fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}>Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            )}
                            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
                                <table className="admin-table">
                                    <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                                    <tbody>
                                        {items.map(item => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        {item.image && <img src={item.image} alt={item.name} style={{ width: 38, height: 48, objectFit: 'cover', borderRadius: 4, background: 'var(--color-surface-alt)' }} />}
                                                        <div>
                                                            <p style={{ margin: 0, fontWeight: 500, fontSize: 13.5 }}>{item.name}</p>
                                                            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ color: 'var(--color-text-muted)' }}>{item.category || '—'}</td>
                                                <td style={{ fontWeight: 500 }}>${item.price.toFixed(2)}</td>
                                                <td style={{ color: item.stockQuantity === 0 ? 'var(--color-error)' : item.stockQuantity < 5 ? 'var(--color-warning)' : 'inherit' }}>{item.stockQuantity}</td>
                                                <td>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                                        <button onClick={() => openEditItem(item)} style={{ ...S.iconBtn, color: 'var(--color-text-muted)' }} title="Edit"><Pencil size={14} /></button>
                                                        <button onClick={() => handleDeleteItem(item)} style={{ ...S.iconBtn, color: 'var(--color-error)' }} title="Delete"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {items.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No products yet</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Orders ── */}
                    {tab === 'orders' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={S.h2}>Orders <span style={{ fontSize: 15, color: 'var(--color-text-muted)', fontWeight: 400, fontFamily: 'var(--font-body)' }}>({visibleOrders.length})</span></h2>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {(['ALL', 'PENDING', 'PAID', 'CANCELLED'] as const).map(s => (
                                        <button key={s} onClick={() => setOrderFilter(s)} style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', borderColor: orderFilter === s ? 'var(--color-text)' : 'var(--color-border)', background: orderFilter === s ? 'var(--color-text)' : 'none', color: orderFilter === s ? 'var(--color-bg)' : 'var(--color-text-muted)' }}>{s}</button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
                                <table className="admin-table">
                                    <thead><tr><th>#</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                                    <tbody>
                                        {visibleOrders.map(o => (
                                            <tr key={o.id}>
                                                <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>#{o.id}</td>
                                                <td>
                                                    {/* customerDisplay = "Full Name (email)" or just email or "—" */}
                                                    <span style={{ fontSize: 13.5 }}>{o.customerDisplay || '—'}</span>
                                                </td>
                                                <td style={{ fontWeight: 500 }}>${o.totalAmount.toFixed(2)}</td>
                                                <td><Badge status={o.status} /></td>
                                                <td style={{ color: 'var(--color-text-muted)', fontSize: 12.5 }}>{formatDate(o.createdAt)}</td>
                                                <td>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                        {o.status === 'PENDING' && (
                                                            <button onClick={() => handleCancelOrder(o)} style={{ ...S.iconBtn, color: 'var(--color-error)' }} title="Cancel this pending order">
                                                                <XCircle size={15} />
                                                            </button>
                                                        )}
                                                        {o.status === 'PAID' && (
                                                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }} title="Paid orders cannot be cancelled">
                                                                <CheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} color="var(--color-success)" />
                                                                Paid
                                                            </span>
                                                        )}
                                                        {o.status === 'CANCELLED' && (
                                                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                                                Cancelled
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {visibleOrders.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No orders found</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Users ── */}
                    {tab === 'users' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={S.h2}>Users <span style={{ fontSize: 15, color: 'var(--color-text-muted)', fontWeight: 400, fontFamily: 'var(--font-body)' }}>({users.length})</span></h2>
                                <button style={S.primaryBtn} onClick={() => { setShowUserForm(v => !v); setUserFormError(null); }}><UserPlus size={15} />Add User</button>
                            </div>
                            {showUserForm && (
                                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 24, animation: 'slideUp 0.25s ease' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500 }}>Add New User</h3>
                                        <button onClick={() => setShowUserForm(false)} style={{ ...S.iconBtn, color: 'var(--color-text-muted)' }}><X size={16} /></button>
                                    </div>
                                    <form onSubmit={handleSaveUser}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                            <div><label style={S.label}>Full Name</label><input className="form-input" type="text" value={userForm.fullName} onChange={e => setUserForm(f => ({ ...f, fullName: e.target.value }))} /></div>
                                            <div>
                                                <label style={S.label}>Role</label>
                                                <select className="form-input" style={{ cursor: 'pointer' }} value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value as 'USER' | 'ADMIN' }))}>
                                                    <option value="USER">USER</option><option value="ADMIN">ADMIN</option>
                                                </select>
                                            </div>
                                            <div><label style={S.label}>Email</label><input className="form-input" type="email" required value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} /></div>
                                            <div><label style={S.label}>Password</label><input className="form-input" type="password" required minLength={6} value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} /></div>
                                        </div>
                                        {userFormError && <p style={{ color: 'var(--color-error)', fontSize: 13, margin: '0 0 12px' }}>{userFormError}</p>}
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button type="submit" disabled={userSaving} style={{ ...S.primaryBtn, opacity: userSaving ? 0.7 : 1 }}>
                                                {userSaving && spinner}Create User
                                            </button>
                                            <button type="button" onClick={() => setShowUserForm(false)} style={{ padding: '10px 20px', background: 'none', border: '1px solid var(--color-border)', borderRadius: 7, fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}>Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            )}
                            {editingUser && (
                                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 24, animation: 'slideUp 0.25s ease' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500 }}>Edit credentials</h3>
                                            <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)', fontSize: 13 }}>User: {editingUser.email}</p>
                                        </div>
                                        <button onClick={() => setEditingUserId(null)} style={{ ...S.iconBtn, color: 'var(--color-text-muted)' }}><X size={16} /></button>
                                    </div>
                                    <form onSubmit={e => handleUpdateCredentials(e, editingUser.id)}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                            <div><label style={S.label}>New Email</label><input className="form-input" type="email" placeholder="Leave blank to keep current" value={editCredsForm.email} onChange={e => setEditCredsForm(f => ({ ...f, email: e.target.value }))} /></div>
                                            <div><label style={S.label}>New Password</label><input className="form-input" type="password" minLength={6} placeholder="Leave blank to keep current" value={editCredsForm.password} onChange={e => setEditCredsForm(f => ({ ...f, password: e.target.value }))} /></div>
                                        </div>
                                        {editCredsError && <p style={{ color: 'var(--color-error)', fontSize: 13, margin: '0 0 12px' }}>{editCredsError}</p>}
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button type="submit" disabled={editCredsSaving} style={{ ...S.primaryBtn, opacity: editCredsSaving ? 0.7 : 1 }}>
                                                {editCredsSaving && spinner}Update Credentials
                                            </button>
                                            <button type="button" onClick={() => setEditingUserId(null)} style={{ padding: '10px 20px', background: 'none', border: '1px solid var(--color-border)', borderRadius: 7, fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}>Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            )}
                            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
                                <table className="admin-table">
                                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td style={{ fontWeight: 500 }}>{u.fullName || '—'}</td>
                                                <td style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                                                <td>
                                                    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: (u.role === 'ADMIN' || u.role === 'ROLE_ADMIN') ? 'var(--color-accent-light)' : 'var(--color-surface-alt)', color: (u.role === 'ADMIN' || u.role === 'ROLE_ADMIN') ? 'var(--color-accent-dark)' : 'var(--color-text-muted)' }}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                                        <button onClick={() => openEditCredentials(u.id)} style={{ ...S.iconBtn, color: 'var(--color-text)' }} title="Edit credentials"><Pencil size={14} /></button>
                                                        {u.role !== 'ADMIN' && u.role !== 'ROLE_ADMIN' && (
                                                            <button onClick={() => handleChangeRole(u, 'ADMIN')} disabled={roleLoading === u.id} style={{ ...S.iconBtn, color: 'var(--color-accent-dark)', opacity: roleLoading === u.id ? 0.5 : 1 }} title="Promote to Admin"><UserCheck size={14} /></button>
                                                        )}
                                                        {(u.role === 'ADMIN' || u.role === 'ROLE_ADMIN') && (
                                                            <button onClick={() => handleChangeRole(u, 'USER')} disabled={roleLoading === u.id} style={{ ...S.iconBtn, color: 'var(--color-warning)', opacity: roleLoading === u.id ? 0.5 : 1 }} title="Revoke Admin"><UserX size={14} /></button>
                                                        )}
                                                        <button onClick={() => handleDeleteUser(u)} style={{ ...S.iconBtn, color: 'var(--color-error)' }} title="Delete"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No users found</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── System ── */}
                    {tab === 'system' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
                            <h2 style={S.h2}>System</h2>
                            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 28 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Shield size={20} color="var(--color-text-muted)" /></div>
                                    <div>
                                        <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500 }}>Token Blacklist Management</h3>
                                        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                                            Remove expired or revoked JWT tokens. <strong>Cleanup</strong> removes expired tokens only. <strong>Force Cleanup</strong> purges all blacklisted entries.
                                        </p>
                                    </div>
                                </div>
                                {cleanupMsg && <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: 8, marginBottom: 18 }}><CheckCircle size={16} color="#166534" /><span style={{ fontSize: 13.5, color: '#166534' }}>{cleanupMsg}</span></div>}
                                {cleanupError && <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, marginBottom: 18 }}><XCircle size={16} color="#991B1B" /><span style={{ fontSize: 13.5, color: '#991B1B' }}>{cleanupError}</span></div>}
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button onClick={() => runCleanup('cleanup')} disabled={cleanupLoading !== null} style={{ ...S.dangerBtn, opacity: cleanupLoading ? 0.6 : 1, cursor: cleanupLoading ? 'not-allowed' : 'pointer' }} onMouseEnter={e => { if (!cleanupLoading) e.currentTarget.style.background = '#FEE2E2'; }} onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; }}>
                                        {cleanupLoading === 'cleanup' ? <span style={{ width: 14, height: 14, border: '2px solid #FECACA', borderTopColor: '#991B1B', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : <AlertTriangle size={15} />}Cleanup
                                    </button>
                                    <button onClick={() => runCleanup('force')} disabled={cleanupLoading !== null} style={{ ...S.dangerBtn, background: '#FFF1F2', borderColor: '#FDA4AF', color: '#9F1239', opacity: cleanupLoading ? 0.6 : 1, cursor: cleanupLoading ? 'not-allowed' : 'pointer' }} onMouseEnter={e => { if (!cleanupLoading) e.currentTarget.style.background = '#FFE4E6'; }} onMouseLeave={e => { e.currentTarget.style.background = '#FFF1F2'; }}>
                                        {cleanupLoading === 'force' ? <span style={{ width: 14, height: 14, border: '2px solid #FDA4AF', borderTopColor: '#9F1239', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : <Zap size={15} />}Force Cleanup
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}