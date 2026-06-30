<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable([
    'chat_id',
    'sender_type',
    'sender_id',
    'message',
    'is_read',
])]
class ChatMessage extends Model
{
    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    public function sender(): MorphTo
    {
        return $this->morphTo();
    }
}
