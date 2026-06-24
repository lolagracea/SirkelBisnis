<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'phone_number' => ['required', 'regex:/^(\\+62|62|0)8[1-9][0-9]{6,10}$/', 'unique:users,phone_number'],
            'admin_role' => ['required', 'string', 'max:100'],
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => ['string', Rule::in(['verify_users', 'monitoring', 'manage_disputes', 'manage_admins'])],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()->symbols()],
            'account_status' => ['required', Rule::in(['pending', 'active', 'suspended'])],
        ];
    }
}
