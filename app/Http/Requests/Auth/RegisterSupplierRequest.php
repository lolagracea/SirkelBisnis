<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'nik' => ['required', 'digits:16', 'unique:users,nik'],
            'phone_number' => ['required', 'regex:/^(\\+62|62|0)8[1-9][0-9]{6,10}$/', 'unique:users,phone_number'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            'store_name' => ['required', 'string', 'max:255'],
            'warehouse_address' => ['required', 'string', 'max:1000'],
            'product_category' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'minimum_order' => ['required', 'integer', 'min:1'],
            'delivery_area' => ['required', 'string', 'max:255'],
            'business_tax_number' => ['nullable', 'string', 'max:30'],
        ];
    }
}
