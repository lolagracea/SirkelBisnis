<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Chat;
use App\Models\UmkmProfile;
use App\Models\SupplierProfile;

class ChatController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth()->user();
        if ($user->isRole('umkm')) {
            $chats = Chat::with(['supplier.user', 'messages' => function($q) {
                $q->latest()->limit(1);
            }])->where('umkm_id', $user->umkmProfile->id)->get();
        } else if ($user->isRole('supplier')) {
            $chats = Chat::with(['umkm.user', 'messages' => function($q) {
                $q->latest()->limit(1);
            }])->where('supplier_id', $user->supplierProfile->id)->get();
        } else {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $chats
        ]);
    }

    public function show($id): JsonResponse
    {
        $chat = Chat::with(['messages' => function($q) {
            $q->orderBy('created_at', 'asc');
        }, 'umkm.user', 'supplier.user'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $chat
        ]);
    }

    public function startChat(Request $request): JsonResponse
    {
        $request->validate([
            'supplier_id' => 'required|exists:supplier_profiles,id'
        ]);
        
        $user = auth()->user();
        if (!$user->isRole('umkm')) {
            return response()->json(['success' => false, 'message' => 'Only UMKM can start chats.'], 403);
        }

        $chat = Chat::firstOrCreate([
            'umkm_id' => $user->umkmProfile->id,
            'supplier_id' => $request->supplier_id
        ]);

        return response()->json([
            'success' => true,
            'data' => $chat
        ]);
    }

    public function sendMessage(Request $request, $id): JsonResponse
    {
        $request->validate([
            'message' => 'required|string'
        ]);

        $chat = Chat::findOrFail($id);
        $user = auth()->user();

        // Determine sender type based on role
        if ($user->isRole('umkm')) {
            $senderType = UmkmProfile::class;
            $senderId = $user->umkmProfile->id;
        } else if ($user->isRole('supplier')) {
            $senderType = SupplierProfile::class;
            $senderId = $user->supplierProfile->id;
        } else {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $message = $chat->messages()->create([
            'sender_type' => $senderType,
            'sender_id' => $senderId,
            'message' => $request->message
        ]);

        return response()->json([
            'success' => true,
            'data' => $message
        ]);
    }
}
