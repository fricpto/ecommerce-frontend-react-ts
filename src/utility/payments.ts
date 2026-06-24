// utils/payments.ts
export async function simulatePayment(values: {
    cardNumber: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    walletId: number;
    amount: number;
}) {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/user/payments/simulate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(values)
    });

    const body = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, body };
}
