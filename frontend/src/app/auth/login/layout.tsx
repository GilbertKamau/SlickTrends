import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sign In',
    description: 'Sign in to your Slick Trends account to track your orders, manage your cart, and access exclusive deals on second-hand sleepwear in Kenya.',
    robots: { index: false, follow: false },
    openGraph: {
        title: 'Sign In | Slick Trends',
        description: 'Access your Slick Trends account.',
        url: '/auth/login',
    },
    alternates: { canonical: '/auth/login' },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
