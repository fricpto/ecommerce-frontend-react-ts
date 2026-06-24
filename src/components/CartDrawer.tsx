import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import type { CartItem } from '../types';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: CartItem[];
    onUpdateQuantity: (productId: number, quantity: number) => void;
    onRemove: (productId: number) => void;
    onCheckout: () => void;
}

export function CartDrawer({
    isOpen, onClose, cartItems, onUpdateQuantity, onRemove, onCheckout,
}: CartDrawerProps) {
    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.45)',
                    zIndex: 200,
                    animation: 'fadeIn 0.25s ease',
                }}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                style={{
                    position: 'fixed',
                    top: 0, left: 0, bottom: 0,
                    width: '100%',
                    maxWidth: 420,
                    background: 'var(--color-surface)',
                    boxShadow: '6px 0 40px rgba(0,0,0,0.13)',
                    zIndex: 201,
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'var(--font-body)',
                    animation: 'slideInLeft 0.3s ease',
                }}
            >
                {/* ── Header ─────────────────────────────────────────── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px 24px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    flexShrink: 0,
                }}>
                    <div>
                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 22,
                            fontWeight: 500,
                            margin: 0,
                            color: 'var(--color-text)',
                            letterSpacing: '-0.01em',
                        }}>
                            Your Cart
                        </h2>
                        {itemCount > 0 && (
                            <p style={{
                                margin: '2px 0 0',
                                fontSize: 12,
                                color: 'var(--color-text-muted)',
                                letterSpacing: '0.02em',
                            }}>
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 8,
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                        aria-label="Close cart"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Items ──────────────────────────────────────────── */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    minHeight: 0,
                    padding: '8px 0',
                }}>
                    {cartItems.length === 0 ? (
                        /* Empty state */
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            padding: '60px 24px',
                            textAlign: 'center',
                            gap: 16,
                        }}>
                            <div style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: 'var(--color-surface-alt)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <ShoppingBag size={26} color="var(--color-text-muted)" />
                            </div>
                            <div>
                                <p style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 18,
                                    fontWeight: 500,
                                    color: 'var(--color-text)',
                                    margin: '0 0 6px',
                                }}>
                                    Your cart is empty
                                </p>
                                <p style={{ fontSize: 13.5, color: 'var(--color-text-muted)', margin: 0 }}>
                                    Add something beautiful to get started.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    marginTop: 8,
                                    fontFamily: 'var(--font-body)',
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    background: 'var(--color-text)',
                                    color: 'var(--color-bg)',
                                    border: 'none',
                                    padding: '11px 28px',
                                    cursor: 'pointer',
                                    transition: 'opacity 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <ul style={{ listStyle: 'none', margin: 0, padding: '8px 0' }}>
                            {cartItems.map((item, index) => (
                                <li
                                    key={item.id}
                                    style={{
                                        display: 'flex',
                                        gap: 14,
                                        padding: '16px 24px',
                                        borderBottom: index < cartItems.length - 1
                                            ? '1px solid var(--color-border)'
                                            : 'none',
                                    }}
                                >
                                    {/* Product image */}
                                    <div style={{
                                        width: 80,
                                        height: 104,
                                        flexShrink: 0,
                                        borderRadius: 6,
                                        overflow: 'hidden',
                                        background: 'var(--color-surface-alt)',
                                    }}>
                                        <img
                                            src={item.image ?? ''}
                                            alt={item.name ?? 'product'}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block',
                                            }}
                                            loading="lazy"
                                            onError={e => {
                                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>

                                    {/* Info + controls */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                                        {/* Name + remove */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                            <div style={{ minWidth: 0 }}>
                                                {item.category && (
                                                    <p style={{
                                                        margin: '0 0 2px',
                                                        fontSize: 10,
                                                        fontWeight: 600,
                                                        letterSpacing: '0.1em',
                                                        textTransform: 'uppercase',
                                                        color: 'var(--color-text-muted)',
                                                    }}>
                                                        {item.category}
                                                    </p>
                                                )}
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                    color: 'var(--color-text)',
                                                    fontFamily: 'var(--font-display)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {item.name}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => onRemove(item.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: 4,
                                                    cursor: 'pointer',
                                                    color: 'var(--color-border)',
                                                    flexShrink: 0,
                                                    borderRadius: 4,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    transition: 'color 0.15s',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-error)')}
                                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-border)')}
                                                aria-label={`Remove ${item.name}`}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        {/* Price */}
                                        <p style={{
                                            margin: 0,
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: 'var(--color-text)',
                                        }}>
                                            ${(item.price * item.quantity).toFixed(2)}
                                            {item.quantity > 1 && (
                                                <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 400 }}>
                                                    (${item.price.toFixed(2)} ea.)
                                                </span>
                                            )}
                                        </p>

                                        {/* Quantity stepper */}
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 6,
                                            overflow: 'hidden',
                                            alignSelf: 'flex-start',
                                            marginTop: 4,
                                        }}>
                                            <button
                                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--color-text-muted)',
                                                    transition: 'background 0.12s',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-alt)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span style={{
                                                width: 32,
                                                textAlign: 'center',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: 'var(--color-text)',
                                                borderLeft: '1px solid var(--color-border)',
                                                borderRight: '1px solid var(--color-border)',
                                                lineHeight: '32px',
                                                userSelect: 'none',
                                            }}>
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--color-text-muted)',
                                                    transition: 'background 0.12s',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-alt)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                                aria-label="Increase quantity"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* ── Footer ─────────────────────────────────────────── */}
                {cartItems.length > 0 && (
                    <div style={{
                        borderTop: '1px solid var(--color-border)',
                        padding: '20px 24px 24px',
                        flexShrink: 0,
                        background: 'var(--color-surface)',
                    }}>
                        {/* Subtotal row */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            marginBottom: 6,
                        }}>
                            <span style={{ fontSize: 13.5, color: 'var(--color-text-muted)' }}>
                                Subtotal
                            </span>
                            <span style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 20,
                                fontWeight: 500,
                                color: 'var(--color-text)',
                            }}>
                                ${subtotal.toFixed(2)}
                            </span>
                        </div>

                        {/* Shipping note */}
                        <p style={{
                            margin: '0 0 18px',
                            fontSize: 12,
                            color: 'var(--color-text-muted)',
                        }}>
                            Shipping calculated at checkout
                        </p>

                        {/* Checkout button */}
                        <button
                            onClick={onCheckout}
                            style={{
                                width: '100%',
                                padding: '14px',
                                fontFamily: 'var(--font-body)',
                                fontSize: 12,
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                background: 'var(--color-text)',
                                color: 'var(--color-bg)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                            Proceed to Checkout
                        </button>

                        {/* Continue shopping */}
                        <button
                            onClick={onClose}
                            style={{
                                width: '100%',
                                marginTop: 10,
                                padding: '11px',
                                fontFamily: 'var(--font-body)',
                                fontSize: 12,
                                fontWeight: 500,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                background: 'none',
                                color: 'var(--color-text-muted)',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                transition: 'color 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.color = 'var(--color-text)';
                                e.currentTarget.style.borderColor = 'var(--color-text)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.color = 'var(--color-text-muted)';
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                            }}
                        >
                            Continue Shopping
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}