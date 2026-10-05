<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_status' => ['required', 'string', 'in:pending,processing,shipped,delivered,cancelled'],
            'payment_status' => ['nullable', 'string', 'in:pending,paid,failed,cancelled,refunded'],
        ];
    }

    public function messages(): array
    {
        return [
            'order_status.required' => 'The order status is required.',
            'order_status.in' => 'Invalid order status selected.',
            'payment_status.in' => 'Invalid payment status selected.',
        ];
    }
}
