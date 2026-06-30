import { useState, useEffect } from "react";
import axios from "axios";

export default function RfqIndex() {
    const [rfqs, setRfqs] = useState([]);

    const fetchData = async () => {
        const { data } = await axios.get("/api/rfqs/umkm");
        setRfqs(data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const acceptOffer = async (offerId) => {
        if (!confirm("Terima penawaran ini dan buat pesanan?")) return;
        await axios.post(`/api/rfqs/offers/${offerId}/accept`);
        fetchData();
    };

    return (
        <div className="p-6 space-y-3">
            <h1 className="text-xl font-semibold">RFQ Saya</h1>
            {rfqs.map((rfq) => (
                <div key={rfq.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between">
                        <p className="font-medium">
                            {rfq.supplier?.user?.name}
                        </p>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                            {rfq.status}
                        </span>
                    </div>
                    <ul className="text-sm text-gray-600 mt-2">
                        {rfq.items?.map((it) => (
                            <li key={it.id}>
                                {it.product?.name} x {it.qty}
                            </li>
                        ))}
                    </ul>
                    {rfq.offers?.length > 0 && (
                        <div className="mt-3 border-t pt-2 space-y-2">
                            {rfq.offers.map((offer) => (
                                <div
                                    key={offer.id}
                                    className="flex justify-between items-center text-sm bg-green-50 rounded p-2"
                                >
                                    <span>
                                        Penawaran: Rp{" "}
                                        {Number(
                                            offer.supplier_price,
                                        ).toLocaleString("id-ID")}{" "}
                                        — {offer.note}
                                    </span>
                                    {rfq.status === "negotiated" && (
                                        <button
                                            onClick={() =>
                                                acceptOffer(offer.id)
                                            }
                                            className="text-green-700 font-medium"
                                        >
                                            Terima
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
