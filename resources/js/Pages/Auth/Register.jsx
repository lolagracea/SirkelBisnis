// resources/js/Pages/Auth/Register.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
    Sparkles,
    User,
    AlertTriangle,
    ArrowRight,
    ShieldCheck,
    MapPin,
    CheckCircle2,
    Search,
    Loader2,
} from "lucide-react";
import Select from "react-select";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Fix Leaflet icon Vite ──────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Shared styles ──────────────────────────────────────────────────────────
const inputCls =
    "w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A] transition-colors bg-white";
const labelCls =
    "block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5";
const selectStyles = {
    control: (base, state) => ({
        ...base,
        borderRadius: "0.75rem",
        borderColor: state.isFocused ? "#16A34A" : "#E2E8F0",
        boxShadow: "none",
        fontSize: "12px",
        padding: "0.1rem 0.2rem",
        "&:hover": { borderColor: "#16A34A" },
    }),
    menu: (base) => ({ ...base, fontSize: "12px", zIndex: 9999 }),
};

// ── Komponen: pindahkan view peta ke koordinat baru ───────────────────────
function MapFlyTo({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) map.flyTo(coords, 16, { duration: 1.2 });
    }, [coords, map]);
    return null;
}

// ── Geocoding via Nominatim (OpenStreetMap, gratis) ───────────────────────
function toTitleCase(str) {
    if (!str) return str;
    return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function cleanCityName(city) {
    if (!city) return city;
    // Hapus prefix KABUPATEN/KOTA agar Nominatim lebih mudah match
    return toTitleCase(city.replace(/^(KABUPATEN|KOTA)\s+/i, ""));
}

function expandStreetName(street) {
    if (!street) return street;
    return street
        .replace(/\bJl\.\s*/gi, "Jalan ")
        .replace(/\bJln\.\s*/gi, "Jalan ")
        .replace(/\bGg\.\s*/gi, "Gang ")
        .replace(/\bNo\.\s*/gi, "No. ")
        .trim();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nominatimSearch(q, delayMs = 0) {
    if (delayMs > 0) await sleep(delayMs);
    try {
        const url =
            `https://nominatim.openstreetmap.org/search?` +
            new URLSearchParams({ q, format: "json", limit: 1, countrycodes: "id" });

        const res = await fetch(url, {
            headers: { "Accept-Language": "id", "User-Agent": "SirkelBisnis/1.0" },
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
        }
    } catch {
        // network error
    }
    return null;
}

async function geocodeAddress(streetAddress, kelurahan, kecamatan, city, province) {
    const street         = expandStreetName(streetAddress);
    const cityClean      = cleanCityName(city);
    const kecamatanClean = toTitleCase(kecamatan);
    const kelurahanClean = toTitleCase(kelurahan);
    const provinceClean  = toTitleCase(province);

    const queries = [
        // Paling spesifik
        [street, kelurahanClean, kecamatanClean, cityClean, provinceClean, "Indonesia"],
        // Tanpa kelurahan
        [street, kecamatanClean, cityClean, provinceClean, "Indonesia"],
        // Hanya jalan + kota + provinsi
        [street, cityClean, provinceClean, "Indonesia"],
        // Hanya jalan + kota
        [street, cityClean, "Indonesia"],
    ];

    for (let i = 0; i < queries.length; i++) {
        const q = queries[i].filter(Boolean).join(", ");
        // delay 1.1 detik antar request agar tidak kena rate limit Nominatim
        const result = await nominatimSearch(q, i > 0 ? 1100 : 0);
        if (result) return result;
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
export default function Register() {
    const { registerUmkm, registerSupplier } = useAuth();
    const navigate = useNavigate();

    const [role, setRole] = useState("umkm");

    // ── Form state ────────────────────────────────────────────────────────
    const [formData, setFormData] = useState({
        // Shared
        name: "",
        nik: "",
        phone_number: "",
        password: "",
        password_confirmation: "",
        // UMKM
        business_name: "",
        business_type: "",
        province: "",
        district_city: "",
        kecamatan: "",
        kelurahan: "",
        street_address: "",
        raw_material_category: "",
        monthly_need_estimate: "",
        // Supplier
        supplier_name: "",
        address: "",
        description: "",
    });

    // ── Lokasi UMKM ───────────────────────────────────────────────────────
    const [umkmMarker, setUmkmMarker] = useState(null); // [lat, lng]
    const [supplierMarker, setSupplierMarker] = useState(null);
    const [geocoding, setGeocoding] = useState(false);
    const [geocodeError, setGeocodeError] = useState("");
    const [geocodeDisplay, setGeocodeDisplay] = useState(""); // nama lokasi hasil geocode

    // ── Reference data ────────────────────────────────────────────────────
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [kecamatans, setKecamatans] = useState([]);
    const [kelurahans, setKelurahans] = useState([]);
    const [businessTypes, setBusinessTypes] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingKecamatans, setLoadingKecamatans] = useState(false);
    const [loadingKelurahans, setLoadingKelurahans] = useState(false);
    const [loadingBusinessTypes, setLoadingBusinessTypes] = useState(false);
    // city_id yang sedang dipilih (untuk fetch kecamatan)
    const [selectedCityId, setSelectedCityId] = useState(null);
    const [selectedKecamatanId, setSelectedKecamatanId] = useState(null);

    // ── UI state ──────────────────────────────────────────────────────────
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    // Fetch provinsi & jenis usaha saat mount
    useEffect(() => {
        const fetchInit = async () => {
            setLoadingProvinces(true);
            setLoadingBusinessTypes(true);
            try {
                const [provRes, typesRes] = await Promise.all([
                    fetch("/api/provinsi"),
                    fetch("/api/jenis-usaha"),
                ]);
                if (provRes.ok) {
                    const d = await provRes.json();
                    if (Array.isArray(d.data)) {
                        setProvinces(d.data.map((p) => ({ value: p, label: toTitleCase(p) })));
                    }
                }
                if (typesRes.ok) {
                    const d = await typesRes.json();
                    if (Array.isArray(d.data)) {
                        setBusinessTypes(
                            d.data.map((b) => ({ value: b.name, label: b.name })),
                        );
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingProvinces(false);
                setLoadingBusinessTypes(false);
            }
        };
        fetchInit();
    }, []);

    // Fetch kota saat provinsi berubah
    useEffect(() => {
        if (!formData.province) {
            setCities([]);
            setKecamatans([]);
            setKelurahans([]);
            setSelectedCityId(null);
            setSelectedKecamatanId(null);
            return;
        }

        const fetchCities = async () => {
            setLoadingCities(true);
            setFormData((prev) => ({ ...prev, district_city: "", kecamatan: "", kelurahan: "" }));
            setKecamatans([]);
            setKelurahans([]);
            setSelectedCityId(null);
            setSelectedKecamatanId(null);
            try {
                const res = await fetch(
                    `/api/kota-kabupaten/provinsi?province=${encodeURIComponent(formData.province)}`,
                );
                if (res.ok) {
                    const d = await res.json();
                    // simpan id agar bisa fetch kecamatan
                    setCities(d.data.map((c) => ({ value: c.name, label: toTitleCase(c.name), id: c.id })));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingCities(false);
            }
        };
        fetchCities();
    }, [formData.province]);

    // Fetch kecamatan saat kota berubah
    useEffect(() => {
        if (!selectedCityId) {
            setKecamatans([]);
            setKelurahans([]);
            setSelectedKecamatanId(null);
            return;
        }

        const fetchKecamatan = async () => {
            setLoadingKecamatans(true);
            setFormData((prev) => ({ ...prev, kecamatan: "", kelurahan: "" }));
            setKelurahans([]);
            setSelectedKecamatanId(null);
            try {
                const res = await fetch(`/api/kecamatan?city_id=${selectedCityId}`);
                if (res.ok) {
                    const d = await res.json();
                    setKecamatans(d.data.map((k) => ({ value: k.name, label: toTitleCase(k.name), id: k.id })));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingKecamatans(false);
            }
        };
        fetchKecamatan();
    }, [selectedCityId]);

    // Fetch kelurahan saat kecamatan berubah
    useEffect(() => {
        if (!selectedKecamatanId) {
            setKelurahans([]);
            return;
        }

        const fetchKelurahan = async () => {
            setLoadingKelurahans(true);
            setFormData((prev) => ({ ...prev, kelurahan: "" }));
            try {
                const res = await fetch(`/api/kelurahan?kecamatan_id=${selectedKecamatanId}`);
                if (res.ok) {
                    const d = await res.json();
                    setKelurahans(d.data.map((k) => ({ value: k.name, label: toTitleCase(k.name) })));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingKelurahans(false);
            }
        };
        fetchKelurahan();
    }, [selectedKecamatanId]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Kalau user edit alamat jalan, reset marker supaya tidak stale
        if (name === "street_address") {
            setUmkmMarker(null);
            setGeocodeDisplay("");
            setGeocodeError("");
        }
    }, []);

    const handleSelectChange = useCallback(
        (field) => (opt) => {
            setFormData((prev) => ({ ...prev, [field]: opt ? opt.value : "" }));
            if (field === "district_city") {
                setSelectedCityId(opt ? opt.id : null);
            }
            if (field === "kecamatan") {
                setSelectedKecamatanId(opt ? opt.id : null);
            }
        },
        [],
    );

    // ── Geocoding: gabung semua field alamat → cari di peta ──────────────
    const handleCariDiPeta = async () => {
        if (!formData.street_address) {
            setGeocodeError("Isi alamat jalan terlebih dahulu.");
            return;
        }
        if (!formData.district_city && !formData.province) {
            setGeocodeError(
                "Pilih provinsi dan kota/kabupaten terlebih dahulu.",
            );
            return;
        }

        setGeocoding(true);
        setGeocodeError("");
        setGeocodeDisplay("");

        try {
            const result = await geocodeAddress(
                formData.street_address,
                formData.kelurahan,
                formData.kecamatan,
                formData.district_city,
                formData.province,
            );

            if (result) {
                setUmkmMarker([result.lat, result.lng]);
                setGeocodeDisplay(result.display);
            } else {
                setGeocodeError(
                    "Lokasi tidak ditemukan. Coba perjelas alamat jalan (contoh: Jl. Soekarno-Hatta No. 10).",
                );
            }
        } catch {
            setGeocodeError(
                "Gagal menghubungi layanan peta. Periksa koneksi internet Anda.",
            );
        } finally {
            setGeocoding(false);
        }
    };

    // ── Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.password_confirmation) {
            setError("Konfirmasi password tidak sesuai.");
            return;
        }
        if (role === "umkm" && !umkmMarker) {
            setError(
                "Silakan cari lokasi usaha Anda di peta sebelum mendaftar.",
            );
            return;
        }
        if (role === "supplier" && !supplierMarker) {
            setError(
                "Silakan tandai lokasi gudang/toko Anda di peta sebelum mendaftar.",
            );
            return;
        }

        setLoading(true);
        try {
            let response;

            if (role === "umkm") {
                const fullAddress = [
                    formData.street_address,
                    formData.kelurahan,
                    formData.kecamatan,
                    formData.district_city,
                    formData.province,
                    "Indonesia",
                ]
                    .filter(Boolean)
                    .join(", ");

                response = await registerUmkm({
                    name: formData.name,
                    nik: formData.nik,
                    phone_number: formData.phone_number,
                    password: formData.password,
                    password_confirmation: formData.password_confirmation,
                    business_name: formData.business_name,
                    business_type: formData.business_type,
                    province: formData.province,
                    district_city: formData.district_city,
                    kecamatan: formData.kecamatan,
                    kelurahan: formData.kelurahan,
                    street_address: formData.street_address,
                    business_address: fullAddress,
                    raw_material_category: formData.raw_material_category,
                    monthly_need_estimate: parseInt(formData.monthly_need_estimate) || 0,
                    latitude: umkmMarker[0],
                    longitude: umkmMarker[1],
                });
            } else {
                response = await registerSupplier({
                    name: formData.name,
                    nik: formData.nik,
                    phone_number: formData.phone_number,
                    password: formData.password,
                    password_confirmation: formData.password_confirmation,
                    supplier_name: formData.supplier_name,
                    address: formData.address,
                    description: formData.description,
                    latitude: supplierMarker[0],
                    longitude: supplierMarker[1],
                });
            }

            if (response.success) setIsSuccessModalOpen(true);
        } catch (err) {
            if (err.response?.data?.errors) {
                console.error('[422 errors]', err.response.data.errors);
                const firstError = Object.values(
                    err.response.data.errors,
                )[0][0];
                setError(firstError);
            } else {
                setError(
                    err.response?.data?.message ||
                        "Registrasi gagal. Cek kembali data Anda.",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-[#1E293B]">
            {/* ── Header ── */}
            <div className="sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="flex justify-center items-center gap-3 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#16A34A] to-[#22C55E] text-white shadow-lg shadow-green-200">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <span className="font-extrabold text-2xl tracking-tight text-[#0F172A]">
                        Sirkel<span className="text-[#16A34A]">Bisnis</span>
                    </span>
                </div>
                <h2 className="text-center text-3xl font-black text-[#0F172A] tracking-tight">
                    Buat Akun Baru
                </h2>
                <p className="mt-2 text-center text-sm text-[#64748B]">
                    Pilih tipe akun dan daftarkan usaha Anda sekarang
                </p>
            </div>

            {/* ── Card ── */}
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="bg-white py-8 px-4 border border-[#E2E8F0] shadow-xl shadow-slate-100 sm:rounded-3xl sm:px-10">
                    {/* Error banner */}
                    {error && (
                        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Role toggle */}
                    <div className="flex rounded-2xl bg-[#F1F5F9] p-1.5 mb-6">
                        {[
                            {
                                key: "umkm",
                                icon: <User className="h-4 w-4" />,
                                label: "Sebagai UMKM",
                            },
                            {
                                key: "supplier",
                                icon: <ShieldCheck className="h-4 w-4" />,
                                label: "Sebagai Supplier",
                            },
                        ].map(({ key, icon, label }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setRole(key);
                                    setError("");
                                }}
                                className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    role === key
                                        ? "bg-[#16A34A] text-white shadow-sm"
                                        : "text-[#64748B] hover:text-[#0F172A]"
                                }`}
                            >
                                {icon}
                                {label}
                            </button>
                        ))}
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* ── Seksi 1: Data Pengguna ── */}
                        <div className="border-b border-[#F1F5F9] pb-5">
                            <h3 className="font-extrabold text-xs text-[#64748B] uppercase tracking-wider mb-4">
                                Informasi Pengguna Utama
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>
                                        Nama Lengkap
                                    </label>
                                    <input
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={inputCls}
                                        placeholder="Nama lengkap"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>
                                        NIK (16 Digit)
                                    </label>
                                    <input
                                        name="nik"
                                        required
                                        maxLength="16"
                                        value={formData.nik}
                                        onChange={handleChange}
                                        className={inputCls}
                                        placeholder="3201..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelCls}>Nomor HP</label>
                                    <input
                                        name="phone_number"
                                        required
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        className={inputCls}
                                        placeholder="08123456789"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Password</label>
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={inputCls}
                                        placeholder="Min. 8 karakter"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>
                                        Konfirmasi Password
                                    </label>
                                    <input
                                        name="password_confirmation"
                                        type="password"
                                        required
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        className={inputCls}
                                        placeholder="Ketik ulang password"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Seksi 2: Profil Bisnis ── */}
                        {role === "umkm" ? (
                            <div className="space-y-4">
                                <h3 className="font-extrabold text-xs text-[#64748B] uppercase tracking-wider">
                                    Informasi Profil Bisnis UMKM
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>
                                            Nama Usaha
                                        </label>
                                        <input
                                            name="business_name"
                                            required
                                            value={formData.business_name}
                                            onChange={handleChange}
                                            className={inputCls}
                                            placeholder="Contoh: Kopi Tiam"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>
                                            Jenis Usaha
                                        </label>
                                        <Select
                                            options={businessTypes}
                                            isLoading={loadingBusinessTypes}
                                            placeholder="Pilih Jenis Usaha"
                                            value={
                                                businessTypes.find(
                                                    (o) =>
                                                        o.value ===
                                                        formData.business_type,
                                                ) || null
                                            }
                                            onChange={handleSelectChange(
                                                "business_type",
                                            )}
                                            styles={selectStyles}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>
                                            Kategori Bahan Baku
                                        </label>
                                        <input
                                            name="raw_material_category"
                                            required
                                            value={
                                                formData.raw_material_category
                                            }
                                            onChange={handleChange}
                                            className={inputCls}
                                            placeholder="Contoh: Tepung / Kain"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>
                                            Kebutuhan Bulanan (kg/pcs)
                                        </label>
                                        <input
                                            name="monthly_need_estimate"
                                            type="number"
                                            required
                                            value={
                                                formData.monthly_need_estimate
                                            }
                                            onChange={handleChange}
                                            className={inputCls}
                                            placeholder="Contoh: 150"
                                        />
                                    </div>
                                </div>

                                {/* ── Blok Alamat + Peta ── */}
                                <div className="rounded-2xl border border-[#E2E8F0] p-4 space-y-4 bg-[#FAFAFA]">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="h-4 w-4 text-[#16A34A]" />
                                        <span className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">
                                            Lokasi Usaha
                                        </span>
                                    </div>

                                    {/* Provinsi */}
                                    <div>
                                        <label className={labelCls}>
                                            Provinsi{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <Select
                                            options={provinces}
                                            isLoading={loadingProvinces}
                                            placeholder="Pilih Provinsi"
                                            value={
                                                provinces.find(
                                                    (o) =>
                                                        o.value ===
                                                        formData.province,
                                                ) || null
                                            }
                                            onChange={handleSelectChange(
                                                "province",
                                            )}
                                            styles={selectStyles}
                                        />
                                    </div>

                                    {/* Kab/Kota */}
                                    <div>
                                        <label className={labelCls}>
                                            Kabupaten / Kota{" "}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                            options={cities}
                                            isLoading={loadingCities}
                                            isDisabled={!formData.province}
                                            placeholder={formData.province ? "Pilih Kab/Kota" : "Pilih provinsi dahulu"}
                                            value={cities.find((o) => o.value === formData.district_city) || null}
                                            onChange={handleSelectChange("district_city")}
                                            styles={selectStyles}
                                        />
                                    </div>

                                    {/* Kecamatan */}
                                    <div>
                                        <label className={labelCls}>
                                            Kecamatan{" "}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                            options={kecamatans}
                                            isLoading={loadingKecamatans}
                                            isDisabled={!formData.district_city}
                                            placeholder={formData.district_city ? "Pilih Kecamatan" : "Pilih kab/kota dahulu"}
                                            value={kecamatans.find((o) => o.value === formData.kecamatan) || null}
                                            onChange={handleSelectChange("kecamatan")}
                                            styles={selectStyles}
                                        />
                                    </div>

                                    {/* Kelurahan / Desa */}
                                    <div>
                                        <label className={labelCls}>
                                            Kelurahan / Desa{" "}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                            options={kelurahans}
                                            isLoading={loadingKelurahans}
                                            isDisabled={!formData.kecamatan}
                                            placeholder={formData.kecamatan ? "Pilih Kelurahan/Desa" : "Pilih kecamatan dahulu"}
                                            value={kelurahans.find((o) => o.value === formData.kelurahan) || null}
                                            onChange={handleSelectChange("kelurahan")}
                                            styles={selectStyles}
                                        />
                                    </div>

                                    {/* Alamat Jalan */}
                                    <div>
                                        <label className={labelCls}>
                                            Alamat Jalan{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                name="street_address"
                                                required
                                                value={formData.street_address}
                                                onChange={handleChange}
                                                className={`${inputCls} flex-1`}
                                                placeholder="Contoh: Jl. Soekarno-Hatta No. 10"
                                            />
                                            {/* Tombol geocoding */}
                                            <button
                                                type="button"
                                                onClick={handleCariDiPeta}
                                                disabled={
                                                    geocoding ||
                                                    !formData.street_address
                                                }
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#15803D] transition-colors shrink-0"
                                            >
                                                {geocoding ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Search className="h-3.5 w-3.5" />
                                                )}
                                                {geocoding
                                                    ? "Mencari..."
                                                    : "Cari di Peta"}
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-[#6B7280] mt-1">
                                            Tulis alamat jalan lalu klik{" "}
                                            <strong>Cari di Peta</strong> untuk
                                            menampilkan lokasi secara otomatis.
                                        </p>
                                    </div>

                                    {/* Pesan error geocoding */}
                                    {geocodeError && (
                                        <div className="flex items-start gap-2 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                            {geocodeError}
                                        </div>
                                    )}

                                    {/* Peta */}
                                    <div className="rounded-xl overflow-hidden border border-[#E2E8F0]">
                                        <MapContainer
                                            center={[-2.5, 118]} // Default: tengah Indonesia
                                            zoom={5}
                                            style={{
                                                height: "260px",
                                                width: "100%",
                                            }}
                                            scrollWheelZoom={false}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            {/* Fly ke koordinat hasil geocoding */}
                                            {umkmMarker && (
                                                <MapFlyTo coords={umkmMarker} />
                                            )}
                                            {umkmMarker && (
                                                <Marker position={umkmMarker} />
                                            )}
                                        </MapContainer>
                                    </div>

                                    {/* Status lokasi */}
                                    {umkmMarker ? (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-semibold">
                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                                Lokasi berhasil ditemukan
                                            </div>
                                            {geocodeDisplay && (
                                                <p className="text-[11px] text-[#6B7280] leading-relaxed pl-5">
                                                    {geocodeDisplay}
                                                </p>
                                            )}
                                            <p className="text-[11px] text-[#9CA3AF] pl-5">
                                                Koordinat:{" "}
                                                {umkmMarker[0].toFixed(6)},{" "}
                                                {umkmMarker[1].toFixed(6)}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
                                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                                            Belum ada lokasi — isi alamat lalu
                                            klik Cari di Peta.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* ── Seksi Supplier (tidak berubah dari sebelumnya) ── */
                            <div className="space-y-4">
                                <h3 className="font-extrabold text-xs text-[#64748B] uppercase tracking-wider">
                                    Informasi Profil Supplier
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className={labelCls}>
                                            Nama Supplier / Perusahaan
                                        </label>
                                        <input
                                            name="supplier_name"
                                            required
                                            value={formData.supplier_name}
                                            onChange={handleChange}
                                            className={inputCls}
                                            placeholder="Contoh: CV Tani Makmur"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelCls}>
                                            Alamat Lengkap Gudang / Toko
                                        </label>
                                        <input
                                            name="address"
                                            required
                                            value={formData.address}
                                            onChange={handleChange}
                                            className={inputCls}
                                            placeholder="Alamat pergudangan/kantor..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelCls}>
                                            Deskripsi Supplier
                                        </label>
                                        <textarea
                                            name="description"
                                            rows="2"
                                            value={formData.description}
                                            onChange={handleChange}
                                            className={`${inputCls} resize-none`}
                                            placeholder="Menyediakan bahan pangan berkualitas..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-2xl shadow-lg shadow-green-100 text-sm font-bold text-white bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803D] hover:to-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] transition-all"
                        >
                            {loading
                                ? "Mendaftarkan..."
                                : "Daftar Akun Sekarang"}
                            {!loading && <ArrowRight className="h-4 w-4" />}
                        </button>
                    </form>

                    <div className="mt-6 border-t border-[#F1F5F9] pt-6 text-center">
                        <p className="text-xs text-[#64748B] font-semibold">
                            Sudah memiliki akun?{" "}
                            <Link
                                to="/login"
                                className="text-[#16A34A] hover:underline font-bold"
                            >
                                Masuk di sini
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Success Modal ── */}
            {isSuccessModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-2xl text-center space-y-5 mx-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <ShieldCheck className="h-10 w-10 animate-bounce" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-black text-xl text-[#0F172A]">
                                Registrasi Berhasil!
                            </h3>
                            <p className="text-xs text-[#64748B] leading-relaxed">
                                Akun Anda telah berhasil terdaftar. Silakan
                                masuk menggunakan nomor HP dan kata sandi yang
                                telah Anda daftarkan.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/login")}
                            className="w-full py-3.5 px-4 rounded-2xl shadow-lg shadow-green-100 text-xs font-bold text-white bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803D] hover:to-[#16A34A] transition-all"
                        >
                            Masuk Sekarang
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
