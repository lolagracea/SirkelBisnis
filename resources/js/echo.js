import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

window.Pusher = Pusher;

// Endpoint otorisasi channel privat ada di root ("/broadcasting/auth"),
// BUKAN di bawah prefix "/api" seperti endpoint lain di project ini.
const authClient = axios.create({
  baseURL: window.location.origin,
  headers: { Accept: 'application/json' },
});

authClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sirkel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST === 'localhost' ? window.location.hostname : import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
  wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
  // Channel privat butuh otorisasi ke backend Laravel (routes/channels.php).
  // Project ini pakai Sanctum token-based auth (bukan cookie session), jadi
  // kita kirim Bearer token manual di sini.
  authorizer: (channel) => ({
    authorize: (socketId, callback) => {
      authClient
        .post('/broadcasting/auth', {
          socket_id: socketId,
          channel_name: channel.name,
        })
        .then((response) => {
          callback(false, response.data);
        })
        .catch((error) => {
          callback(true, error);
        });
    },
  }),
});

export default echo;