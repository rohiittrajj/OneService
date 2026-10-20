# OneService

##🌐 Live Demo

🔗 **Website:** https://one-service-one.vercel.app/

Experience OneService without any local setup by visiting the live application above.

OneService is a modern home services marketplace designed to connect customers with trusted service professionals through a seamless digital platform.

The project was developed during HackTheBeginning'26, a hackathon organized at I.T.S. Engineering College on 10–11 April 2026. Out of approximately 75 teams that qualified for the screening round, our team secured a place among the Top 15 teams and achieved 8th position overall. We were also awarded a Consolation Trophy and Participation Certificate for our work.

The platform aims to simplify the process of discovering, booking, managing, and communicating with service providers while leveraging modern technologies such as Next.js, Node.js, MongoDB, Socket.io, cloud storage, and AI-powered features.

## Team Members

* Rohit Raj
* Saksham Gupta

  
# 🚀 OneService — Full-Stack AI Service Marketplace

A production-ready AI-powered home services marketplace with real-time capabilities, secure payments, and intelligent vendor matching.

---

## 📁 Project Structure

```
oneservice/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/             # DB connection
│   │   ├── controllers/        # Business logic
│   │   ├── middleware/         # Auth, error handling
│   │   ├── models/             # MongoDB schemas
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Email, PDF, notifications
│   │   ├── socket/             # Socket.io manager
│   │   ├── app.js              # Express app
│   │   └── server.js           # Entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/                   # Next.js 14 app
    ├── src/
    │   ├── app/                # Pages (App Router)
    │   │   ├── page.tsx        # Landing page
    │   │   ├── auth/           # Login, Signup
    │   │   ├── dashboard/      # User dashboard
    │   │   ├── vendor/         # Vendor dashboard
    │   │   ├── admin/          # Admin panel
    │   │   └── services/       # Service listings
    │   ├── components/         # Reusable UI components
    │   ├── hooks/              # Custom React hooks
    │   ├── lib/                # API client (axios)
    │   └── store/              # Zustand state (auth)
    ├── .env.local.example
    └── package.json
```

---

## 🔑 Third-Party Services You Need

Before running, sign up for these (all have free tiers):

| Service       | Purpose                | Link                             |
|---------------|------------------------|----------------------------------|
| MongoDB Atlas | Database               | https://cloud.mongodb.com        |
| OpenAI        | AI features            | https://platform.openai.com      |
| Stripe        | Payments               | https://stripe.com               |
| Cloudinary    | File/image uploads     | https://cloudinary.com           |
| Gmail (SMTP)  | Email (OTP, receipts)  | Use App Passwords in Gmail       |
| Twilio        | SMS OTP (optional)     | https://twilio.com               |
| Google Maps   | Maps & location        | https://console.cloud.google.com |

---

## ⚙️ LOCAL DEVELOPMENT SETUP

### Step 1 — Clone & Install

```bash
# Backend
cd oneservice/backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### Step 2 — Configure Backend Environment

```bash
cd oneservice/backend
cp .env.example .env
```

Open `.env` and fill in every value:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Get from MongoDB Atlas → Connect → Drivers
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/oneservice

# Make these long random strings (32+ chars)
JWT_SECRET=paste_a_long_random_secret_here_min_64_chars
JWT_REFRESH_SECRET=another_long_random_refresh_secret_here

# OpenAI → API Keys
OPENAI_API_KEY=sk-proj-...

# Stripe → Developers → API Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (set after webhook setup)

# Cloudinary → Dashboard
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=xxxxxxxxxxxxx

# Gmail: Enable 2FA → App Passwords → Generate
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=yourname@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop   (16-char app password, no spaces)
EMAIL_FROM="OneService <yourname@gmail.com>"

# Twilio (optional for SMS OTP)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=+1234567890

# Google Maps API Key
GOOGLE_MAPS_API_KEY=AIza...
```

---

### Step 3 — Configure Frontend Environment

```bash
cd oneservice/frontend
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_name
```

---

