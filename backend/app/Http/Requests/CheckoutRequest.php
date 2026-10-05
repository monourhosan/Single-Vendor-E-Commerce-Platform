<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'regex:/^(\+8801|01)[3-9]\d{8}$/'],
            'delivery_address' => ['required', 'string', 'min:5'],
            'city' => ['nullable', 'string'],
            'payment_gateway' => ['required', 'in:bkash,sslcommerz,cod'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'defer_payment' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_phone.regex' => 'Please provide a valid Bangladeshi phone number (e.g., 017XXXXXXXX).',
            'items.required' => 'Your cart is empty. Please add items before checking out.',
            'payment_gateway.in' => 'Selected payment gateway must be bkash, sslcommerz, or cod.',
        ];
    }
}
