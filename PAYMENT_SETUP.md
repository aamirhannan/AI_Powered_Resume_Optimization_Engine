# Payment Integration Setup (Single-Table Strategy)

## 1. Environment Variables
Add the following keys to your `.env` file and your Render/Vercel environment settings.

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

## 2. Supabase Database Setup
Run the following SQL in your Supabase SQL Editor. We are using **only** the `user_purchases` table to track subscription validity.

```sql
-- 1. Create or Update 'user_purchases' table
-- Check if table exists first, if not create it
create table if not exists public.user_purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  plan_tier text not null, -- 'PRO_TIER'
  amount decimal(10, 2) not null,
  currency text default 'INR',
  
  payment_provider text, -- 'razorpay'
  transaction_id text,   -- Stores razorpay_payment_id on SUCCESS
  order_id text unique,  -- Stores razorpay_order_id
  
  status text check (status in ('PENDING', 'SUCCESS', 'FAILED')) default 'PENDING',
  
  -- THE CRITICAL FIELD: When does this specific purchase stop being valid?
  valid_until timestamptz,
  
  purchased_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add order_id column if the table already existed without it
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='user_purchases' and column_name='order_id') then 
    alter table public.user_purchases add column order_id text unique; 
  end if; 
end $$;

-- RLS
alter table public.user_purchases enable row level security;
create policy "Users view own purchases" on public.user_purchases
  for select using (auth.uid() = user_id);

create policy "Users insert own purchases" on public.user_purchases
  for insert with check (auth.uid() = user_id);

create policy "Users update own purchases" on public.user_purchases
  for update using (auth.uid() = user_id);

-- NOTE: We are NOT touching 'user_settings'.
```

## 3. Frontend Integration Snippet
Use this snippet in your React frontend when the "Pay" button is clicked.

```javascript
// Step 1: Load script
const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Step 2: Handle Payment
const handlePayment = async () => {
    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

    if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
    }

    // 1. Create Order
    const result = await axios.post('/api/v1/payment/create-order'); 
    
    if (!result.data.success) {
        alert('Server error. Are you online?');
        return;
    }

    const { amount, id: order_id, currency, key_id } = result.data;

    const options = {
        key: key_id, 
        amount: amount.toString(),
        currency: currency,
        name: "Resume Program",
        description: "1 Month Subscription",
        order_id: order_id,
        handler: async function (response) {
            // 2. Verify Payment
            const data = {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
            };

            const result = await axios.post('/api/v1/payment/verify-payment', data);

            if(result.data.success){
                 alert("Subscription Activated!");
                 window.location.reload();
            } else {
                 alert("Payment verification failed");
            }
        },
        prefill: {
            name: "User Name", // Fetch from user profile
            email: "user@example.com", // Fetch from user profile
        },
        theme: {
            color: "#61dafb",
        },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
}
```
