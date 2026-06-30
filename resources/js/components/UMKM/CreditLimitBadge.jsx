import { useState, useEffect } from "react";
import axios from "axios";

export default function CreditLimitBadge({ supplierId }) {
    const [credit, setCredit] = useState(null);

    useEffect(() => {
        axios
            .get(`/api/suppliers/${supplierId}/my-credit-limit`)
            .then((res) => setCredit(res.data));
    }, [supplierId]);

    if (!credit?.has_credit) return null;

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-blue-800">Limit Kredit Tersedia</p>
            <p className="text-blue-700">
                Rp {Number(credit.available_amount).toLocaleString("id-ID")}{" "}
                dari Rp {Number(credit.limit_amount).toLocaleString("id-ID")} ·
                Tempo {credit.term_days} hari
            </p>
        </div>
    );
}
