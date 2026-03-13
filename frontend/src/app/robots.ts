import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://slicktrends.com';
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/products', '/products/*', '/auth/login', '/auth/register', '/cart', '/checkout'],
                disallow: ['/admin', '/admin/*', '/superadmin', '/superadmin/*', '/api/*'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    };
}
