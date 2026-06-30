<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Private channels untuk payment notification real-time.
| Setiap channel divalidasi berdasarkan user_id yang sedang login.
|
*/

/**
 * Channel UMKM — menerima notifikasi status payment dari Xendit.
 * Format: private-umkm.{id}
 * Listener di React: Echo.private(`umkm.${user.id}`).listen('.payment.paid', ...)
 */
Broadcast::channel('umkm.{id}', function ($user, int $id) {
    // Izinkan akses hanya jika user yang request adalah user yang benar
    return (int) $user->id === $id;
});

/**
 * Channel Supplier — menerima update saldo wallet secara real-time.
 * Format: private-supplier.{id}
 * Listener di React: Echo.private(`supplier.${user.id}`).listen('.payment.paid', ...)
 */
Broadcast::channel('supplier.{id}', function ($user, int $id) {
    return (int) $user->id === $id;
});
