<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        $productId = $this->route('id') ?? $this->route('product');

        return [
            'name' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'string', 'max:255'],
            'sku' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->ignore($productId),
            ],
            'description' => ['nullable', 'string'],
            'price' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'numeric', 'min:0'],
            'stock_quantity' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'integer', 'min:0'],
            'status' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'in:active,inactive,archived'],
            'image' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Product name is required.',
            'price.required' => 'Product price is required.',
            'price.min' => 'Price must be greater than or equal to 0.',
            'stock_quantity.required' => 'Stock quantity is required.',
            'sku.unique' => 'The product SKU has already been taken.',
        ];
    }
}
