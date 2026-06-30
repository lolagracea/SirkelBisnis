<?php

namespace App\Http\Controllers;
use App\Models\Subscription;

use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    // UMKM melihat semua langganannya
    public function umkmIndex(Request $request)
    {
        $subscriptions = Subscription::with(['supplier.user', 'product'])
            ->where('umkm_id', $request->user()->umkm_profile->id)
            ->get();

        return response()->json($subscriptions);
    }

    // UMKM mengubah qty/frekuensi/jadwal pengiriman berikutnya
    public function update(Request $request, $id)
    {
        $subscription = Subscription::where('umkm_id', $request->user()->umkm_profile->id)->findOrFail($id);

        $validated = $request->validate([
            'qty' => 'sometimes|integer|min:1',
            'frequency' => 'sometimes|in:weekly,biweekly,monthly',
            'next_delivery_date' => 'sometimes|date',
        ]);

        $subscription->update($validated);
        return response()->json($subscription);
    }

    // UMKM pause / resume / cancel langganan
    public function updateStatus(Request $request, $id)
    {
        $subscription = Subscription::where('umkm_id', $request->user()->umkm_profile->id)->findOrFail($id);

        $validated = $request->validate(['status' => 'required|in:active,paused,cancelled']);
        $subscription->update($validated);

        return response()->json($subscription);
    }
}
