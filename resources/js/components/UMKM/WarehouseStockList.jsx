import { useState, useEffect } from "react";
import axios from "axios";

export default function WarehouseStockList({ productId }) {
    const [stocks, setStocks] = useState([]);

    useEffect(() => {
        axios
            .get(`/api/products/${productId}/warehouse-stock`)
            .then((res) => setStocks(res.data));
    }, [productId]);

    if (stocks.length === 0) return null;

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <p className="font-medium text-sm mb-2">
                Ketersediaan Stok per Gudang
            </p>
            <div className="space-y-1 text-sm">
                {stocks.map((s) => (
                    <div key={s.warehouse_id} className="flex justify-between">
                        <span>
                            {s.warehouse_name} ({s.city})
                        </span>
                        <span
                            className={
                                s.stock > 0
                                    ? "text-green-600 font-medium"
                                    : "text-red-500"
                            }
                        >
                            {s.stock > 0
                                ? `${s.stock} unit tersedia`
                                : "Stok kosong"}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
