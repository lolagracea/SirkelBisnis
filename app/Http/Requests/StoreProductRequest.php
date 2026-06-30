<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'supplier_id' => ['sometimes', 'required', 'integer', 'exists:supplier_profiles,id'],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'unit' => ['required', 'string', 'max:50'],
            'image' => ['nullable'],
            'variants' => ['nullable', 'array'],
            'variants.*.name' => ['required', 'string'],
            'variants.*.sku' => ['nullable', 'string'],
            'variants.*.price_adjustment' => ['nullable', 'numeric'],
            'variants.*.stock' => ['nullable', 'integer', 'min:0'],
            'tier_prices' => ['nullable', 'array'],
            'tier_prices.*.min_qty' => ['required', 'integer', 'min:1'],
            'tier_prices.*.max_qty' => ['nullable', 'integer', 'min:1'],
            'tier_prices.*.price' => ['required', 'numeric', 'min:0'],
        ];
    }
}
