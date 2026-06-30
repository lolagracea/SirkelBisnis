<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierCRMController extends Controller
{
    public function getCustomers(Request $request): JsonResponse
    {
        $profile = $request->user()->supplierProfile;
        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Not a supplier'], 403);
        }

        // Get all unique buyers who ordered from this supplier
        $buyerIds = Order::where('supplier_id', $profile->id)
            ->distinct()
            ->pluck('buyer_id');

        $customers = User::whereIn('id', $buyerIds)->get();

        return response()->json(['success' => true, 'data' => $customers]);
    }

    public function broadcast(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string',
            'customer_ids' => 'required|array',
            'customer_ids.*' => 'exists:users,id'
        ]);

        $profile = $request->user()->supplierProfile;
        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Not a supplier'], 403);
        }

        $messageText = $request->input('message');
        $customerIds = $request->input('customer_ids');
        $senderId = clone $request->user();

        // Very basic broadcast: loop through customers, create or find chat, and send message
        try {
            DB::beginTransaction();

            foreach ($customerIds as $customerId) {
                // Find existing chat or create one
                $chatId = DB::table('chats')
                    ->where('umkm_id', $customerId)
                    ->where('supplier_id', $profile->id)
                    ->value('id');

                if (!$chatId) {
                    $chatId = DB::table('chats')->insertGetId([
                        'umkm_id' => $customerId,
                        'supplier_id' => $profile->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table('chat_messages')->insert([
                    'chat_id' => $chatId,
                    'sender_type' => User::class,
                    'sender_id' => $senderId->id,
                    'message' => $messageText,
                    'is_read' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Broadcast sent successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to broadcast: ' . $e->getMessage()], 500);
        }
    }
}
