<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class ProductImportController extends Controller
{
    public function import(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user->isRole('supplier')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt'
        ]);

        $file = $request->file('file');
        $csvData = file_get_contents($file->getRealPath());
        $rows = array_map('str_getcsv', explode("\n", $csvData));
        $header = array_shift($rows);

        $imported = 0;
        $failed = 0;

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                if (count($row) !== count($header)) {
                    continue; // Skip invalid rows
                }
                
                $row = array_combine($header, $row);

                // Assuming header has: name, category, price, stock, unit, description
                if (isset($row['name']) && isset($row['price']) && isset($row['stock'])) {
                    Product::create([
                        'supplier_id' => $user->supplierProfile->id,
                        'name' => $row['name'],
                        'category' => $row['category'] ?? 'Uncategorized',
                        'price' => $row['price'],
                        'stock' => $row['stock'],
                        'unit' => $row['unit'] ?? 'pcs',
                        'description' => $row['description'] ?? '',
                    ]);
                    $imported++;
                } else {
                    $failed++;
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to import products: ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Import completed',
            'data' => [
                'imported' => $imported,
                'failed' => $failed
            ]
        ]);
    }
}
