import { query } from '../config/db.postgres';
import { sendOrderConfirmationEmail } from './email.service';

/**
 * Triggers the order confirmation email after a successful payment.
 * Fetches order and item details from the database.
 */
export async function triggerOrderConfirmedEmail(orderId: string) {
    try {
        const orderRes = await query('SELECT user_email, user_name, total FROM orders WHERE id = $1', [orderId]);
        if (!orderRes.rows.length) {
            console.error(`[OrderEmail] Order ${orderId} not found for confirmation email.`);
            return;
        }
        
        const order = orderRes.rows[0];
        const itemsRes = await query('SELECT product_name, quantity, unit_price FROM order_items WHERE order_id = $1', [orderId]);
        
        const emailItems = itemsRes.rows.map(i => ({
            name: i.product_name,
            quantity: i.quantity,
            price: Number(i.unit_price)
        }));

        await sendOrderConfirmationEmail(
            order.user_email,
            order.user_name || 'Customer',
            orderId,
            emailItems,
            Number(order.total)
        );
        
        console.log(`[OrderEmail] Sent confirmation for order ${orderId} to ${order.user_email}`);
    } catch (error) {
        console.error(`[OrderEmail] Failed to send confirmation for order ${orderId}:`, error);
    }
}
