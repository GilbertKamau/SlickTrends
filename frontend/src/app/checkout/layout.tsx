import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Checkout',
    description: 'Complete your purchase securely. Pay with M-Pesa, Stripe, PayPal, Visa or Mastercard.',
    robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
