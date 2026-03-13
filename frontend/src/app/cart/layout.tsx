import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Shopping Cart',
    description: 'Review your selected second-hand sleepwear items and proceed to checkout. Pay with MPesa, Stripe, PayPal, Visa or Mastercard.',
    robots: { index: false, follow: false },
    openGraph: {
        title: 'Your Cart | Slick Trends',
        description: 'Review your cart and checkout securely.',
        url: '/cart',
    },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
