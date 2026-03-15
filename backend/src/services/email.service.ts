import nodemailer from 'nodemailer';

// Use Gmail by default, but allow switching to SendGrid via environment variables
const isSendGrid = process.env.EMAIL_SERVICE === 'sendgrid' || !!process.env.SENDGRID_API_KEY;

const transporter = nodemailer.createTransport({
    host: isSendGrid ? 'smtp.sendgrid.net' : (process.env.SMTP_HOST || 'smtp.gmail.com'),
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: isSendGrid ? 'apikey' : process.env.SMTP_USER,
        pass: isSendGrid ? (process.env.SENDGRID_API_KEY || process.env.SMTP_PASS) : process.env.SMTP_PASS,
    },
});

const FROM = `"Slick Trends" <${process.env.SMTP_USER || 'noreply@slicktrends.com'}>`;
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
<body style="margin:0;padding:0;background:#0a0012;font-family:'Segoe UI',Arial,sans-serif;color:#f5f0ff;">
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0012;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1a0533,#2d0a5e);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;border-bottom:2px solid rgba(212,175,55,0.4);">
          <h1 style="margin:0;font-size:28px;font-weight:700;letter-spacing:1px;">
            <span style="color:#d4af37;">Slick</span><span style="color:#f5f0ff;"> Trends</span>
          </h1>
          <p style="margin:6px 0 0;font-size:12px;color:#b8a9d0;letter-spacing:2px;">PREMIUM SECOND-HAND SLEEPWEAR</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:rgba(26,5,51,0.95);padding:40px;border:1px solid rgba(124,58,237,0.2);">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#0a0012;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid rgba(124,58,237,0.1);border-top:none;">
          <p style="margin:0 0 8px;font-size:12px;color:#6b5a8a;">You're receiving this because you shopped at Slick Trends</p>
          <p style="margin:0;font-size:12px;color:#6b5a8a;">
            <a href="${SITE}" style="color:#d4af37;text-decoration:none;">Visit Store</a> &nbsp;|&nbsp;
            <a href="${SITE}/profile" style="color:#d4af37;text-decoration:none;">My Account</a> &nbsp;|&nbsp;
            <a href="mailto:support@slicktrends.com" style="color:#d4af37;text-decoration:none;">Support</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string, color = '#d4af37') {
    return `<a href="${url}" style="display:inline-block;padding:14px 32px;background:${color};color:#0a0012;font-weight:700;font-size:15px;text-decoration:none;border-radius:10px;margin:20px 0;">${text}</a>`;
}

function orderItemsTable(items: { name: string; quantity: number; price: number }[]) {
    const rows = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(124,58,237,0.13);color:#b8a9d0;">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(124,58,237,0.13);color:#6b5a8a;text-align:center;">×${i.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(124,58,237,0.13);color:#d4af37;text-align:right;font-weight:600;">KES ${(i.price * i.quantity).toLocaleString()}</td>
    </tr>`).join('');
    return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <thead><tr>
      <th style="text-align:left;color:#6b5a8a;font-size:11px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(212,175,55,0.3);">Item</th>
      <th style="text-align:center;color:#6b5a8a;font-size:11px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(212,175,55,0.3);">Qty</th>
      <th style="text-align:right;color:#6b5a8a;font-size:11px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(212,175,55,0.3);">Price</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ─── Email Templates ──────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
    const content = `
    <h2 style="color:#d4af37;font-size:24px;margin:0 0 16px;">Welcome to the Family, ${name}! 🌙</h2>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 20px;">We're thrilled to have you at <strong style="color:#f5f0ff;">Slick Trends</strong> — your destination for premium second-hand sleepwear. Sleep sustainably, sleep in style.</p>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 24px;">Browse our curated collection of robes, onesies, pajamas, night dresses and more — all quality-checked and ready for you.</p>
    <div style="text-align:center;">${btn('Shop Now →', SITE + '/products')}</div>
    <div style="margin-top:32px;padding:20px;background:rgba(124,58,237,0.1);border-radius:12px;border:1px solid rgba(124,58,237,0.2);">
      <p style="margin:0;color:#b8a9d0;font-size:14px;text-align:center;">🎁 <strong style="color:#d4af37;">Free shipping</strong> on all orders over KES 5,000</p>
    </div>`;
    await transporter.sendMail({ from: FROM, to, subject: `Welcome to Slick Trends, ${name}! 🌙`, html: baseTemplate(`Welcome, ${name}!`, content, `Your sustainable sleepwear journey starts here`) });
}

export async function sendOrderConfirmationEmail(to: string, name: string, orderId: string, items: { name: string; quantity: number; price: number }[], total: number) {
    const short = orderId.slice(0, 8).toUpperCase();
    const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;border-radius:50%;background:rgba(16,185,129,0.2);border:2px solid #10b981;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">✅</div>
    </div>
    <h2 style="color:#10b981;font-size:22px;margin:0 0 8px;text-align:center;">Order Confirmed!</h2>
    <p style="color:#6b5a8a;text-align:center;margin:0 0 28px;font-size:14px;">Order #${short}</p>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 8px;">Hi <strong style="color:#f5f0ff;">${name}</strong>, thank you for your order! We've received it and it's being prepared for dispatch.</p>
    ${orderItemsTable(items)}
    <div style="display:flex;justify-content:space-between;padding:16px 0;border-top:2px solid rgba(212,175,55,0.3);">
      <strong style="color:#f5f0ff;font-size:16px;">Total Paid</strong>
      <strong style="color:#d4af37;font-size:18px;">KES ${total.toLocaleString()}</strong>
    </div>
    <div style="text-align:center;margin-top:24px;">${btn('Track My Order', SITE + '/orders')}</div>`;
    await transporter.sendMail({ from: FROM, to, subject: `Order Confirmed #${short} — Slick Trends 🎉`, html: baseTemplate('Order Confirmed', content, `Your order #${short} is confirmed!`) });
}

