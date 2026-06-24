export type Product = {
    id: number;
    name: string;
    price: number;
    image?: string | null;
    category?: string | null;
    description?: string | null;
    tags?: string[] | null;
    gender?: 'men' | 'women' | 'unisex' | null;
};

export type CartItem = Product & { quantity: number };

// ── Credit card / wallet ──────────────────────────────────────
// WalletController.AddCardRequest only accepts { number }.
// The backend stores only the card number — expiry and CVV are NOT persisted
// (correct PCI-DSS practice). expiryMonth/expiryYear are therefore optional.
export type CreditCard = {
    id: number;
    number?: string;           // actual backend field (c.getNumber()), masked on return
    cardNumber?: string;       // alias for backward compat
    cardHolderName?: string;
    expiryMonth?: number;      // optional — WalletController does not store this
    expiryYear?: number;       // optional — WalletController does not store this
    last4?: string;
};

/** Return whichever card-number field the backend sent */
export function cardDisplayNumber(c: CreditCard): string {
    return c.number ?? c.cardNumber ?? '';
}

export type Wallet = {
    id: number;
    balance?: number;
    creditCards: CreditCard[];
};

// ── Admin types ───────────────────────────────────────────────
export type AdminItem = {
    id: number;
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    category: string;
    image?: string | null;
    tags?: string[];
    gender?: string;
};

export type AdminUser = {
    id: number;
    email: string;
    fullName: string;
    role: string;
};

export type OrderItemDetail = {
    id: number;
    itemName?: string;
    quantity: number;
    price: number;
};

// AdminController.getAllOrders() now returns flat fields (no @JsonBackReference issue):
//   userEmail    — o.getUser().getEmail()
//   userFullName — o.getUser().getFullName()
//   createdAt    — ISO-8601 string (LocalDateTime.toString())
export type AdminOrder = {
    id: number;
    status: string;
    totalAmount: number;
    createdAt?: string;
    userEmail?: string;
    userFullName?: string;
    orderItems?: OrderItemDetail[];
    customerDisplay?: string;
};

export type LoggedInUser = {
    email: string;
    name: string;
    role: string;
    walletId?: number;
};