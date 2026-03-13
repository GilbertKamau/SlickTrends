import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create Account',
    description: 'Join Slick Trends for free — discover sustainable second-hand sleepwear including robes, onesies, pajamas and more. Pay with MPesa, Stripe or PayPal.',
    openGraph: {
        title: 'Create a Free Account | Slick Trends',
        description: 'Join thousands of eco-conscious shoppers on Slick Trends.',
        url: '/auth/register',
    },
    alternates: { canonical: '/auth/register' },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
