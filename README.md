# # 🚀 ApexGrowth

### AI-Powered Revenue Recovery & Growth Assistant for Merchants

ApexGrowth is an AI-powered revenue recovery platform that helps merchants identify customers who are likely to churn, discover high-value revenue opportunities, and execute targeted recovery campaigns through Razorpay payment links.

Instead of waiting for customers to leave permanently, ApexGrowth continuously analyzes customer behavior and turns customer inactivity into actionable revenue opportunities.

---

## 🎯 Problem

Small and growing businesses often have valuable customer data but struggle to answer:

- Which customers are about to churn?
- Which inactive customers are worth winning back?
- How much revenue could be recovered?
- What offer should be given?
- Did a campaign actually generate revenue?
- Can every financial event be verified?

Traditional dashboards show what happened.

**ApexGrowth focuses on what the merchant should do next.**

---

## 💡 Solution

ApexGrowth combines customer intelligence, revenue opportunity discovery, campaign execution, payment attribution, and auditability into one platform.

### Core Flow

```text
Customer Payment Data
        ↓
Customer Intelligence
        ↓
RFM Segmentation
        ↓
Churn / At-Risk Detection
        ↓
Revenue Opportunity Discovery
        ↓
Policy & Safety Guardrails
        ↓
Targeted Recovery Campaign
        ↓
Razorpay Payment Link
        ↓
Payment / Webhook
        ↓
Revenue Attribution
        ↓
Cryptographic Audit Trail


✨ Key Features
1. 🔐 Merchant Authentication

ApexGrowth provides a complete SaaS authentication flow.

Merchant registration
Email/password login
Secure password hashing using PBKDF2-HMAC-SHA256
JWT/session authentication
Protected dashboard routes
Persistent authentication
Logout functionality
Merchant-specific workspaces
2. 🏪 Merchant Onboarding

New merchants are guided through a structured onboarding experience:

Account
   ↓
Business Setup
   ↓
Connect Business Tools
   ↓
Connect Razorpay
   ↓
Data Synchronization
   ↓
Ready

Merchants can configure:

Business/store name
Business category
Website
Currency
Razorpay integration
3. 💳 Razorpay Integration

ApexGrowth integrates with Razorpay to connect revenue recovery campaigns with payment collection.

The system supports:

Razorpay Test Mode
Payment link generation
Payment simulation
Webhook processing
Idempotency protection
Successful payment attribution
Failed payment handling

All demo payment operations use a safe test/sandbox environment.

4. 🧠 RFM Customer Intelligence

ApexGrowth analyzes customer behavior using RFM-style segmentation:

Recency — How recently the customer purchased
Frequency — How frequently the customer purchases
Monetary Value — How much the customer has spent

This allows the system to identify customers who require attention and prioritize high-value recovery opportunities.

5. 📈 Revenue Opportunity Discovery

The platform automatically identifies actionable revenue opportunities.

Example:

High-Value Inactive Customer Winback

For the demo merchant:

Total Customers: 220
Customers Needing Attention: 87
Target Opportunity Cohort: 42
Potential Sales: ₹36,641.55
Estimated Offer Cost: ₹5,496.23
Potential Net Gain: ₹31,145.32
Expected Return: 6.67x

The system converts these numbers into an actionable recovery campaign.

6. 🛡️ Policy & Safety Guardrails

ApexGrowth does not blindly send offers to every customer.

The campaign engine applies predefined policy guardrails before allowing a recovery action.

This helps prevent:

Excessive discounts
Invalid campaign targeting
Unsafe offers
Incorrect revenue calculations
Duplicate processing
7. 🎯 Campaign Execution

Merchants can turn identified opportunities into recovery campaigns.

Campaign workflow:

Opportunity
    ↓
Select Target Customers
    ↓
Apply Policy Rules
    ↓
Generate Payment Links
    ↓
Customer Payment
    ↓
Webhook
    ↓
Revenue Attribution

For the demo opportunity, the system successfully generated payment links for the targeted customer cohort.

8. 💰 Revenue Attribution

ApexGrowth separates:

Projected Revenue

Revenue that could potentially be recovered.

Actual Revenue

Revenue that was actually generated through successful payments.

Actual revenue is updated only after successful payment confirmation.

This prevents projected revenue from being incorrectly reported as realized revenue.

9. 🔁 Webhook Idempotency

The payment processing system protects against duplicate webhook events.

Example:

Payment SUCCESS
      ↓
Revenue attributed

Same webhook again
      ↓
Already processed
      ↓
₹0 additional revenue

This prevents duplicate payments from inflating merchant revenue metrics.

10. 🔐 Cryptographic Audit Trail

ApexGrowth maintains a cryptographically verifiable audit chain using SHA-256 hashing / Merkle-style chaining.

Important financial events can be verified through the audit system.

Example:

Event 1
  ↓ SHA-256
Event 2
  ↓ SHA-256
Event 3
  ↓ SHA-256
Event 4
  ↓
Audit Chain

The demo environment successfully verifies the audit chain without errors.

🖥️ Dashboard

ApexGrowth provides a fintech-style merchant dashboard containing:

Overview
Opportunities
Campaigns
Customers
Analytics
Connected Stores
Activity History
Safety Rules

The dashboard is designed to move the merchant from:

Data → Insight → Decision → Action → Revenue

🧪 Demo Merchant

ApexGrowth includes a ready-to-use demo merchant:

Artisan Roasters Co.

The demo allows judges to immediately experience the complete platform without creating an account.

Demo Flow
Login Page
    ↓
Explore Artisan Roasters Demo
    ↓
Merchant Dashboard
    ↓
Customer Intelligence
    ↓
Revenue Opportunity
    ↓
Campaign
    ↓
Razorpay Payment Simulation
    ↓
Revenue Attribution
    ↓
Audit Verification

This makes the project easy to evaluate during a live demonstration.

📊 Verified Demo Metrics
Metric	Verified Value
Total Customers	220
Customers Needing Attention	87
Target Opportunity Cohort	42
Potential Sales (Gross)	₹36,641.55
Estimated Offer Cost	₹5,496.23
Potential Net Gain	₹31,145.32
Expected Return	6.67x
🏗️ Architecture
┌──────────────────────────────────────────┐
│              ApexGrowth                  │
├──────────────────────────────────────────┤
│                                          │
│          React Frontend                  │
│                 │                        │
│                 ▼                        │
│          FastAPI Backend                 │
│                 │                        │
│       ┌─────────┼─────────┐              │
│       ▼         ▼         ▼              │
│   Customer    Campaign   Payment         │
│ Intelligence  Engine     Engine          │
│       │         │         │              │
│       ▼         ▼         ▼              │
│      RFM     Guardrails  Razorpay        │
│       │                   │              │
│       └─────────┬─────────┘              │
│                 ▼                        │
│        Revenue Attribution              │
│                 │                        │
│                 ▼                        │
│       Cryptographic Audit Chain          │
│                                          │
└──────────────────────────────────────────┘
🛠️ Technology Stack
Frontend
React
TypeScript
Vite
Modern responsive SaaS UI
Backend
Python
FastAPI
REST APIs
JWT/session authentication
Data & Intelligence
Customer RFM segmentation
Revenue opportunity discovery
Campaign decision engine
Policy guardrails
Payments
Razorpay
Razorpay Test Mode
Payment Links
Webhooks
Idempotency handling
Security & Audit
PBKDF2-HMAC-SHA256 password hashing
Authentication middleware
Merchant data isolation
SHA-256 cryptographic audit chaining
Testing
Pytest
Automated backend tests
Frontend production build verification
📁 Project Structure
ApexGrowth/
│
├── backend/
│   └── app/
│       ├── agents/
│       ├── ai/
│       ├── api/
│       ├── db/
│       ├── models/
│       ├── services/
│       ├── tools/
│       ├── config.py
│       └── main.py
│
├── frontend/
│   └── src/
│
├── tests/
│   ├── test_auth_and_onboarding.py
│   ├── test_campaign_execution.py
│   ├── test_failure_scenarios.py
│   ├── test_growth_agent.py
│   ├── test_payment_simulation.py
│   ├── test_policy_engine.py
│   ├── test_revenue_attribution.py
│   ├── test_seed.py
│   └── test_webhooks_idempotency.py
│
├── data/
├── docs/
├── .env.example
├── .gitignore
├── pytest.ini
├── requirements.txt
└── README.md
🚀 Running Locally
1. Clone the repository
git clone https://github.com/Vaibhav-7043/ApexGrowth.git
cd ApexGrowth
2. Backend Setup

Create and activate a Python virtual environment.

Windows
python -m venv .venv
.venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt
3. Configure Environment Variables

Create a .env file using .env.example.

Do not commit real API keys or secrets to GitHub.
4. Start Backend
uvicorn backend.app.main:app --reload
5. Start Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Then open the local frontend URL shown by Vite.

🧪 Testing

Run the complete backend test suite:

pytest tests/ -v

Current verification:

38/38 tests passed
100% passing
🏗️ Production Build Verification

Frontend production build:

cd frontend
npm run build

Verified build:

Build completed successfully
0 errors
🔒 Security Notes

ApexGrowth follows several security principles:

Passwords are never stored as plaintext.
Authentication-protected APIs reject unauthenticated requests.
Merchant workspaces are isolated.
Razorpay credentials should be stored through environment variables.
.env files are excluded from Git.
Duplicate webhook events are rejected.
Financial attribution occurs only after successful payment confirmation.
Audit events are cryptographically chained.

Never commit real Razorpay API keys, secrets, passwords, or production credentials to this repository.

🧑‍💻 Development Philosophy

ApexGrowth is designed around one core principle:

Don't just tell merchants what happened. Tell them where the next revenue opportunity is — and help them act on it safely.

The system connects:

Customer Intelligence
        +
Revenue Intelligence
        +
AI/Decision Engine
        +
Razorpay Payments
        +
Financial Attribution
        +
Auditability

into a single merchant growth workflow.

🎬 Judge Demo

For the fastest evaluation:

Open the ApexGrowth application.
Select Explore Artisan Roasters Demo.
Review the customer intelligence dashboard.
Open the revenue opportunity.
Execute the recovery campaign.
Use the payment simulator.
Observe revenue attribution.
Verify the audit chain.
Log out.
Create a new merchant account to experience the onboarding flow.
📌 Project Status
✅ Completed
Merchant authentication
Merchant registration
Merchant onboarding
Demo merchant
Merchant data isolation
RFM customer segmentation
Revenue opportunity discovery
Campaign execution
Razorpay Test Mode
Payment link generation
Webhook processing
Webhook idempotency
Revenue attribution
Policy guardrails
Cryptographic audit chain
Merchant dashboard
Automated testing
Production build verification
👥 Team

ApexGrowth

Built for the Razorpay AI Buildathon

Track: AI Growth & Agentic Commerce

📄 License

This project is developed as a hackathon/buildathon project.


### Now on GitHub

You are currently on the **Edit README** page shown in your screenshot.

1. Click inside the large editor where it currently says `# ApexGrowth`.
2. Press **Ctrl + A**.
3. Paste the entire README above.
4. Click **Preview** and check how it looks.
5. If everything looks good, click **Commit changes...**
6. Use a commit message such as:

```text
Improve README for Razorpay Buildathon
