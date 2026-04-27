# Midtrans Sandbox Testing Guide

> Phase 23: Comprehensive guide for testing Midtrans payment integration in sandbox environment

## 📋 Prerequisites

1. **Midtrans Sandbox Account**
   - Sign up at: https://dashboard.sandbox.midtrans.com/register
   - Verify your email
   - Login to dashboard

2. **Get API Keys**
   - Navigate to: Settings → Access Keys
   - Copy **Server Key** (starts with `SB-Mid-server-`)
   - Copy **Client Key** (starts with `SB-Mid-client-`)

3. **Configure Environment**
   ```bash
   # .env.local (root)
   MIDTRANS_SERVER_KEY=SB-Mid-server-YOUR_KEY_HERE
   MIDTRANS_CLIENT_KEY=SB-Mid-client-YOUR_KEY_HERE
   MIDTRANS_IS_PRODUCTION=false
   
   # apps/web/.env.local
   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-YOUR_KEY_HERE
   NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
   ```

---

## 🧪 Test Scenarios

### 1. Checkout Flow Test

**Steps:**
1. Start the application:
   ```bash
   docker-compose up -d
   cd apps/api && npm run start:dev
   cd apps/web && npm run dev
   ```

2. Navigate to `/pricing` page
3. Select a paid plan (Starter, Growth, or Business)
4. Choose billing cycle (Monthly or Annual)
5. Click "Pilih Paket" button
6. Midtrans Snap popup should appear

**Expected Result:**
- Snap popup loads successfully
- Order details are correct (plan name, amount)
- Customer details pre-filled (name, email)

---

### 2. Payment Success Test

**Test Card Numbers (Sandbox):**

| Card Number         | CVV | Expiry | Result    |
|---------------------|-----|--------|-----------|
| 4811 1111 1111 1114 | 123 | 01/25  | Success   |
| 5573 3810 0000 0003 | 123 | 01/25  | Success   |

**Steps:**
1. Complete checkout flow (see above)
2. In Snap popup, select "Credit Card"
3. Enter test card: `4811 1111 1111 1114`
4. CVV: `123`, Expiry: `01/25`
5. Click "Pay"
6. Enter OTP: `112233`

**Expected Result:**
- Payment success message appears
- Redirected to `/billing` page
- Subscription status: **Active**
- User plan upgraded to selected plan
- Invoice status: **Paid**
- Invoice PDF downloadable

**Verify in Database:**
```sql
-- Check subscription
SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID';
-- status should be 'active', plan should be 'starter'/'growth'/'business'

-- Check invoice
SELECT * FROM invoices WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC LIMIT 1;
-- status should be 'paid', paid_at should be set

-- Check user
SELECT plan FROM users WHERE id = 'YOUR_USER_ID';
-- plan should match selected plan
```

---

### 3. Payment Failure Tests

#### 3.1 Denied Payment
**Card:** `4911 1111 1111 1113`

**Expected:**
- Payment denied by bank
- Invoice status: **Failed**
- User plan remains unchanged

#### 3.2 Expired Payment
**Steps:**
1. Complete checkout
2. Close Snap popup without paying
3. Wait 24 hours (or manually expire via Midtrans dashboard)

**Expected:**
- Invoice status: **Failed**
- Webhook received with `transaction_status: 'expire'`

#### 3.3 Cancelled Payment
**Steps:**
1. Complete checkout
2. Click "Cancel" in Snap popup

**Expected:**
- Invoice status: **Failed**
- User returned to pricing page

---

### 4. Webhook Testing

#### 4.1 Local Webhook Testing with ngrok

**Setup:**
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3001

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

**Configure Midtrans:**
1. Go to: https://dashboard.sandbox.midtrans.com/settings/vtweb_configuration
2. Set **Payment Notification URL**: `https://abc123.ngrok.io/api/v1/billing/webhook`
3. Save

**Test Webhook:**
1. Complete a payment in sandbox
2. Check ngrok terminal for incoming webhook
3. Check API logs for webhook processing

**Expected Logs:**
```
[Webhook] ✅ Order ORDER-xxxxx-1234567890 settled → user abc-123 upgraded to starter
```

#### 4.2 Manual Webhook Simulation

**Using cURL:**
```bash
curl -X POST http://localhost:3001/api/v1/billing/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER-test-1234567890",
    "status_code": "200",
    "gross_amount": "99000.00",
    "transaction_status": "settlement",
    "signature_key": "VALID_SIGNATURE_HERE"
  }'
```

