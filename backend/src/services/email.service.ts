import { Resend } from 'resend';

// ─── Resend Client ────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL || 'Slick Trends <onboarding@resend.dev>';
const SITE = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Base Email Template ──────────────────────────────────────────────────────
function baseTemplate(title: string, content: string, preheader = '') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0012;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#f5f0ff;">
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0012;padding:40px 10px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:rgba(26,5,51,0.95);border-radius:24px;overflow:hidden;border:1px solid rgba(124,58,237,0.15);box-shadow:0 20px 40px rgba(0,0,0,0.4);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1a0533 0%,#2d0a5e 100%);padding:40px 40px 30px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.2);">
          <div style="margin-bottom:10px;">
            <span style="font-size:32px;font-weight:800;letter-spacing:2px;color:#d4af37;text-shadow:0 2px 4px rgba(0,0,0,0.3);">SLICK</span>
            <span style="font-size:32px;font-weight:300;letter-spacing:2px;color:#f5f0ff;"> TRENDS</span>
          </div>
          <p style="margin:0;font-size:11px;color:#b8a9d0;letter-spacing:4px;text-transform:uppercase;">Premium Second-Hand Sleepwear</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px 50px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:rgba(10,0,18,0.5);padding:30px 40px;text-align:center;border-top:1px solid rgba(124,58,237,0.1);">
          <div style="margin-bottom:20px;">
            <a href="${SITE}" style="color:#d4af37;text-decoration:none;font-size:13px;margin:0 10px;">Shop Store</a>
            <a href="${SITE}/profile" style="color:#d4af37;text-decoration:none;font-size:13px;margin:0 10px;">My Account</a>
            <a href="mailto:support@slicktrendske.com" style="color:#d4af37;text-decoration:none;font-size:13px;margin:0 10px;">Support</a>
          </div>
          <p style="margin:0;font-size:11px;color:#6b5a8a;line-height:1.6;">
            &copy; ${new Date().getFullYear()} Slick Trends. All rights reserved.<br/>
            You're receiving this because you shopped at Slick Trends or subscribed to our newsletter.
          </p>
        </td></tr>
      </table>
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-top:20px;">
        <tr><td align="center" style="font-size:10px;color:#4b3f61;">
          <p>Slick Trends, Nairobi, Kenya</p>
          <p><a href="{{unsubscribe_url}}" style="color:#6b5a8a;text-decoration:underline;">Unsubscribe</a> from these emails</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string, color = '#d4af37') {
    return `<a href="${url}" style="display:inline-block;padding:16px 36px;background:${color};color:#0a0012;font-weight:700;font-size:15px;text-decoration:none;border-radius:12px;margin:25px 0;box-shadow:0 4px 15px rgba(212,175,55,0.3);text-transform:uppercase;letter-spacing:1px;">${text}</a>`;
}

function orderItemsTable(items: { name: string; quantity: number; price: number }[]) {
    const rows = items.map(i => `
    <tr>
      <td style="padding:15px 0;border-bottom:1px solid rgba(124,58,237,0.1);color:#b8a9d0;font-size:14px;">${i.name}</td>
      <td style="padding:15px 0;border-bottom:1px solid rgba(124,58,237,0.1);color:#6b5a8a;text-align:center;font-size:14px;">×${i.quantity}</td>
      <td style="padding:15px 0;border-bottom:1px solid rgba(124,58,237,0.1);color:#d4af37;text-align:right;font-weight:600;font-size:14px;">KES ${(i.price * i.quantity).toLocaleString()}</td>
    </tr>`).join('');
    return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:25px 0;">
    <thead><tr>
      <th style="text-align:left;color:#6b5a8a;font-size:11px;text-transform:uppercase;padding-bottom:12px;border-bottom:2px solid rgba(212,175,55,0.2);letter-spacing:1px;">Item</th>
      <th style="text-align:center;color:#6b5a8a;font-size:11px;text-transform:uppercase;padding-bottom:12px;border-bottom:2px solid rgba(212,175,55,0.2);letter-spacing:1px;">Qty</th>
      <th style="text-align:right;color:#6b5a8a;font-size:11px;text-transform:uppercase;padding-bottom:12px;border-bottom:2px solid rgba(212,175,55,0.2);letter-spacing:1px;">Price</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ─── Helper: send via Resend ──────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
    // Redirect all emails to the test recipient if in mock mode
    const MOCK_RECIPIENT = 'margaret@slicktrendske.com';
    const isDev = process.env.NODE_ENV === 'development';
    
    // We redirect if explicit MOCK_MODE is on OR if we're in dev and want to be safe
    const finalTo = (process.env.EMAIL_MOCK_MODE === 'true' || isDev) ? MOCK_RECIPIENT : to;

    console.log(`[Email] ${finalTo !== to ? 'MOCKING' : 'SENDING'} to ${finalTo} (Original: ${to}): ${subject}`);
    
    const { error } = await resend.emails.send({
        from: FROM,
        to: [finalTo],
        subject: isDev ? `[TEST] ${subject}` : subject,
        html,
    });
    if (error) {
        console.error('❌ Resend email error:', error);
        throw new Error(`Resend email failed: ${error.message}`);
    }
}


