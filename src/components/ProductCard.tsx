import { ShoppingCart } from 'lucide-react';
import type { Product } from '../types';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const TAG_STYLES: Record<string, React.CSSProperties> = {
    new: {
        background: 'var(--color-text)',
        color: 'var(--color-bg)',
    },
    sale: {
        background: 'var(--color-accent)',
        color: '#1A1A1A',
    },
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
    const priceText =
        typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : '—';

    const tags = (product.tags ?? []).filter(t => t === 'new' || t === 'sale');

    return (
        <article
            className="product-card"
            style={{
                background: 'var(--color-surface)',
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'default',
            }}
        >
            {/* Image container */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '75%',    /* 4:3 landscape-ish — compact */
                    overflow: 'hidden',
                    background: 'var(--color-surface-alt)',
                    flexShrink: 0,
                }}
            >
                <img
                    src={product.image ?? ''}
                    alt={product.name ?? 'Product'}
                    loading="lazy"
                    className="product-card__img"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                    onError={e => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.style.display = 'none';
                    }}
                />

                {/* Tags */}
                {tags.length > 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                        }}
                    >
                        {tags.map(tag => (
                            <span
                                key={tag}
                                style={{
                                    ...TAG_STYLES[tag],
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    fontFamily: 'var(--font-body)',
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Add to cart overlay button */}
                <button
                    onClick={() => onAddToCart(product)}
                    aria-label={`Add ${product.name} to cart`}
                    className="product-card__cart-btn"
                    style={{
                        position: 'absolute',
                        bottom: 14,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 6,
                        padding: '9px 18px',
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: 'var(--color-text)',
                        fontFamily: 'var(--font-body)',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--color-text)';
                        e.currentTarget.style.color = 'var(--color-bg)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--color-surface)';
                        e.currentTarget.style.color = 'var(--color-text)';
                    }}
                >
                    <ShoppingCart size={13} />
                    Add to Cart
                </button>
            </div>

            {/* Info */}
            <div
                style={{
                    padding: '16px 16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    flex: 1,
                }}
            >
                {product.category && (
                    <p
                        style={{
                            margin: 0,
                            fontSize: 10.5,
                            fontWeight: 500,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--color-text-muted)',
                            fontFamily: 'var(--font-body)',
                        }}
                    >
                        {product.category}
                    </p>
                )}

                <h3
                    style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 500,
                        color: 'var(--color-text)',
                        fontFamily: 'var(--font-display)',
                        lineHeight: 1.3,
                    }}
                >
                    {product.name}
                </h3>

                {product.description && (
                    <p
                        style={{
                            margin: 0,
                            fontSize: 12.5,
                            color: 'var(--color-text-muted)',
                            lineHeight: 1.5,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as 'vertical',
                        }}
                    >
                        {product.description}
                    </p>
                )}

                <p
                    style={{
                        margin: '8px 0 0',
                        fontSize: 15,
                        fontWeight: 500,
                        color: 'var(--color-text)',
                        fontFamily: 'var(--font-body)',
                    }}
                >
                    {priceText}
                </p>
            </div>
        </article>
    );
}