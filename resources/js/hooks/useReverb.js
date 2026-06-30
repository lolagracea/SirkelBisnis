import { useEffect, useRef, useCallback } from 'react';

/**
 * useReverb — Custom hook untuk subscribe ke Reverb/Pusher private channel.
 *
 * Menggunakan window.Echo yang di-setup di bootstrap.js.
 *
 * @param {string|null} channelName  - Nama channel tanpa prefix 'private-', misal: 'umkm.5'
 * @param {string}      eventName   - Nama event, misal: '.payment.paid' (dengan titik di depan untuk custom events)
 * @param {function}    callback    - Function yang dipanggil saat event diterima
 * @param {boolean}     [enabled]   - Aktifkan/nonaktifkan listener (default: true)
 *
 * @example
 * useReverb(`umkm.${user.id}`, '.payment.paid', (data) => {
 *   console.log('Pembayaran berhasil!', data);
 *   setInvoiceStatus('paid');
 * });
 */
const useReverb = (channelName, eventName, callback, enabled = true) => {
  const channelRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref saat callback berubah (tanpa trigger re-subscribe)
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const subscribe = useCallback(() => {
    // Pastikan window.Echo sudah tersedia (setup di bootstrap.js)
    if (!window.Echo || !channelName || !enabled) return;

    // Unsubscribe channel lama jika ada
    if (channelRef.current) {
      window.Echo.leave(channelRef.current._name || `private-${channelName}`);
      channelRef.current = null;
    }

    channelRef.current = window.Echo
      .private(channelName)
      .listen(eventName, (data) => {
        callbackRef.current(data);
      });

    return () => {
      if (channelRef.current) {
        window.Echo.leave(`private-${channelName}`);
        channelRef.current = null;
      }
    };
  }, [channelName, eventName, enabled]);

  useEffect(() => {
    const cleanup = subscribe();
    return () => {
      if (cleanup) cleanup();
    };
  }, [subscribe]);
};

export default useReverb;