// ─── Email Templates ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
    const content = `
    <h2 style="color:#d4af37;font-size:26px;margin:0 0 20px;line-height:1.3;">Welcome to the Family, ${name}! 🌙</h2>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 24px;font-size:16px;">We're thrilled to have you at <strong style="color:#f5f0ff;">Slick Trends</strong> — your destination for premium second-hand sleepwear. Sleep sustainably, sleep in style.</p>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 30px;font-size:15px;">Our mission is to bring you the highest quality nightwear while being kind to the planet. Every piece in our collection is hand-picked and quality-checked just for you.</p>
    <div style="text-align:center;">${btn('Start Exploring →', SITE + '/products')}</div>
    <div style="margin-top:40px;padding:25px;background:rgba(124,58,237,0.08);border-radius:16px;border:1px solid rgba(124,58,237,0.15);text-align:center;">
      <p style="margin:0;color:#b8a9d0;font-size:14px;"><strong style="color:#d4af37;">PRO TIP:</strong> Get <strong style="color:#f5f0ff;">Free Shipping</strong> on all orders over KES 5,000!</p>
    </div>`;
    await sendEmail(to, `Welcome to Slick Trends, ${name}! 🌙`, baseTemplate(`Welcome, ${name}!`, content, `Your sustainable sleepwear journey starts here`));
}

export async function sendOTPEmail(to: string, name: string, otp: string) {
    const content = `
    <h2 style="color:#d4af37;font-size:24px;margin:0 0 16px;text-align:center;">Verify Your Account</h2>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 24px;text-align:center;">Hi ${name}, welcome to Slick Trends! Please use the following code to verify your account and start shopping:</p>
    <div style="background:linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.05));border:1px dashed rgba(212,175,55,0.4);padding:30px;text-align:center;border-radius:16px;margin:30px 0;">
      <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#d4af37;display:block;">${otp}</span>
    </div>
    <p style="color:#6b5a8a;font-size:13px;text-align:center;">This code is valid for 10 minutes. If you didn't request this code, please ignore this email.</p>`;
    await sendEmail(to, `${otp} is your Slick Trends verification code`, baseTemplate('Verify Your Account', content));
}

export async function sendOrderConfirmationEmail(to: string, name: string, orderId: string, items: { name: string; quantity: number; price: number }[], total: number) {
    const short = orderId.slice(0, 8).toUpperCase();
    const content = `
    <div style="text-align:center;margin-bottom:30px;">
      <div style="width:70px;height:70px;border-radius:50%;background:rgba(16,185,129,0.15);border:2px solid #10b981;display:inline-flex;align-items:center;justify-content:center;font-size:32px;color:#10b981;">&check;</div>
    </div>
    <h2 style="color:#10b981;font-size:24px;margin:0 0 8px;text-align:center;">Order Confirmed!</h2>
    <p style="color:#6b5a8a;text-align:center;margin:0 0 32px;font-size:14px;letter-spacing:1px;">ORDER #${short}</p>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 20px;font-size:15px;">Hi <strong style="color:#f5f0ff;">${name}</strong>, payment received! We're now preparing your sustainable sleepwear for dispatch. Relax, your package will be with you shortly.</p>
    ${orderItemsTable(items)}
    <div style="padding:20px 0;border-top:2px solid rgba(212,175,55,0.2);margin-top:10px;">
      <table width="100%">
        <tr>
          <td style="color:#f5f0ff;font-size:16px;font-weight:600;">Total Amount Paid</td>
          <td align="right" style="color:#d4af37;font-size:20px;font-weight:800;">KES ${total.toLocaleString()}</td>
        </tr>
      </table>
    </div>
    <div style="text-align:center;margin-top:30px;">${btn('Track My Order', SITE + '/orders')}</div>`;
    await sendEmail(to, `Order Confirmed #${short} — Slick Trends 🎉`, baseTemplate('Order Confirmed', content, `Your payment for order #${short} was successful!`));
}

