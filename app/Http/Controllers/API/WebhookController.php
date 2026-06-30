<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\WebhookEndpoint;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function index(Request $request)
    {
        $endpoints = WebhookEndpoint::where('supplier_id', $request->user()->supplier_profile->id)->get();
        return response()->json($endpoints);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'url' => 'required|url',
            'secret_key' => 'nullable|string'
        ]);

        $endpoint = WebhookEndpoint::create([
            'supplier_id' => $request->user()->supplier_profile->id,
            'url' => $validated['url'],
            'secret_key' => $validated['secret_key'] ?? null
        ]);

        return response()->json($endpoint, 201);
    }
}
