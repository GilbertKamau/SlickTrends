import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";


const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://slicktrends.com';
const SITE_NAME = 'Slick Trends';
const DEFAULT_TITLE = 'Slick Trends — Premium Second-Hand Sleepwear';
const DEFAULT_DESCRIPTION =
  'Shop curated second-hand robes, onesies, pajamas, night dresses, baby onesies and pre-teen robes at Slick Trends. Sustainable luxury sleepwear at affordable prices. Pay with MPesa, Stripe, PayPal or Card.';

export const viewport: Viewport = {
  themeColor: '#1a0533',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'second hand robes', 'second hand pajamas', 'used onesies', 'night dresses Kenya',
    'baby onesies second hand', 'pre-teen robes', 'baby robes', 'affordable sleepwear',
    'sustainable sleepwear Kenya', 'MPesa clothing', 'Slick Trends', 'second hand kids sleepwear',
    'cheap robes online', 'night wear Kenya', 'thrift sleepwear',
  ],
  authors: [{ name: 'Slick Trends', url: SITE_URL }],
  creator: 'Slick Trends',
  publisher: 'Slick Trends',
  category: 'E-commerce, Clothing, Sleepwear',
  applicationName: SITE_NAME,
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Slick Trends — Premium Second-Hand Sleepwear',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@slicktrends',
    creator: '@slicktrends',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  verification: {
    google: 'your-google-site-verification-token',
  },
};

// JSON-LD Organisation structured data
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: DEFAULT_DESCRIPTION,
  foundingDate: '2024',
  areaServed: 'KE',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'support@slicktrends.com',
    availableLanguage: 'English',
  },
  sameAs: [
    'https://twitter.com/slicktrends',
    'https://www.instagram.com/slicktrends',
    'https://www.facebook.com/slicktrends',
  ],
};

// JSON-LD Website structured data
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/products?search={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(20, 0, 40, 0.95)',
              color: '#f5f0ff',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              backdropFilter: 'blur(10px)',
            },
          }}
        />
      </body>
    </html>
  );
}
