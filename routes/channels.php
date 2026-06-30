<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Chat;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Hanya UMKM atau Supplier yang terlibat dalam sebuah chat yang boleh
| subscribe ke channel chat tersebut.
|
*/

Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    $chat = Chat::find($chatId);

    if (! $chat) {
        return false;
    }

    if ($user->isRole('umkm')) {
        return $user->umkmProfile && $chat->umkm_id === $user->umkmProfile->id;
    }

    if ($user->isRole('supplier')) {
        return $user->supplierProfile && $chat->supplier_id === $user->supplierProfile->id;
    }

    return false;
});