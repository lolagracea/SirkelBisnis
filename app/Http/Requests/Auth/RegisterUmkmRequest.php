<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterUmkmRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'                  => ['required', 'string', 'max:255'],
            'nik'                   => ['required', 'digits:16', 'unique:users,nik'],
            'phone_number'          => ['required', 'regex:/^(\+62|62|0)8[1-9][0-9]{6,10}$/', 'unique:users,phone_number'],
            'password'              => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            'business_name'         => ['required', 'string', 'max:255'],
            'business_type'         => ['required', 'string', 'max:255'],
            'province'              => ['required', 'string', 'max:255'],
            'district_city'         => ['required', 'string', 'max:255'],
            'kecamatan'             => ['required', 'string', 'max:255'],
            'kelurahan'             => ['required', 'string', 'max:255'],
            'street_address'        => ['required', 'string', 'max:1000'],
            'business_address'      => ['required', 'string', 'max:2000'],  // alamat gabungan lengkap
            'raw_material_category' => ['required', 'string', 'max:255'],
            'monthly_need_estimate' => ['required', 'integer', 'min:1'],
            'latitude'              => ['required', 'numeric', 'between:-90,90'],
            'longitude'             => ['required', 'numeric', 'between:-180,180'],
        ];
    }

    public function messages(): array
    {
        return [
            'latitude.required'  => 'Silakan cari dan tandai lokasi usaha Anda di peta.',
            'longitude.required' => 'Silakan cari dan tandai lokasi usaha Anda di peta.',
            'province.required'   => 'Provinsi wajib dipilih.',
            'kecamatan.required'  => 'Kecamatan wajib dipilih.',
            'kelurahan.required'  => 'Kelurahan wajib dipilih.',
        ];
    }
}