export async function sendOrderDispatchedEmail(to: string, name: string, orderId: string, total: number) {
    const short = orderId.slice(0, 8).toUpperCase();
    const content = `
    <div style="text-align:center;margin-bottom:32px;"><div style="font-size:54px;">🚚</div></div>
    <h2 style="color:#a78bfa;font-size:24px;margin:0 0 8px;text-align:center;">Your Order is On Its Way!</h2>
    <p style="color:#6b5a8a;text-align:center;margin:0 0 30px;font-size:14px;">ORDER #${short}</p>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 24px;font-size:15px;">Hi <strong style="color:#f5f0ff;">${name}</strong>! Great news — your Slick Trends order is dispatched and headed your way. Get ready for some serious comfort!</p>
    <div style="padding:25px;background:rgba(167,139,250,0.1);border-radius:16px;border:1px solid rgba(167,139,250,0.2);margin-bottom:30px;">
      <p style="margin:0 0 10px;color:#f5f0ff;font-size:14px;font-weight:600;">Delivery Estimate: <span style="color:#d4af37;">2–5 Business Days</span></p>
      <p style="margin:0;color:#b8a9d0;font-size:14px;">📦 <strong style="color:#a78bfa;">Package:</strong> #${short} &nbsp;|&nbsp; <strong style="color:#a78bfa;">Value:</strong> KES ${total.toLocaleString()}</p>
    </div>
    <div style="text-align:center;">${btn('Track My Shipment', SITE + '/orders', '#7c3aed')}</div>`;
    await sendEmail(to, `Your order is on its way! 🚚 #${short}`, baseTemplate('Order Dispatched', content, `Order #${short} has been dispatched`));
}

export async function sendOrderDeliveredEmail(to: string, name: string, orderId: string) {
    const short = orderId.slice(0, 8).toUpperCase();
    const content = `
    <div style="text-align:center;margin-bottom:32px;"><div style="font-size:54px;">✨📦✨</div></div>
    <h2 style="color:#60a5fa;font-size:24px;margin:0 0 8px;text-align:center;">Package Delivered!</h2>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 24px;font-size:15px;text-align:center;">Hi <strong style="color:#f5f0ff;">${name}</strong>! Your order <strong style="color:#d4af37;">#${short}</strong> has been successfully delivered. We hope you love your new sustainable arrivals! 🌙</p>
    <div style="text-align:center;margin-bottom:30px;">${btn('Shop New Arrivals', SITE + '/products', '#10b981')}</div>
    <div style="padding:25px;background:rgba(212,175,55,0.08);border-radius:16px;border:1px solid rgba(212,175,55,0.15);text-align:center;">
      <p style="margin:0;color:#b8a9d0;font-size:14px;">💛 Loving your purchase? Tag us in your photos and tell a friend about Slick Trends!</p>
    </div>`;
    await sendEmail(to, `Delivered! Your Slick Trends order #${short} 📦`, baseTemplate('Order Delivered', content, `Order #${short} delivered successfully`));
}

export async function sendOrderCancelledEmail(to: string, name: string, orderId: string, reason = '') {
    const short = orderId.slice(0, 8).toUpperCase();
    const content = `
    <div style="text-align:center;margin-bottom:32px;"><div style="font-size:54px;">❌</div></div>
    <h2 style="color:#ef4444;font-size:24px;margin:0 0 8px;text-align:center;">Order Cancelled</h2>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 24px;font-size:15px;">Hi <strong style="color:#f5f0ff;">${name}</strong>, your order <strong style="color:#d4af37;">#${short}</strong> has been cancelled and will not be processed further.</p>
    ${reason ? `<div style="padding:20px;background:rgba(239,68,68,0.08);border-radius:12px;margin-bottom:24px;border-left:4px solid #ef4444;"><p style="margin:0;color:#b8a9d0;font-size:14px;"><strong style="color:#ef4444;">Reason:</strong> ${reason}</p></div>` : ''}
    <p style="color:#b8a9d0;margin:0 0 30px;font-size:14px;">If you have any questions or feel this was an error, please reach out to our support team immediately.</p>
    <div style="text-align:center;">${btn('Browse Store', SITE + '/products', '#7c3aed')}</div>`;
    await sendEmail(to, `Order #${short} has been cancelled`, baseTemplate('Order Cancelled', content));
}

