import { useState, useEffect } from "react";
import axios from "axios";

const freqLabel = {
    weekly: "Mingguan",
    biweekly: "2 Mingguan",
    monthly: "Bulanan",
};

export default function MySubscriptions() {
    const [subs, setSubs] = useState([]);

    const fetchData = async () => {
        const { data } = await axios.get("/api/my-subscriptions");
        setSubs(data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleStatus = async (id, current) => {
        const next = current === "active" ? "paused" : "active";
        await axios.patch(`/api/my-subscriptions/${id}/status`, {
            status: next,
        });
        fetchData();
    };

    const cancel = async (id) => {
        if (!confirm("Batalkan langganan ini?")) return;
        await axios.patch(`/api/my-subscriptions/${id}/status`, {
            status: "cancelled",
        });
        fetchData();
    };

    return (
        <div className="p-6 space-y-3">
            <h1 className="text-xl font-semibold">Langganan Rutin Saya</h1>
            {subs.map((s) => (
                <div
                    key={s.id}
                    className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
                >
                    <div>
                        <p className="font-medium">{s.product?.name}</p>
                        <p className="text-sm text-gray-500">
                            {s.qty} unit · {freqLabel[s.frequency]} ·{" "}
                            {s.supplier?.user?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                            Pengiriman berikutnya: {s.next_delivery_date}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span
                            className={`text-xs px-2 py-1 rounded-full ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                        >
                            {s.status}
                        </span>
                        {s.status !== "cancelled" && (
                            <div className="flex gap-2 text-xs">
                                <button
                                    onClick={() => toggleStatus(s.id, s.status)}
                                    className="text-blue-600"
                                >
                                    {s.status === "active"
                                        ? "Jeda"
                                        : "Aktifkan"}
                                </button>
                                <button
                                    onClick={() => cancel(s.id)}
                                    className="text-red-600"
                                >
                                    Batalkan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
