import cron from 'node-cron';
import { query } from '../config/db.postgres';

/**
 * Initializes a cron job that runs daily at midnight to delete products 
 * that have been marked as sold for more than 7 days.
 */
export const initProductCleanupJob = () => {
    // Run every day at 00:00 (midnight)
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cleanup Job] Searching for items sold more than a week ago...');
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        try {
            const result = await query('DELETE FROM products WHERE is_sold = true AND sold_at <= $1', [oneWeekAgo]);
            
            if (result.rowCount && result.rowCount > 0) {
                console.log(`[Cleanup Job] Successfully deleted ${result.rowCount} sold products.`);
            } else {
                console.log('[Cleanup Job] No products to delete at this time.');
            }
        } catch (error) {
            console.error('[Cleanup Job] Error during product cleanup:', error);
        }
    });

    console.log('[Cleanup Job] Product cleanup cron job initialized.');
};
