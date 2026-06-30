import { useState } from "react";
import axios from "axios";

export default function RfqCreate({ supplierId, products }) {
    const [items, setItems] = useState([
        { product_id: "", qty: 1, target_price: "" },
    ]);
    const [notes, setNotes] = useState("");

    const addItem = () =>
        setItems([...items, { product_id: "", qty: 1, target_price: "" }]);
    const updateItem = (i, key, val) => {
        const next = [...items];
        next[i][key] = val;
        setItems(next);
    };

    const submit = async () => {
        await axios.post("/api/rfqs", {
            supplier_id: supplierId,
            notes,
            items,
        });
        alert("Permintaan penawaran (RFQ) berhasil dikirim ke supplier!");
    };

    return (
        <div className="p-6 max-w-xl space-y-4">
            <h1 className="text-lg font-semibold">
                Buat Permintaan Penawaran (RFQ)
            </h1>

            {items.map((item, i) => (
                <div
                    key={i}
                    className="grid grid-cols-3 gap-2 bg-white p-3 rounded shadow"
                >
                    <select
                        className="border rounded p-2 text-sm col-span-3"
                        value={item.product_id}
                        onChange={(e) =>
                            updateItem(i, "product_id", e.target.value)
                        }
                    >
                        <option value="">Pilih Produk</option>
                        {products?.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        placeholder="Qty"
                        className="border rounded p-2 text-sm"
                        value={item.qty}
                        onChange={(e) => updateItem(i, "qty", e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Target Harga (opsional)"
                        className="border rounded p-2 text-sm col-span-2"
                        value={item.target_price}
                        onChange={(e) =>
                            updateItem(i, "target_price", e.target.value)
                        }
                    />
                </div>
            ))}

            <button onClick={addItem} className="text-sm text-blue-600">
                + Tambah Produk
            </button>

            <textarea
                placeholder="Catatan untuk supplier"
                className="w-full border rounded p-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />

            <button
                onClick={submit}
                className="w-full bg-blue-600 text-white rounded p-2 font-medium"
            >
                Kirim RFQ
            </button>
        </div>
    );
}
