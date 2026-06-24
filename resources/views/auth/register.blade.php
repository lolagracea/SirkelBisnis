<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Register - Sirkel Bisnis</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f7f9; color: #172026; }
        .page { min-height: 100vh; padding: 28px 18px; }
        .wrap { width: min(100%, 960px); margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
        h1 { margin: 0 0 6px; font-size: clamp(28px, 4vw, 40px); line-height: 1.1; }
        p { margin: 0; color: #65737f; }
        .link { color: #166447; font-weight: 750; text-decoration: none; }
        .panel { background: #fff; border: 1px solid #dde3ea; border-radius: 8px; box-shadow: 0 16px 40px rgba(23, 32, 38, .08); overflow: hidden; }
        .tabs { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #dde3ea; }
        .tab { padding: 16px; border: 0; background: #f8fafb; cursor: pointer; font-weight: 800; color: #42515c; }
        .tab.active { background: #fff; color: #166447; box-shadow: inset 0 -3px #166447; }
        form { padding: 22px; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .full { grid-column: 1 / -1; }
        label { display: block; margin-bottom: 6px; font-weight: 650; font-size: 14px; }
        input, textarea { width: 100%; border: 1px solid #cfd8e3; border-radius: 6px; padding: 12px 14px; font-size: 15px; background: #fff; }
        textarea { min-height: 96px; }
        input:focus, textarea:focus { outline: 3px solid #cde7d8; border-color: #21875b; }
        .error { margin-top: 6px; color: #b42318; font-size: 13px; }
        .alert { padding: 12px 14px; background: #fff1f0; border: 1px solid #ffcbc5; border-radius: 6px; color: #9f1d14; margin-bottom: 16px; }
        .button { margin-top: 18px; border: 0; border-radius: 6px; background: #166447; color: #fff; padding: 13px 18px; font-weight: 800; cursor: pointer; width: 100%; }
        .hidden { display: none; }
        @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } form { padding: 18px; } }
    </style>
</head>
<body>
    @php($active = old('account_type', str_contains(url()->previous(), 'supplier') ? 'supplier' : 'umkm'))

    <main class="page">
        <div class="wrap">
            <header class="header">
                <div>
                    <h1>Daftar Akun</h1>
                    <p>Pilih peran sesuai kebutuhan usaha kamu.</p>
                </div>
                <a class="link" href="{{ route('login.form') }}">Sudah punya akun?</a>
            </header>

            <section class="panel">
                <div class="tabs">
                    <button class="tab {{ $active === 'umkm' ? 'active' : '' }}" type="button" data-tab="umkm">Daftar sebagai UMKM</button>
                    <button class="tab {{ $active === 'supplier' ? 'active' : '' }}" type="button" data-tab="supplier">Daftar sebagai Supplier</button>
                </div>

                @if ($errors->any())
                    <div style="padding: 18px 22px 0;">
                        <div class="alert">Ada data yang belum valid. Periksa field yang ditandai.</div>
                    </div>
                @endif

                <form id="umkm-form" class="{{ $active === 'umkm' ? '' : 'hidden' }}" method="POST" action="{{ route('register.umkm') }}">
                    @csrf
                    <input type="hidden" name="account_type" value="umkm">
                    <div class="grid">
                        <div><label>Nama</label><input name="name" value="{{ old('account_type', 'umkm') === 'umkm' ? old('name') : '' }}" required>@error('name')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>NIK</label><input name="nik" value="{{ old('account_type', 'umkm') === 'umkm' ? old('nik') : '' }}" maxlength="16" required>@error('nik')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>No HP</label><input name="phone_number" value="{{ old('account_type', 'umkm') === 'umkm' ? old('phone_number') : '' }}" required>@error('phone_number')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>Nama Usaha</label><input name="business_name" value="{{ old('business_name') }}" required>@error('business_name')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>Jenis Usaha</label><input name="business_type" value="{{ old('business_type') }}" required>@error('business_type')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>Kecamatan/Kota</label><input name="district_city" value="{{ old('district_city') }}" required>@error('district_city')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>Kategori Bahan Baku</label><input name="raw_material_category" value="{{ old('raw_material_category') }}" required>@error('raw_material_category')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>Estimasi Kebutuhan Bulanan</label><input type="number" min="1" name="monthly_need_estimate" value="{{ old('monthly_need_estimate') }}" required>@error('monthly_need_estimate')<div class="error">{{ $message }}</div>@enderror</div>
                        <div class="full"><label>Alamat Usaha</label><textarea name="business_address" required>{{ old('business_address') }}</textarea>@error('business_address')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>Password</label><input type="password" name="password" required>@error('password')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>Konfirmasi Password</label><input type="password" name="password_confirmation" required></div>
                    </div>
                    <button class="button" type="submit">Daftar UMKM</button>
                </form>

                <form id="supplier-form" class="{{ $active === 'supplier' ? '' : 'hidden' }}" method="POST" action="{{ route('register.supplier') }}">
                    @csrf
                    <input type="hidden" name="account_type" value="supplier">
                    <div class="grid">
                        <div><label>Nama PJ</label><input name="name" value="{{ old('account_type') === 'supplier' ? old('name') : '' }}" required>@error('name')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>NIK</label><input name="nik" value="{{ old('account_type') === 'supplier' ? old('nik') : '' }}" maxlength="16" required>@error('nik')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>No HP</label><input name="phone_number" value="{{ old('account_type') === 'supplier' ? old('phone_number') : '' }}" required>@error('phone_number')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>Nama Supplier/Usaha</label><input name="supplier_name" value="{{ old('supplier_name') }}" required>@error('supplier_name')<div class="error">{{ $message }}</div>@enderror</div>
                        <div class="full"><label>Alamat Supplier/Gudang</label><textarea name="address" required>{{ old('address') }}</textarea>@error('address')<div class="error">{{ $message }}</div>@enderror</div>
                        <div class="full"><label>Deskripsi</label><textarea name="description">{{ old('description') }}</textarea>@error('description')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>Latitude (Opsional)</label><input type="number" step="any" name="latitude" value="{{ old('latitude') }}">@error('latitude')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>Longitude (Opsional)</label><input type="number" step="any" name="longitude" value="{{ old('longitude') }}">@error('longitude')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>Password</label><input type="password" name="password" required>@error('password')<div class="error">{{ $message }}</div>@enderror</div>
                        <div><label>Konfirmasi Password</label><input type="password" name="password_confirmation" required></div>
                    </div>
                    <button class="button" type="submit">Daftar Supplier</button>
                </form>
            </section>
        </div>
    </main>

    <script>
        const tabs = document.querySelectorAll('[data-tab]');
        const forms = {
            umkm: document.getElementById('umkm-form'),
            supplier: document.getElementById('supplier-form'),
        };

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                tabs.forEach((item) => item.classList.toggle('active', item === tab));
                Object.entries(forms).forEach(([key, form]) => form.classList.toggle('hidden', key !== target));
            });
        });
    </script>
</body>
</html>
