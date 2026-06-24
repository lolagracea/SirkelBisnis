<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login - Sirkel Bisnis</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f7f9; color: #172026; }
        .page { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
        .panel { width: min(100%, 420px); background: #fff; border: 1px solid #dde3ea; border-radius: 8px; box-shadow: 0 16px 40px rgba(23, 32, 38, .08); padding: 28px; }
        h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.15; }
        p { margin: 0 0 24px; color: #65737f; }
        label { display: block; margin: 16px 0 6px; font-weight: 650; font-size: 14px; }
        input { width: 100%; border: 1px solid #cfd8e3; border-radius: 6px; padding: 12px 14px; font-size: 15px; background: #fff; }
        input:focus { outline: 3px solid #cde7d8; border-color: #21875b; }
        .error { margin-top: 6px; color: #b42318; font-size: 13px; }
        .alert { padding: 12px 14px; background: #fff1f0; border: 1px solid #ffcbc5; border-radius: 6px; color: #9f1d14; margin-bottom: 16px; }
        .alert-success { padding: 12px 14px; background: #edfcf2; border: 1px solid #c2f5d3; border-radius: 6px; color: #155724; margin-bottom: 16px; font-size: 14px; font-weight: 600; }
        .actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 22px; flex-wrap: wrap; }
        .button { border: 0; border-radius: 6px; background: #166447; color: #fff; padding: 12px 18px; font-weight: 750; cursor: pointer; }
        .link { color: #166447; font-weight: 700; text-decoration: none; }
        .check { display: flex; align-items: center; gap: 8px; margin-top: 14px; color: #42515c; }
        .check input { width: auto; }
    </style>
</head>
<body>
    <main class="page">
        <section class="panel">
            <h1>Masuk</h1>
            <p>Gunakan email admin atau nomor HP yang terdaftar.</p>

            @if (session('success'))
                <div class="alert-success">{{ session('success') }}</div>
                <script>
                    window.onload = function() {
                        alert("{{ session('success') }}");
                    };
                </script>
            @endif

            @if ($errors->any())
                <div class="alert">Periksa kembali data login kamu.</div>
            @endif

            <form method="POST" action="{{ route('login') }}">
                @csrf

                <label for="login">Email atau Nomor HP</label>
                <input id="login" name="login" value="{{ old('login') }}" autocomplete="username" required>
                @error('login') <div class="error">{{ $message }}</div> @enderror

                <label for="password">Password</label>
                <input id="password" type="password" name="password" autocomplete="current-password" required>
                @error('password') <div class="error">{{ $message }}</div> @enderror

                <label class="check">
                    <input type="checkbox" name="remember" value="1">
                    Ingat saya
                </label>

                <div class="actions">
                    <a class="link" href="{{ route('register.form') }}">Buat akun baru</a>
                    <button class="button" type="submit">Masuk</button>
                </div>
            </form>
        </section>
    </main>
</body>
</html>
