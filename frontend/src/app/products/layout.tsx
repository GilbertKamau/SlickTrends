import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Shop All Sleepwear',
    description: 'Browse our full collection of curated second-hand robes, onesies, pajamas, night dresses, baby onesies, pre-teen robes, and baby robes. Filter by category, size, condition and price. Pay with MPesa, Stripe or PayPal.',
    keywords: [
        'buy second hand robes Kenya', 'used pajamas Kenya', 'cheap onesies', 'baby onesies second hand',
        'night dresses Kenya', 'affordable sleepwear', 'pre-teen robes', 'thrift sleepwear Kenya',
    ],
    openGraph: {
        title: 'Shop All Sleepwear | Slick Trends',
        description: 'Curated second-hand sleepwear for the whole family. Find robes, onesies, pajamas and more.',
        url: '/products',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Shop All Sleepwear | Slick Trends',
        description: 'Curated second-hand sleepwear for the whole family.',
    },
    alternates: { canonical: '/products' },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
