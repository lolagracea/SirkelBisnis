<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sirkel Bisnis</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f7f9; color: #172026; }
        .page { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
        .hero { width: min(100%, 760px); background: #fff; border: 1px solid #dde3ea; border-radius: 8px; padding: clamp(28px, 5vw, 56px); box-shadow: 0 16px 40px rgba(23, 32, 38, .08); }
        .brand { color: #166447; font-weight: 850; margin-bottom: 14px; }
        h1 { margin: 0; font-size: clamp(34px, 6vw, 60px); line-height: 1.02; letter-spacing: 0; }
        p { margin: 18px 0 0; color: #65737f; font-size: 18px; line-height: 1.65; max-width: 620px; }
        .actions { display: flex; gap: 12px; margin-top: 28px; flex-wrap: wrap; }
        a { text-decoration: none; border-radius: 6px; padding: 13px 18px; font-weight: 800; }
        .primary { background: #166447; color: #fff; }
        .secondary { color: #166447; border: 1px solid #b9c8d3; background: #fff; }
    </style>
</head>
<body>
    <main class="page">
        <section class="hero">
            <div class="brand">Sirkel Bisnis</div>
            <h1>Autentikasi Multi-Role untuk UMKM, Supplier, dan Admin.</h1>
            <p>Masuk ke akun kamu atau buat akun baru sesuai peran usaha. Sistem akan mengarahkan dashboard berdasarkan role yang dimiliki.</p>
            <div class="actions">
                <a class="primary" href="{{ route('register.form') }}">Daftar Sekarang</a>
                <a class="secondary" href="{{ route('login.form') }}">Masuk</a>
            </div>
        </section>
    </main>
</body>
</html>