### Step 4 — Create Admin User

After the backend starts, run this once in MongoDB Atlas or Compass:

```javascript
// In MongoDB shell / Atlas Data Explorer
db.users.updateOne(
  { email: "admin@oneservice.com" },
  { $set: { role: "admin", isVerified: true } }
)
```

Or register a normal user first, then update their role to "admin".

---

### Step 5 — Run Both Servers

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd oneservice/backend
npm run dev
# → Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd oneservice/frontend
npm run dev
# → Runs on http://localhost:3000
```

Open http://localhost:3000 in your browser ✅

---

## 🌐 PRODUCTION DEPLOYMENT

### A. Database — MongoDB Atlas

1. Go to https://cloud.mongodb.com → Create free cluster
2. Create a database user (username + password)
3. Whitelist IP: `0.0.0.0/0` (allow all) or your server IP
4. Click "Connect" → "Drivers" → copy the connection string
5. Replace `<password>` in the URI with your actual password
6. Set `MONGODB_URI` in backend `.env`

---

### B. Backend — Render (Free)

1. Push your code to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo → select the `backend` folder
4. Configure:
   - **Name:** `oneservice-api`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Environment:** Add all your `.env` variables in "Environment Variables"
5. Click Deploy → you'll get a URL like `https://oneservice-api.onrender.com`

> **Set `CLIENT_URL`** to your Vercel frontend URL once deployed.

---

### C. Frontend — Vercel (Free)

1. Go to https://vercel.com → New Project
2. Import your GitHub repo → select the `frontend` folder
3. Framework Preset: **Next.js** (auto-detected)
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://oneservice-api.onrender.com/api`
   - `NEXT_PUBLIC_SOCKET_URL` = `https://oneservice-api.onrender.com`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = `AIza...`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = `your_name`
5. Deploy → you get `https://oneservice.vercel.app`

---

### D. Setup Stripe Webhooks (Important!)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-render-url.onrender.com/api/payments/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the **Signing Secret** → set `STRIPE_WEBHOOK_SECRET` in Render env vars

---

## 🔗 API Endpoints Quick Reference

### Auth
```
POST /api/auth/signup           Register user
POST /api/auth/verify-otp       Verify email OTP
POST /api/auth/login            Login
POST /api/auth/refresh          Refresh access token
POST /api/auth/logout           Logout
POST /api/auth/forgot-password  Send reset OTP
POST /api/auth/reset-password   Reset with OTP
```

### Services
```
GET    /api/services            List with filters
GET    /api/services/:id        Service detail
POST   /api/services            Create (vendor)
PATCH  /api/services/:id        Update (vendor)
DELETE /api/services/:id        Delete (vendor)
```

### Bookings
```
POST   /api/bookings            Create booking
GET    /api/bookings            My bookings
GET    /api/bookings/:id        Booking detail
PATCH  /api/bookings/:id/status Update status
GET    /api/bookings/:id/receipt Download PDF receipt
```

### Payments
```
POST   /api/payments/create-intent  Create Stripe intent
POST   /api/payments/webhook        Stripe webhook
POST   /api/payments/:id/refund     Request refund
GET    /api/payments/history        Payment history
```

### AI
```
POST   /api/ai/analyze-image        Analyze problem photo
POST   /api/ai/recommendations      AI vendor recommendations
POST   /api/ai/chat                 AI chat assistant
POST   /api/ai/price-negotiation    Price negotiation help
POST   /api/ai/analyze-review       Sentiment analysis
```

### Vendors
```
POST   /api/vendors/register        Vendor signup
GET    /api/vendors/me              My vendor profile
PATCH  /api/vendors/me              Update profile
PATCH  /api/vendors/me/live-location Update GPS location
GET    /api/vendors/nearby          Nearby vendors
GET    /api/vendors/:id             Vendor detail
```

### Admin
```
GET    /api/admin/stats             Dashboard analytics
GET    /api/admin/vendors           All vendors
PATCH  /api/admin/vendors/:id/approve  Approve/reject
GET    /api/admin/bookings          All bookings
GET    /api/admin/users             All users
PATCH  /api/admin/users/:id/toggle  Activate/suspend user
```

