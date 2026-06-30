<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\GroupBuying;
use App\Models\SupplierOffer;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SupplierOfferController extends Controller
{
    /**
     * Submit a price offer for a Group Buying campaign.
     * Only accessible by supplier role.
     */
    public function store(Request $request, int $groupBuyingId): JsonResponse
    {
        try {
            $user = $request->user();

            if ($user->role !== 'supplier') {
                throw new AuthorizationException('Hanya supplier yang dapat mengajukan penawaran harga.');
            }

            $supplier = $user->profile;

            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil supplier tidak ditemukan.',
                    'data'    => null,
                ], 404);
            }

            $groupBuying = GroupBuying::with('product')->findOrFail($groupBuyingId);

            if ($groupBuying->status !== 'open') {
                return response()->json([
                    'success' => false,
                    'message' => 'Patungan ini sudah tidak menerima penawaran (status bukan open).',
                    'data'    => null,
                ], 422);
            }

            $validated = $request->validate([
                'price_per_unit' => ['required', 'numeric', 'min:1'],
                'notes'          => ['nullable', 'string', 'max:500'],
            ]);

            $totalPrice = $validated['price_per_unit'] * $groupBuying->target_quantity;

            // Update or create (idempotent — supplier dapat mengubah penawaran)
            $offer = SupplierOffer::updateOrCreate(
                [
                    'group_buying_id' => $groupBuyingId,
                    'supplier_id'     => $supplier->id,
                ],
                [
                    'price_per_unit' => $validated['price_per_unit'],
                    'total_price'    => $totalPrice,
                    'notes'          => $validated['notes'] ?? null,
                    'status'         => 'pending',
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Penawaran harga berhasil diajukan.',
                'data'    => [
                    'id'             => $offer->id,
                    'group_buying_id'=> $groupBuyingId,
                    'product_name'   => $groupBuying->product?->name,
                    'price_per_unit' => $offer->price_per_unit,
                    'total_price'    => $offer->total_price,
                    'status'         => $offer->status,
                    'submitted_at'   => $offer->created_at,
                ],
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data penawaran tidak valid.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (ModelNotFoundException) {
            return response()->json([
                'success' => false,
                'message' => 'Patungan tidak ditemukan.',
                'data'    => null,
            ], 404);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data'    => null,
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengajukan penawaran: ' . $e->getMessage(),
                'data'    => null,
            ], 500);
        }
    }

    /**
     * List all offers submitted by the authenticated supplier.
     */
    public function myOffers(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if ($user->role !== 'supplier') {
                throw new AuthorizationException('Hanya supplier yang dapat melihat penawaran mereka.');
            }

            $supplier = $user->profile;

            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil supplier tidak ditemukan.',
                    'data'    => [],
                ], 404);
            }

            $offers = SupplierOffer::with(['groupBuying.product'])
                ->where('supplier_id', $supplier->id)
                ->latest()
                ->paginate(10);

            $mapped = $offers->map(function ($offer) {
                return [
                    'id'             => $offer->id,
                    'group_buying_id'=> $offer->group_buying_id,
                    'product_name'   => $offer->groupBuying?->product?->name ?? '-',
                    'price_per_unit' => $offer->price_per_unit,
                    'total_price'    => $offer->total_price,
                    'status'         => $offer->status,
                    'notes'          => $offer->notes,
                    'submitted_at'   => $offer->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Daftar penawaran berhasil diambil.',
                'data'    => $mapped,
                'meta'    => [
                    'total'        => $offers->total(),
                    'current_page' => $offers->currentPage(),
                    'last_page'    => $offers->lastPage(),
                ],
            ]);

        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data'    => null,
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil daftar penawaran: ' . $e->getMessage(),
                'data'    => null,
            ], 500);
        }
    }
}
