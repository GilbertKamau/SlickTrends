import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

// Initialize Redis asynchronously
export const initRedis = async () => {
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
        console.warn('⚠️  Redis credentials missing, running without cache');
        return;
    }

    try {
        // You can use the URL we placed in .env, OR use the object structure
        redisClient = createClient({
            url: process.env.REDIS_URL, // e.g. redis://default:7RDm80E6ok6q25X2HWIeODyimvUjvBIx@redis-13340.crce199.us-west-2-2.ec2.cloud.redislabs.com:13340
            socket: {
                connectTimeout: 5000
            }
        });

        redisClient.on('error', (err: Error) => {
            console.warn('⚠️  Redis connection error (caching disabled):', err.message);
            redisClient = null;
        });

        await redisClient.connect();
        console.log('🔴 Redis Labs cloud connected successfully');
    } catch (err) {
        console.warn('⚠️  Redis unavailable, running without cache');
        redisClient = null;
    }
};

export function getRedis(): RedisClientType | null {
    if (redisClient && redisClient.isReady) {
        return redisClient;
    }
    return null;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        const r = getRedis();
        if (!r) return null;
        const data = await r.get(key);
        return data ? JSON.parse(data) : null;
    } catch { return null; }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    try {
        const r = getRedis();
        if (!r) return;
        await r.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch { /* silent fail */ }
}

export async function cacheDel(...keys: string[]): Promise<void> {
    try {
        const r = getRedis();
        if (!r) return;
        const pattern = keys.filter(k => k.includes('*'));
        const exact = keys.filter(k => !k.includes('*'));

        if (exact.length) {
            await r.del(exact);
        }
        for (const pat of pattern) {
            const found = await r.keys(pat);
            if (found.length) await r.del(found);
        }
    } catch { /* silent fail */ }
}

export async function cacheFlushPattern(pattern: string): Promise<void> {
    try {
        const r = getRedis();
        if (!r) return;
        const keys = await r.keys(pattern);
        if (keys.length) await r.del(keys);
    } catch { /* silent fail */ }
}

export default getRedis;
