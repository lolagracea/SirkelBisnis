<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['sometimes', 'required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'required', 'integer', 'min:0'],
            'unit' => ['sometimes', 'required', 'string', 'max:50'],
            'image' => ['nullable'],
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'variants.*.name' => ['required_with:variants', 'string'],
            'variants.*.sku' => ['nullable', 'string'],
            'variants.*.price_adjustment' => ['nullable', 'numeric'],
            'variants.*.stock' => ['nullable', 'integer', 'min:0'],
            'tier_prices' => ['nullable', 'array'],
            'tier_prices.*.id' => ['nullable', 'integer', 'exists:product_tier_prices,id'],
            'tier_prices.*.min_qty' => ['required_with:tier_prices', 'integer', 'min:1'],
            'tier_prices.*.max_qty' => ['nullable', 'integer', 'min:1'],
            'tier_prices.*.price' => ['required_with:tier_prices', 'numeric', 'min:0'],
        ];
    }
}
