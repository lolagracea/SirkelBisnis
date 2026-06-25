<?php

namespace Database\Seeders;

use App\Models\GroupBuying;
use App\Models\GroupBuyingMember;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class GroupBuyingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create 15 UMKM Users with profiles
        $umkmUsers = [];
        for ($i = 1; $i <= 15; $i++) {
            $user = User::create([
                'name' => "UMKM Owner {$i}",
                'email' => "umkm{$i}@sirkelbisnis.com",
                'phone_number' => "089876543" . str_pad($i, 3, '0', STR_PAD_LEFT),
                'nik' => "3201234567890" . str_pad($i, 3, '0', STR_PAD_LEFT),
                'role' => 'umkm',
                'account_status' => 'active',
                'password' => Hash::make('password'),
            ]);

            // Assign Spatie role
            $user->assignRole('umkm');

            // Create UMKM Profile
            $user->umkmProfile()->create([
                'business_name' => "Bisnis UMKM {$i}",
                'business_type' => fake()->randomElement(['Kuliner', 'Konveksi', 'Kerajinan', 'Jasa']),
                'business_address' => fake()->address(),
                'district_city' => fake()->city(),
                'raw_material_category' => fake()->randomElement(['Bahan Makanan', 'Kain', 'Kayu', 'Kertas']),
                'monthly_need_estimate' => fake()->numberBetween(100, 1000),
            ]);

            $umkmUsers[] = $user;
        }

        // Get existing products
        $products = Product::all();
        if ($products->isEmpty()) {
            $products = collect([
                Product::factory()->create()
            ]);
        }

        // 2. Create 10 Group Buying records
        $groupBuyings = [];
        for ($i = 1; $i <= 10; $i++) {
            $creator = fake()->randomElement($umkmUsers);
            $product = $products->random();

            // Set some deadlines in the past for expired groups, or set cancelled status
            $isExpired = ($i === 9);
            $isCancelled = ($i === 10);
            
            $deadline = $isExpired 
                ? Carbon::today()->subDays(fake()->numberBetween(1, 10))
                : Carbon::today()->addDays(fake()->numberBetween(5, 30));

            $group = GroupBuying::create([
                'product_id' => $product->id,
                'creator_id' => $creator->id,
                'target_quantity' => fake()->numberBetween(300, 800),
                'current_quantity' => 0,
                'min_participants' => fake()->numberBetween(2, 5),
                'deadline' => $deadline,
                'status' => $isCancelled ? 'cancelled' : ($isExpired ? 'expired' : 'open'),
            ]);

            $groupBuyings[] = $group;
        }

        // 3. Seed exactly 50 Group Buying Members
        // Distribute member registrations randomly without double joining a group buying
        $joinedCount = 0;
        $maxAttempts = 1000;
        $attempts = 0;

        while ($joinedCount < 50 && $attempts < $maxAttempts) {
            $attempts++;
            $group = fake()->randomElement($groupBuyings);
            $user = fake()->randomElement($umkmUsers);

            // Business Rule check: A user cannot join the same group buying twice
            $alreadyJoined = GroupBuyingMember::where('group_buying_id', $group->id)
                ->where('user_id', $user->id)
                ->exists();

            if ($alreadyJoined) {
                continue;
            }

            // Cannot join cancelled or expired groups in normal seeding, but we populate them here
            $quantity = fake()->numberBetween(20, 60);
            $amount = $quantity * $group->product->price;

            GroupBuyingMember::create([
                'group_buying_id' => $group->id,
                'user_id' => $user->id,
                'quantity' => $quantity,
                'amount' => $amount,
                'status' => 'joined',
            ]);

            // Increment current quantity
            $group->current_quantity += $quantity;
            $group->save();

            $joinedCount++;
        }

        // 4. Update statuses based on quantities and deadlines
        foreach ($groupBuyings as $group) {
            if ($group->status === 'cancelled') {
                continue;
            }

            if ($group->current_quantity >= $group->target_quantity) {
                $group->status = 'completed';
            } elseif (Carbon::today()->gt($group->deadline)) {
                $group->status = 'expired';
            }
            $group->save();
        }
    }
}
