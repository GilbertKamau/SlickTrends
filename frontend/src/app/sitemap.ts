import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://slicktrends.com';
    const now = new Date();

    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
        { url: `${baseUrl}/products`, lastModified: now, changeFrequency: 'hourly', priority: 0.95 },
        { url: `${baseUrl}/auth/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
        { url: `${baseUrl}/auth/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    ];

    const categoryPages: MetadataRoute.Sitemap = [
        'robes', 'onesies', 'pajamas', 'night-dresses',
        'baby-onesies', 'pre-teen-robes', 'baby-robes',
    ].map((cat) => ({
        url: `${baseUrl}/products?category=${cat}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.85,
    }));

    return [...staticPages, ...categoryPages];
}