### Other
```
POST   /api/upload/image            Upload single image
POST   /api/upload/multiple         Upload multiple images
GET    /api/reviews/vendor/:id      Vendor reviews
POST   /api/reviews                 Create review
GET    /api/notifications           My notifications
GET    /api/chat/:bookingId         Chat history
POST   /api/chat/:bookingId         Send message
```

---

## 🔌 Socket.io Events

| Event (client → server)  | Description                          |
|--------------------------|--------------------------------------|
| `join_booking`           | Join a booking's chat room           |
| `send_message`           | Send a chat message                  |
| `typing` / `stop_typing` | Typing indicators                    |
| `update_location`        | Vendor sends live GPS location       |
| `vendor_status`          | Vendor goes online/offline           |
| `messages_read`          | Mark messages as read                |

| Event (server → client)  | Description                          |
|--------------------------|--------------------------------------|
| `new_booking`            | New booking for vendor               |
| `booking_status_update`  | Status change for user               |
| `new_message`            | New chat message in room             |
| `message_notification`   | Chat notification (outside room)     |
| `vendor_location_update` | Vendor GPS update for user           |
| `notification`           | Real-time notification               |
| `user_typing`            | Someone is typing                    |

---

## 🧪 Testing Tips

1. **Create accounts:**
   - Sign up as a **user** → verify OTP → book services
   - Sign up as a **vendor** → await admin approval
   - Update a user's role to **admin** in MongoDB

2. **Test payments:**
   - Use Stripe test card: `4242 4242 4242 4242`, any future date, any CVV

3. **Test AI image analysis:**
   - Upload any home damage photo (leak, broken wire, etc.)

4. **Test real-time chat:**
   - Open two browser windows, login as user and vendor

---

## 🛡️ Security Checklist

- [x] JWT access tokens (15 min expiry)
- [x] Refresh token rotation
- [x] bcrypt password hashing (12 rounds)
- [x] Rate limiting (200 req/15min global, 20 req/15min auth)
- [x] CORS configured
- [x] Helmet.js HTTP headers
- [x] Input validation (express-validator)
- [x] Role-based access control
- [x] Stripe webhook signature verification
- [x] File upload type and size restrictions

---

## 🐛 Common Issues & Fixes

**"MongoDB connection failed"**
→ Check your `MONGODB_URI`, make sure IP is whitelisted in Atlas

**"CORS error"**
→ Set `CLIENT_URL` in backend `.env` to match your exact frontend URL

**"Socket not connecting"**
→ Make sure `NEXT_PUBLIC_SOCKET_URL` matches your backend URL (no trailing slash)

**"Email not sending"**
→ Use Gmail App Password (not your regular password), enable 2FA first

**"Stripe webhook failing"**
→ Use `stripe listen --forward-to localhost:5000/api/payments/webhook` for local testing

---
## 🏆 Hackathon Journey

OneService was originally developed during **HackTheBeginning'26**, organized by **I.T.S. Engineering College** on **10–11 April 2026**.

Out of approximately **75 teams** selected for the screening round, our team secured a position among the **Top 15 finalists** and achieved **8th Rank Overall**. The team was also awarded a **Consolation Trophy** and **Participation Certificate** for the project.

### Team Members

* Rohit Raj
* Saksham Gupta
* Rishab Kumar

### Project Development

The initial prototype of OneService was created during the hackathon and has continued to evolve through additional development, testing, debugging, and feature enhancements.

### Acknowledgements

Special thanks to **Claude AI** for assisting with rapid prototyping, code generation, debugging support, and development guidance during the hackathon.

We also thank **I.T.S. Engineering College** for organizing HackTheBeginning'26 and providing a platform for innovation, collaboration, and learning.


## 📬 Support

OneService is built as a production starter. For issues, check the error logs carefully — every error returns a descriptive message. Happy building! 🚀