export async function sendOrderDispatchedEmail(to: string, name: string, orderId: string, total: number) {
    const short = orderId.slice(0, 8).toUpperCase();
    const content = `
    <div style="text-align:center;margin-bottom:32px;"><div style="font-size:48px;">🚚</div></div>
    <h2 style="color:#a78bfa;font-size:22px;margin:0 0 8px;text-align:center;">Your Order is On Its Way!</h2>
    <p style="color:#6b5a8a;text-align:center;margin:0 0 28px;font-size:14px;">Order #${short}</p>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 20px;">Hi <strong style="color:#f5f0ff;">${name}</strong>! Great news — your Slick Trends order has been dispatched. Expect delivery within <strong style="color:#d4af37;">2–5 business days</strong>.</p>
    <div style="padding:20px;background:rgba(167,139,250,0.1);border-radius:12px;border:1px solid rgba(167,139,250,0.2);margin-bottom:24px;">
      <p style="margin:0;color:#b8a9d0;font-size:14px;">📦 <strong style="color:#a78bfa;">Order:</strong> #${short} &nbsp;|&nbsp; <strong style="color:#a78bfa;">Value:</strong> KES ${total.toLocaleString()}</p>
    </div>
    <div style="text-align:center;">${btn('Track My Order', SITE + '/orders', '#7c3aed')}</div>`;
    await transporter.sendMail({ from: FROM, to, subject: `Your order is on its way! 🚚 #${short}`, html: baseTemplate('Order Dispatched', content, `Order #${short} has been dispatched`) });
}

export async function sendOrderDeliveredEmail(to: string, name: string, orderId: string) {
    const short = orderId.slice(0, 8).toUpperCase();
    const content = `
    <div style="text-align:center;margin-bottom:32px;"><div style="font-size:48px;">📦✨</div></div>
    <h2 style="color:#60a5fa;font-size:22px;margin:0 0 8px;text-align:center;">Your Order Has Been Delivered!</h2>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 20px;">Hi <strong style="color:#f5f0ff;">${name}</strong>! We hope you love your new sleepwear. Your order <strong style="color:#d4af37;">#${short}</strong> has been marked as delivered.</p>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 24px;">If you have any issues with your order, our support team is here to help. Enjoy your cozy new arrivals! 🌙</p>
    <div style="text-align:center;margin-bottom:24px;">${btn('Shop Again', SITE + '/products', '#10b981')}</div>
    <div style="padding:20px;background:rgba(212,175,55,0.08);border-radius:12px;border:1px solid rgba(212,175,55,0.2);text-align:center;">
      <p style="margin:0;color:#b8a9d0;font-size:14px;">💛 Loved your purchase? Tell a friend about Slick Trends!</p>
    </div>`;
    await transporter.sendMail({ from: FROM, to, subject: `Delivered! Your Slick Trends order #${short} 📦`, html: baseTemplate('Order Delivered', content, `Order #${short} delivered successfully`) });
}

export async function sendOrderClosedEmail(to: string, name: string, orderId: string) {
    const short = orderId.slice(0, 8).toUpperCase();
    const content = `
    <div style="text-align:center;margin-bottom:32px;"><div style="font-size:48px;">🔒</div></div>
    <h2 style="color:#d4af37;font-size:22px;margin:0 0 8px;text-align:center;">Sale Complete — Thank You!</h2>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 20px;">Hi <strong style="color:#f5f0ff;">${name}</strong>! Your order <strong style="color:#d4af37;">#${short}</strong> has been closed and the sale is complete. Thank you for choosing Slick Trends for sustainable sleepwear!</p>
    <div style="text-align:center;">${btn('Browse More', SITE + '/products')}</div>`;
    await transporter.sendMail({ from: FROM, to, subject: `Sale Complete — Order #${short} closed ✅`, html: baseTemplate('Sale Complete', content) });
}

