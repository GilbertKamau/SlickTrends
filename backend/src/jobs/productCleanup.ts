import cron from 'node-cron';
import Product from '../models/Product';

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
            const result = await Product.deleteMany({
                isSold: true,
                soldAt: { $lte: oneWeekAgo }
            });
            
            if (result.deletedCount > 0) {
                console.log(`[Cleanup Job] Successfully deleted ${result.deletedCount} sold products.`);
            } else {
                console.log('[Cleanup Job] No products to delete at this time.');
            }
        } catch (error) {
            console.error('[Cleanup Job] Error during product cleanup:', error);
        }
    });

    console.log('[Cleanup Job] Product cleanup cron job initialized.');
};
