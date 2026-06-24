import React, { useState } from 'react';
import { X, CreditCard, ChevronDown, ChevronUp, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import type { CartItem, CreditCard as CreditCardType } from '../types';
import { cardDisplayNumber } from '../types';
import {
    syncCartToBackend, placeOrder, payOrder,
    addCardToWallet, removeCardFromWallet,
} from '../utility/api';

// ── Validation helpers ────────────────────────────────────────

/** Card number must be exactly 16 digits (spaces and dashes are stripped first). */
function isCardNumberValid(raw: string): boolean {
    return /^\d{16}$/.test(raw.replace(/[\s\-]/g, ''));
}

/**
 * Expiry must be MM/YY or MM/YYYY, non-expired.
 * Returns parsed { month, year } or null if unparseable.
 */
function parseExpiry(raw: string): { month: number; year: number } | null {
    const cleaned = raw.trim();
    const match = cleaned.match(/^(\d{1,2})[\/\-](\d{2}|\d{4})$/);
    if (!match) return null;
    const month = Number(match[1]);
    let year = Number(match[2]);
    if (year < 100) year += 2000;
    if (month < 1 || month > 12) return null;
    return { month, year };
}

function isExpiryValid(raw: string): boolean {
    const parsed = parseExpiry(raw);
    if (!parsed) return false;
    const now = new Date();
    const expDate = new Date(parsed.year, parsed.month - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return expDate >= thisMonth;
}

/** CVV must be exactly 3 digits (Visa/MC/Discover). */
function isCvvValid(raw: string): boolean {
    return /^\d{3}$/.test(raw.trim());
}

function maskNumber(raw: string): string {
    const digits = (raw ?? '').replace(/\D/g, '');
    return digits.length >= 4 ? `•••• •••• •••• ${digits.slice(-4)}` : raw;
}

// ── Types ─────────────────────────────────────────────────────

interface CheckoutProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: CartItem[];
    onClearCart: () => void;
    userEmail: string;
    // walletId removed — payment uses payOrder(orderId, method, cardId) directly
    savedCards?: CreditCardType[];
    totalAmount?: number;
    /** Called after a card is added or removed so App re-fetches the card list. */
    onCardsUpdated?: () => void;
}

type FieldError = 'cardNumber' | 'expiry' | 'cvv';

// ── Component ─────────────────────────────────────────────────

export function Checkout({
    isOpen, onClose, cartItems, onClearCart,
    userEmail, savedCards = [], totalAmount,
    onCardsUpdated,
}: CheckoutProps) {

    const [formData, setFormData] = useState({
        fullName: '', email: userEmail,
        address: '', city: '', zipCode: '',
        cardNumber: '', expiryDate: '', cvv: '',
    });
    const [selectedSavedCard, setSelectedSavedCard] = useState<CreditCardType | null>(null);
    const [savedCardPanelOpen, setSavedCardPanelOpen] = useState(false);
    const [saveCardChecked, setSaveCardChecked] = useState(false);
    const [removingCardId, setRemovingCardId] = useState<number | null>(null);

    // Inline field validation errors (shown after user touches the field)
    const [touched, setTouched] = useState<Set<FieldError>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [paymentSucceeded, setPaymentSucceeded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = 10;
    const grandTotal = typeof totalAmount === 'number'
        ? totalAmount + shipping
        : Math.round((subtotal + shipping) * 100) / 100;

    if (!isOpen) return null;

    // ── Helpers ───────────────────────────────────────────────
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const markTouched = (f: FieldError) =>
        setTouched(prev => new Set(prev).add(f));

    const handleSelectSavedCard = (card: CreditCardType) => {
        setSelectedSavedCard(card);
        const num = cardDisplayNumber(card);
        setFormData(prev => ({
            ...prev,
            cardNumber: maskNumber(num),
            // Backend only stores card number, not expiry — clear expiry field
            expiryDate: card.expiryMonth && card.expiryYear
                ? `${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}`
                : '',
            cvv: '',
        }));
        setSavedCardPanelOpen(false);
        setSaveCardChecked(false);
        setTouched(new Set());
    };

    const handleClearSavedCard = () => {
        setSelectedSavedCard(null);
        setFormData(prev => ({ ...prev, cardNumber: '', expiryDate: '', cvv: '' }));
        setTouched(new Set());
    };

    // ── Remove saved card ──────────────────────────────────────
    const handleRemoveCard = async (card: CreditCardType, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Remove card ending in ${cardDisplayNumber(card).slice(-4)}?`)) return;
        setRemovingCardId(card.id);
        try {
            await removeCardFromWallet(card.id);
            if (selectedSavedCard?.id === card.id) handleClearSavedCard();
            onCardsUpdated?.();
        } catch (err: any) {
            alert(err.message ?? 'Failed to remove card');
        } finally {
            setRemovingCardId(null);
        }
    };

    // ── Validation state ───────────────────────────────────────
    const newCardErrors: Record<FieldError, string | null> = {
        cardNumber: !isCardNumberValid(formData.cardNumber) ? 'Must be exactly 16 digits' : null,
        expiry: !isExpiryValid(formData.expiryDate) ? 'Must be MM/YY and not expired' : null,
        cvv: !isCvvValid(formData.cvv) ? 'Must be exactly 3 digits' : null,
    };

    const savedCardErrors: Record<'cvv', string | null> = {
        cvv: !isCvvValid(formData.cvv) ? 'Must be exactly 3 digits' : null,
    };

    // Payment is "valid" if all relevant fields pass
    const paymentValid = selectedSavedCard
        ? savedCardErrors.cvv === null
        : Object.values(newCardErrors).every(v => v === null);

    // ── Submit ─────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Mark all payment fields as touched so errors appear
        setTouched(new Set<FieldError>(['cardNumber', 'expiry', 'cvv']));

        setIsProcessing(true);
        try {
            // 1. Sync cart to backend
            await syncCartToBackend(cartItems.map(i => ({ id: i.id, quantity: i.quantity })));

            // 2. Place order (always — even if payment details are wrong)
            const orderResp = await placeOrder();
            const orderId = Number(orderResp?.id);
            if (!orderId) throw new Error('Order created but no ID returned');

            if (paymentValid) {
                // ── 3a. Payment valid → pay → PAID ────────────────────
                const method = selectedSavedCard ? 'WALLET' : 'CREDIT_CARD';
                const cardId = selectedSavedCard ? selectedSavedCard.id : null;
                await payOrder(orderId, method, cardId);

                // 4. Save card to wallet if checkbox was checked (new card only)
                if (!selectedSavedCard && saveCardChecked) {
                    try {
                        // WalletController only stores card number — no expiry/CVV
                        await addCardToWallet(formData.cardNumber.replace(/\D/g, ''));
                        onCardsUpdated?.();
                    } catch (saveErr) {
                        console.warn('Card save failed (non-critical):', saveErr);
                    }
                }

                setPaymentSucceeded(true);
            } else {
                // ── 3b. Payment invalid → order stays PENDING ─────────
                // Admin can view and cancel from the dashboard.
                setPaymentSucceeded(false);
            }

            setOrderComplete(true);
            onClearCart();
            setTimeout(() => { setOrderComplete(false); onClose(); }, 5000);

        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.message ?? 'Something went wrong. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Field error display helper ─────────────────────────────
    const FieldErr = ({ field, msg }: { field: FieldError; msg: string | null }) =>
        touched.has(field) && msg
            ? <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={11} />{msg}
            </p>
            : null;

    // ── Styles ─────────────────────────────────────────────────
    const S: Record<string, React.CSSProperties> = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.2s ease' },
        modal: { width: '100%', maxWidth: 880, background: 'var(--color-surface)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.25s ease' },
        header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 },
        body: { display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'auto', flex: 1 },
        left: { padding: '28px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 24 },
        right: { padding: '28px', background: 'var(--color-surface-alt)' },
        secTitle: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, margin: '0 0 14px', color: 'var(--color-text)' },
        label: { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5, letterSpacing: '0.04em' },
        savedBanner: { background: 'var(--color-accent-light)', border: '1px solid var(--color-accent)', borderRadius: 9, overflow: 'hidden' },
        savedBannerBtn: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', cursor: 'pointer', background: 'none', border: 'none', width: '100%', fontFamily: 'var(--font-body)' },
        savedOpt: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', borderTop: '1px solid rgba(201,169,110,0.2)', width: '100%', fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'background 0.12s', textAlign: 'left' },
        activeSaved: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--color-accent-light)', border: '1px solid var(--color-accent)', borderRadius: 8, marginBottom: 14 },
        submitBtn: { padding: '13px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, letterSpacing: '0.04em' },
        fieldWrap: { marginBottom: 0 },
        iconBtn: { background: 'none', border: 'none', padding: 6, cursor: 'pointer', borderRadius: 5, display: 'flex', alignItems: 'center', flexShrink: 0 },
    };

    // ── Success screen ─────────────────────────────────────────
    if (orderComplete) {
        return (
            <div style={S.overlay}>
                <div style={{ ...S.modal, maxWidth: 460, textAlign: 'center', padding: '56px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    {paymentSucceeded ? (
                        <>
                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle size={38} color="#16A34A" />
                            </div>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, margin: 0 }}>Order Placed & Paid!</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
                                Your payment was authorised and the order is confirmed. A receipt will be sent to <strong>{formData.email}</strong>.
                            </p>
                        </>
                    ) : (
                        <>
                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertCircle size={38} color="#D97706" />
                            </div>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, margin: 0 }}>Order Placed — Payment Pending</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                                Your order was created but the payment details were invalid. The order is <strong>PENDING</strong> and can be reviewed or cancelled by an admin.
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={S.overlay} onClick={!isProcessing ? onClose : undefined}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={S.header}>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500 }}>Checkout</h2>
                    <button onClick={onClose} disabled={isProcessing} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--color-text-muted)', borderRadius: 6 }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={S.body}>
                    {/* ── Left: Form ── */}
                    <form onSubmit={handleSubmit} style={S.left}>

                        {/* Shipping */}
                        <div>
                            <p style={S.secTitle}>Shipping</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div><label style={S.label}>Full Name</label><input className="form-input" type="text" name="fullName" value={formData.fullName} onChange={handleInput} required /></div>
                                    <div><label style={S.label}>Email</label><input className="form-input" type="email" name="email" value={formData.email} onChange={handleInput} required /></div>
                                </div>
                                <div><label style={S.label}>Address</label><input className="form-input" type="text" name="address" value={formData.address} onChange={handleInput} required /></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div><label style={S.label}>City</label><input className="form-input" type="text" name="city" value={formData.city} onChange={handleInput} required /></div>
                                    <div><label style={S.label}>ZIP</label><input className="form-input" type="text" name="zipCode" value={formData.zipCode} onChange={handleInput} required /></div>
                                </div>
                            </div>
                        </div>

                        {/* Payment */}
                        <div>
                            <p style={S.secTitle}>Payment</p>

                            {/* Saved cards banner */}
                            {savedCards.length > 0 && !selectedSavedCard && (
                                <div style={{ ...S.savedBanner, marginBottom: 16 }}>
                                    <button type="button" style={S.savedBannerBtn} onClick={() => setSavedCardPanelOpen(v => !v)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <CreditCard size={16} color="var(--color-accent-dark)" />
                                            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-accent-dark)' }}>
                                                Use a saved card? ({savedCards.length})
                                            </span>
                                        </div>
                                        {savedCardPanelOpen ? <ChevronUp size={16} color="var(--color-accent-dark)" /> : <ChevronDown size={16} color="var(--color-accent-dark)" />}
                                    </button>
                                    {savedCardPanelOpen && savedCards.map(card => (
                                        <div key={card.id} style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid rgba(201,169,110,0.2)' }}>
                                            <button type="button" style={{ ...S.savedOpt, flex: 1 }}
                                                onClick={() => handleSelectSavedCard(card)}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,169,110,0.12)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                            >
                                                <CreditCard size={15} color="var(--color-accent-dark)" />
                                                <div>
                                                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: 'var(--color-text)' }}>
                                                        {maskNumber(cardDisplayNumber(card))}
                                                    </p>
                                                    <p style={{ margin: '1px 0 0', fontSize: 11.5, color: 'var(--color-text-muted)' }}>
                                                        {card.expiryMonth && card.expiryYear
                                                            ? `Expires ${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}`
                                                            : 'Saved card'}
                                                    </p>
                                                </div>
                                            </button>
                                            {/* Remove card button */}
                                            <button
                                                type="button"
                                                onClick={e => handleRemoveCard(card, e)}
                                                disabled={removingCardId === card.id}
                                                style={{ ...S.iconBtn, color: 'var(--color-error)', marginRight: 10, opacity: removingCardId === card.id ? 0.4 : 1 }}
                                                title="Remove this card"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Active saved card chip */}
                            {selectedSavedCard && (
                                <div style={{ ...S.activeSaved, marginBottom: 14 }}>
                                    <CreditCard size={16} color="var(--color-accent-dark)" />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--color-accent-dark)' }}>
                                            {maskNumber(cardDisplayNumber(selectedSavedCard))}
                                        </p>
                                        <p style={{ margin: '1px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                                            {selectedSavedCard.expiryMonth && selectedSavedCard.expiryYear
                                                ? `Expires ${String(selectedSavedCard.expiryMonth).padStart(2, '0')}/${String(selectedSavedCard.expiryYear).slice(-2)}`
                                                : 'Saved card — enter expiry and CVV below'}
                                        </p>
                                    </div>
                                    <button type="button" onClick={handleClearSavedCard} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-body)' }}>
                                        Change
                                    </button>
                                </div>
                            )}

                            {/* Card fields */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {!selectedSavedCard && (
                                    <>
                                        <div style={S.fieldWrap}>
                                            <label style={S.label}>Card Number <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(16 digits)</span></label>
                                            <input
                                                className="form-input"
                                                type="text"
                                                name="cardNumber"
                                                value={formData.cardNumber}
                                                onChange={handleInput}
                                                onBlur={() => markTouched('cardNumber')}
                                                placeholder="1234 5678 9012 3456"
                                                maxLength={19}
                                                style={{ borderColor: touched.has('cardNumber') && newCardErrors.cardNumber ? 'var(--color-error)' : undefined }}
                                            />
                                            <FieldErr field="cardNumber" msg={newCardErrors.cardNumber} />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div style={S.fieldWrap}>
                                                <label style={S.label}>Expiry <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(MM/YY)</span></label>
                                                <input
                                                    className="form-input"
                                                    type="text"
                                                    name="expiryDate"
                                                    value={formData.expiryDate}
                                                    onChange={handleInput}
                                                    onBlur={() => markTouched('expiry')}
                                                    placeholder="MM/YY"
                                                    maxLength={7}
                                                    style={{ borderColor: touched.has('expiry') && newCardErrors.expiry ? 'var(--color-error)' : undefined }}
                                                />
                                                <FieldErr field="expiry" msg={newCardErrors.expiry} />
                                            </div>
                                            <div style={S.fieldWrap}>
                                                <label style={S.label}>CVV <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(3 digits)</span></label>
                                                <input
                                                    className="form-input"
                                                    type="password"
                                                    name="cvv"
                                                    value={formData.cvv}
                                                    onChange={handleInput}
                                                    onBlur={() => markTouched('cvv')}
                                                    placeholder="•••"
                                                    maxLength={3}
                                                    style={{ borderColor: touched.has('cvv') && newCardErrors.cvv ? 'var(--color-error)' : undefined }}
                                                />
                                                <FieldErr field="cvv" msg={newCardErrors.cvv} />
                                            </div>
                                        </div>

                                        {/* Save card to wallet checkbox */}
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 13.5, color: 'var(--color-text)', marginTop: 2 }}>
                                            <input
                                                type="checkbox"
                                                checked={saveCardChecked}
                                                onChange={e => setSaveCardChecked(e.target.checked)}
                                                style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--color-text)' }}
                                            />
                                            Save this card to my wallet for future purchases
                                        </label>
                                    </>
                                )}

                                {/* CVV for saved card */}
                                {selectedSavedCard && (
                                    <div style={S.fieldWrap}>
                                        <label style={S.label}>CVV <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(3 digits — required even for saved cards)</span></label>
                                        <input
                                            className="form-input"
                                            type="password"
                                            name="cvv"
                                            value={formData.cvv}
                                            onChange={handleInput}
                                            onBlur={() => markTouched('cvv')}
                                            placeholder="•••"
                                            maxLength={3}
                                            style={{ maxWidth: 120, borderColor: touched.has('cvv') && savedCardErrors.cvv ? 'var(--color-error)' : undefined }}
                                        />
                                        <FieldErr field="cvv" msg={savedCardErrors.cvv} />
                                    </div>
                                )}
                            </div>

                            {/* Payment validity hint */}
                            {touched.size > 0 && (
                                <p style={{ margin: '10px 0 0', fontSize: 12, color: paymentValid ? 'var(--color-success)' : 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    {paymentValid
                                        ? <><CheckCircle size={12} />Valid — clicking Pay will mark the order as PAID.</>
                                        : <><AlertCircle size={12} />Invalid card details — the order will be placed as PENDING and must be handled manually.</>
                                    }
                                </p>
                            )}
                        </div>

                        {error && (
                            <p style={{ margin: 0, padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 7, color: '#991B1B', fontSize: 13 }}>
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isProcessing}
                            style={{
                                ...S.submitBtn,
                                background: isProcessing ? 'var(--color-text-muted)' : 'var(--color-text)',
                                color: 'var(--color-bg)',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {isProcessing && <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
                            {isProcessing ? 'Processing…' : `Place Order — $${grandTotal.toFixed(2)}`}
                        </button>
                    </form>

                    {/* ── Right: Summary ── */}
                    <div style={S.right}>
                        <p style={S.secTitle}>Order Summary</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                            {cartItems.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: 12 }}>
                                    <div style={{ width: 56, height: 68, borderRadius: 6, overflow: 'hidden', background: 'var(--color-border)', flexShrink: 0 }}>
                                        {item.image && <img src={item.image} alt={item.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500 }}>{item.name}</p>
                                        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>Qty: {item.quantity}</p>
                                        <p style={{ margin: '3px 0 0', fontSize: 13.5, fontWeight: 500 }}>${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 20, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
                            {[['Subtotal', `$${subtotal.toFixed(2)}`], ['Shipping', `$${shipping.toFixed(2)}`]].map(([l, v]) => (
                                <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 13.5, color: 'var(--color-text-muted)' }}>{l}</span>
                                    <span style={{ fontSize: 13.5 }}>{v}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                                <span style={{ fontSize: 15, fontWeight: 600 }}>Total</span>
                                <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)' }}>${grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}