**Note:** You need to generate a valid signature using:
```
SHA512(order_id + status_code + gross_amount + server_key)
```

---

### 5. Idempotency Test

**Steps:**
1. Complete a successful payment
2. Manually trigger the same webhook again (via Midtrans dashboard or cURL)

**Expected:**
- Second webhook returns `200 OK`
- No duplicate processing
- Logs show: `[Webhook] Order ORDER-xxx already processed (idempotent)`
- Database unchanged

---

### 6. Plan Upgrade Test

**Scenario:** User upgrades from Starter to Growth

**Steps:**
1. User has active Starter plan
2. Navigate to `/pricing`
3. Select Growth plan
4. Complete payment

**Expected:**
- Old subscription updated (not new record created)
- Plan changed to `growth`
- `currentPeriodEnd` extended by 30 days (monthly) or 365 days (annual)
- `cancelAtPeriodEnd` reset to `false`

---

### 7. Subscription Cancellation Test

**Steps:**
1. User has active paid plan
2. Navigate to `/billing`
3. Click "Batalkan Langganan"
4. Confirm cancellation

**Expected:**
- `cancelAtPeriodEnd` set to `true`
- Warning message displayed: "Langganan tidak akan diperpanjang"
- Plan remains active until `currentPeriodEnd`
- No refund issued

---

### 8. Invoice PDF Test

**Steps:**
1. User has at least one paid invoice
2. Navigate to `/billing`
3. Click "PDF" button next to invoice

**Expected:**
- PDF downloads successfully
- Filename: `invoice-{id}.pdf`
- PDF contains:
  - Order ID
  - Date
  - Customer details
  - Plan name
  - Amount in IDR format

---

## 🔍 Debugging Tips

### Check Midtrans Dashboard
- View all transactions: https://dashboard.sandbox.midtrans.com/transactions
- Filter by status: Settlement, Pending, Expire, Cancel
- View webhook logs

### Check Application Logs
```bash
# API logs
docker logs localcompliance-api -f

# Search for webhook events
docker logs localcompliance-api 2>&1 | grep "\[Webhook\]"
```

### Common Issues

**Issue:** Snap popup doesn't load
- **Fix:** Check `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` in `apps/web/.env.local`
- **Fix:** Verify Snap script URL matches environment (sandbox vs production)

**Issue:** Webhook not received
- **Fix:** Ensure ngrok tunnel is active
- **Fix:** Check Midtrans notification URL configuration
- **Fix:** Verify API is accessible from internet

**Issue:** Signature verification failed
- **Fix:** Ensure `MIDTRANS_SERVER_KEY` matches dashboard
- **Fix:** Check signature calculation in `midtrans.service.ts`

**Issue:** Plan not upgraded after payment
- **Fix:** Check webhook logs for errors
- **Fix:** Verify transaction in Midtrans dashboard
- **Fix:** Manually trigger webhook via dashboard

---

## 🚀 Production Checklist

Before switching to production:

- [ ] Get production API keys from https://dashboard.midtrans.com
- [ ] Update environment variables:
  ```bash
  MIDTRANS_SERVER_KEY=Mid-server-PRODUCTION_KEY
  MIDTRANS_CLIENT_KEY=Mid-client-PRODUCTION_KEY
  MIDTRANS_IS_PRODUCTION=true
  NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-PRODUCTION_KEY
  NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true
  ```
- [ ] Update Snap script URL (automatic via env check)
- [ ] Configure production webhook URL in Midtrans dashboard
- [ ] Test with real card (small amount)
- [ ] Enable Sentry error tracking
- [ ] Set up monitoring alerts for failed payments
- [ ] Document refund process
- [ ] Train support team on payment issues

---

## 📚 Resources

- **Midtrans Docs:** https://docs.midtrans.com
- **Snap Integration:** https://docs.midtrans.com/en/snap/overview
- **Webhook Notification:** https://docs.midtrans.com/en/after-payment/http-notification
- **Test Cards:** https://docs.midtrans.com/en/technical-reference/sandbox-test
- **Signature Verification:** https://docs.midtrans.com/en/after-payment/http-notification#verifying-notification-authenticity

---

**Last Updated:** 2026-04-22 (Phase 23)
