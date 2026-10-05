<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class InventoryAdjustmentRequest extends FormRequest
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
            'action' => ['nullable', 'string', 'in:ADD,REMOVE,add,remove'],
            'quantity' => ['required', 'integer', 'gt:0'],
            'reason' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * Custom error messages.
     */
    public function messages(): array
    {
        return [
            'quantity.required' => 'Adjustment quantity is required.',
            'quantity.gt' => 'Adjustment quantity must be greater than zero.',
            'reason.required' => 'A valid reason for this inventory adjustment is required.',
        ];
    }
}
