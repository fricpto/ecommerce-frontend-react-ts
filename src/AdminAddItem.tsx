// AdminAddItem.tsx
import { useState } from "react";
import { addProduct } from "./utility/api";

export function AdminAddItem({ onCreated }: { onCreated?: () => void }) {
    const [form, setForm] = useState({ name: "", description: "", price: 0, stockQuantity: 0, category: "" });
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addProduct(form);
            alert("Item created");
            setForm({ name: "", description: "", price: 0, stockQuantity: 0, category: "" });
            onCreated?.();
        } catch (err) {
            console.error(err);
            alert("Failed to add item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-2">
            <input required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <input required type="number" step="0.01" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
            <input required type="number" placeholder="Stock" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: Number(e.target.value) })} />
            <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            <button type="submit" disabled={loading} className="bg-black text-white px-3 py-1 rounded">{loading ? "Adding..." : "Add Item"}</button>
        </form>
    );
}
