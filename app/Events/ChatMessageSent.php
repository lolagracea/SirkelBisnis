<?php

namespace App\Events;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class ChatMessageSent implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public ChatMessage $message;

    public function __construct(ChatMessage $message)
    {
        // load relasi sender supaya frontend langsung dapat nama pengirim
        $this->message = $message->load('sender.user');
    }

    /**
     * Channel privat per percakapan: chat.{chatId}
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.'.$this->message->chat_id),
        ];
    }

    /**
     * Nama event yang akan diterima di frontend (Echo .listen('.chat.message', ...))
     */
    public function broadcastAs(): string
    {
        return 'chat.message';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => $this->message,
        ];
    }
}