export async function sendPromotionEmail(to: string, name: string, promoTitle: string, promoText: string, discountCode?: string, imageUrl?: string) {
    const content = `
    ${imageUrl ? `<img src="${imageUrl}" alt="${promoTitle}" style="width:100%;border-radius:16px;margin-bottom:30px;border:1px solid rgba(124,58,237,0.2);"/>` : ''}
    <h2 style="color:#d4af37;font-size:28px;margin:0 0 16px;line-height:1.2;text-align:center;letter-spacing:1px;">${promoTitle}</h2>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 24px;font-size:16px;text-align:center;">Hello ${name}, we have something special for you! 🌙</p>
    <div style="color:#f5f0ff;line-height:1.8;margin:0 0 30px;font-size:16px;text-align:center;">${promoText}</div>
    
    ${discountCode ? `
    <div style="background:rgba(212,175,55,0.08);border:2px dashed #d4af37;padding:25px;text-align:center;border-radius:16px;margin:30px 0;">
      <p style="margin:0 0 10px;color:#b8a9d0;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Use code at checkout</p>
      <span style="font-size:32px;font-weight:800;letter-spacing:2px;color:#d4af37;">${discountCode}</span>
    </div>` : ''}
    
    <div style="text-align:center;">${btn('Shop the Sale →', SITE + '/products')}</div>
    <p style="color:#6b5a8a;font-size:12px;text-align:center;margin-top:30px;letter-spacing:0.5px;">Hurry! This offer won't last forever. Sleep premium, spend wisely.</p>`;
    await sendEmail(to, `${promoTitle} 🌙 — Slick Trends`, baseTemplate(promoTitle, content, `A special offer just for you, ${name}!`));
}

export async function sendAbandonedCartEmail(to: string, name: string, cartItems: { name: string; price: number; image?: string }[], totalValue: number) {
    const itemNames = cartItems.slice(0, 3).map(i => i.name).join(', ');
    const content = `
    <div style="text-align:center;margin-bottom:30px;"><div style="font-size:54px;">🛒</div></div>
    <h2 style="color:#d4af37;font-size:24px;margin:0 0 16px;text-align:center;line-height:1.3;">Did you forget something, ${name.split(' ')[0]}?</h2>
    <p style="color:#b8a9d0;text-align:center;line-height:1.8;margin:0 0 30px;font-size:15px;">Your cart is still waiting for you. Don't miss out on these premium second-hand pieces — they're limited stock and unique, so they won't last long!</p>
    <div style="padding:25px;background:rgba(212,175,55,0.1);border-radius:20px;border:1px solid rgba(212,175,55,0.25);margin-bottom:30px;">
      <p style="margin:0 0 12px;font-size:13px;color:#6b5a8a;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Reserved in your cart</p>
      <p style="margin:0 0 8px;color:#f5f0ff;font-weight:600;font-size:16px;">${itemNames}${cartItems.length > 3 ? ` +${cartItems.length - 3} more` : ''}</p>
      <div style="margin-top:15px;padding-top:15px;border-top:1px solid rgba(212,175,55,0.2);">
        <span style="color:#d4af37;font-size:22px;font-weight:800;">KES ${totalValue.toLocaleString()} total</span>
      </div>
    </div>
    <div style="text-align:center;">${btn('Complete My Purchase →', SITE + '/cart', '#d4af37')}</div>
    <p style="border-top:1px solid rgba(124,58,237,0.1);padding-top:25px;color:#6b5a8a;font-size:12px;text-align:center;margin-top:10px;">Free exchanges & returns within 7 days. Shop with confidence. 🌙</p>`;
    await sendEmail(to, `${name.split(' ')[0]}, your cart is waiting! 🛒`, baseTemplate('Your Cart is Waiting', content, `You left KES ${totalValue.toLocaleString()} worth of sleepwear in your cart`));
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
    const content = `
    <h2 style="color:#d4af37;font-size:24px;margin:0 0 16px;">Reset Your Password</h2>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 24px;font-size:15px;">Hi ${name}, you requested a password reset for your Slick Trends account. No problem! Click the button below to choose a new one. This link expires in 1 hour.</p>
    <div style="text-align:center;">${btn('Reset Password', resetUrl)}</div>
    <p style="color:#6b5a8a;font-size:12px;margin-top:30px;">If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account's security.</p>`;
    await sendEmail(to, 'Password Reset Request — Slick Trends', baseTemplate('Reset Your Password', content));
}

export async function sendOrderClosedEmail(to: string, name: string, orderId: string) {
    const short = orderId.slice(0, 8).toUpperCase();
    const content = `
    <div style="text-align:center;margin-bottom:32px;"><div style="font-size:54px;">🔒</div></div>
    <h2 style="color:#d4af37;font-size:24px;margin:0 0 8px;text-align:center;">Transaction Complete</h2>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 24px;font-size:15px;text-align:center;">Hi <strong style="color:#f5f0ff;">${name}</strong>! Your order <strong style="color:#d4af37;">#${short}</strong> has been officially closed. We hope you're enjoying your new sustainable sleepwear! Thank you for being part of the Slick Trends family.</p>
    <div style="text-align:center;">${btn('Browse New Collections', SITE + '/products')}</div>`;
    await sendEmail(to, `Order #${short} completed ✅`, baseTemplate('Sale Complete', content));
}

export { resend };