export async function sendOrderCancelledEmail(to: string, name: string, orderId: string, reason = '') {
    const short = orderId.slice(0, 8).toUpperCase();
    const content = `
    <div style="text-align:center;margin-bottom:32px;"><div style="font-size:48px;">❌</div></div>
    <h2 style="color:#ef4444;font-size:22px;margin:0 0 8px;text-align:center;">Order Cancelled</h2>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 20px;">Hi <strong style="color:#f5f0ff;">${name}</strong>, your order <strong style="color:#d4af37;">#${short}</strong> has been cancelled. ${reason ? `<br/><em style="color:#6b5a8a;">Reason: ${reason}</em>` : ''}</p>
    <p style="color:#b8a9d0;margin:0 0 24px;">If this was an error or you have questions, please contact our support.</p>
    <div style="text-align:center;">${btn('Shop Again', SITE + '/products', '#7c3aed')}</div>`;
    await transporter.sendMail({ from: FROM, to, subject: `Order #${short} has been cancelled`, html: baseTemplate('Order Cancelled', content) });
}

export async function sendAbandonedCartEmail(to: string, name: string, cartItems: { name: string; price: number; image?: string }[], totalValue: number) {
    const itemNames = cartItems.slice(0, 3).map(i => i.name).join(', ');
    const content = `
    <div style="text-align:center;margin-bottom:28px;"><div style="font-size:48px;">🛒</div></div>
    <h2 style="color:#d4af37;font-size:22px;margin:0 0 12px;text-align:center;">You left something behind, ${name.split(' ')[0]}!</h2>
    <p style="color:#b8a9d0;text-align:center;line-height:1.8;margin:0 0 24px;">Your cart is waiting for you. Don't miss out on these premium second-hand pieces — they're limited stock and won't last long!</p>
    <div style="padding:20px;background:rgba(212,175,55,0.08);border-radius:14px;border:1px solid rgba(212,175,55,0.25);margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:14px;color:#6b5a8a;text-transform:uppercase;letter-spacing:1px;">Items in your cart</p>
      <p style="margin:0 0 4px;color:#f5f0ff;font-weight:600;">${itemNames}${cartItems.length > 3 ? ` +${cartItems.length - 3} more` : ''}</p>
      <p style="margin:8px 0 0;color:#d4af37;font-size:18px;font-weight:800;">KES ${totalValue.toLocaleString()} total</p>
    </div>
    <div style="padding:16px;background:rgba(16,185,129,0.08);border-radius:10px;border:1px solid rgba(16,185,129,0.2);margin-bottom:28px;text-align:center;">
      <p style="margin:0;color:#10b981;font-size:14px;font-weight:600;">✅ Pay with M-Pesa, Stripe, PayPal or Card</p>
    </div>
    <div style="text-align:center;">${btn('Complete My Purchase →', SITE + '/cart', '#d4af37')}</div>
    <p style="color:#6b5a8a;font-size:12px;text-align:center;margin-top:24px;">These items are in limited supply — grab yours before someone else does! 🌙</p>`;
    await transporter.sendMail({ from: FROM, to, subject: `${name.split(' ')[0]}, your cart is waiting! 🛒 KES ${totalValue.toLocaleString()} inside`, html: baseTemplate('Your Cart is Waiting', content, `You left KES ${totalValue.toLocaleString()} worth of sleepwear in your cart`) });
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
    const content = `
    <h2 style="color:#d4af37;font-size:22px;margin:0 0 16px;">Password Reset Request</h2>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 20px;">Hi ${name}, you requested to reset your password. Click the button below to set a new one. This link will expire in 1 hour.</p>
    <div style="text-align:center;">${btn('Reset Password', resetUrl)}</div>
    <p style="color:#6b5a8a;font-size:12px;margin-top:24px;">If you didn't request this, please ignore this email.</p>`;
    await transporter.sendMail({ from: FROM, to, subject: 'Password Reset Request — Slick Trends', html: baseTemplate('Reset Your Password', content) });
}

export async function sendOTPEmail(to: string, name: string, otp: string) {
    const content = `
    <h2 style="color:#d4af37;font-size:22px;margin:0 0 16px;">Verify Your Email</h2>
    <p style="color:#b8a9d0;line-height:1.8;margin:0 0 20px;">Hi ${name}, welcome to Slick Trends! Please use the following code to verify your account:</p>
    <div style="background:rgba(212,175,55,0.1);border:1px dashed #d4af37;padding:20px;text-align:center;border-radius:12px;margin:24px 0;">
      <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#d4af37;">${otp}</span>
    </div>
    <p style="color:#b8a9d0;font-size:14px;">This code is valid for 10 minutes.</p>`;
    await transporter.sendMail({ from: FROM, to, subject: `${otp} is your Slick Trends verification code`, html: baseTemplate('Verify Your Account', content) });
}

export default transporter;
