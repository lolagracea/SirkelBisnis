<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $subscriptions = Subscription::with(['umkm.user', 'product'])
            ->where('supplier_id', $request->user()->supplier_profile->id)
            ->get();
        return response()->json($subscriptions);
    }

    public function store(Request $request)
    {
        // UMKM creates a subscription
        $validated = $request->validate([
            'supplier_id' => 'required|exists:supplier_profiles,id',
            'product_id' => 'required|exists:products,id',
            'qty' => 'required|integer',
            'frequency' => 'required|in:weekly,biweekly,monthly',
            'next_delivery_date' => 'required|date'
        ]);

        $subscription = Subscription::create([
            'umkm_id' => $request->user()->umkm_profile->id,
            'supplier_id' => $validated['supplier_id'],
            'product_id' => $validated['product_id'],
            'qty' => $validated['qty'],
            'frequency' => $validated['frequency'],
            'next_delivery_date' => $validated['next_delivery_date']
        ]);

        return response()->json($subscription, 201);
    }
}
