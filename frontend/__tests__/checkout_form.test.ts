import * as z from 'zod';

const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  customer_email: z.string().email('Please enter a valid email address'),
  customer_phone: z
    .string()
    .regex(/^(\+8801|01)[3-9]\d{8}$/, 'Valid Bangladeshi phone number required'),
  delivery_address: z.string().min(6, 'Please provide full delivery address'),
  city: z.enum(['dhaka', 'outside_dhaka']),
  payment_gateway: z.enum(['bkash', 'sslcommerz', 'cod']),
});

describe('Checkout Form Validation Tests', () => {
  test('Valid Bangladeshi phone number passes validation', () => {
    const validData = {
      customer_name: 'Rahim Ahmed',
      customer_email: 'rahim@gmail.com',
      customer_phone: '01712345678',
      delivery_address: 'House 12, Road 4, Banani, Dhaka',
      city: 'dhaka' as const,
      payment_gateway: 'bkash' as const,
    };

    const result = checkoutSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('Invalid phone number fails validation', () => {
    const invalidData = {
      customer_name: 'Rahim Ahmed',
      customer_email: 'rahim@gmail.com',
      customer_phone: '0123456789', // Invalid operator code
      delivery_address: 'Dhaka',
      city: 'dhaka' as const,
      payment_gateway: 'bkash' as const,
    };

    const result = checkoutSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test('International format with +8801 passes validation', () => {
    const validData = {
      customer_name: 'Tanvir Hasan',
      customer_email: 'tanvir@gmail.com',
      customer_phone: '+8801812345678',
      delivery_address: 'GEC Circle, Chittagong',
      city: 'outside_dhaka' as const,
      payment_gateway: 'sslcommerz' as const,
    };

    const result = checkoutSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
