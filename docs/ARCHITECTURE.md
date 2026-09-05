# ApexGrowth — System Architecture & Integration Blueprint

**Submission Track:** Track 1 — AI Growth & Agentic Commerce (Razorpay AI Buildathon 2026)  
**Product Concept:** Autonomous AI Revenue Recovery & Upsell Engine for Razorpay Merchants

---

## 1. Executive Summary

**ApexGrowth** is a B2B AI revenue-growth platform that operates on top of existing merchant commerce and payment systems (Razorpay, Shopify, WooCommerce, Headless Custom E-commerce). 

Instead of acting as an unconstrained chatbot, ApexGrowth implements a **governed agentic loop**:
$$\text{Ledger Ingestion} \longrightarrow \text{Deterministic RFM Analytics} \longrightarrow \text{Opportunity Discovery} \longrightarrow \text{AI Growth Strategy} \longrightarrow \text{Policy Boundary Verification} \longrightarrow \text{Human Approval Gating} \longrightarrow \text{Razorpay Link Execution} \longrightarrow \text{Actual ROI Attribution} \longrightarrow \text{SHA-256 Audit Trail}$$

```
+---------------------------------------------------------------------------------+
|                         MERCHANT COMMERCE & PAYMENTS                            |
|       Shopify (Catalog/Orders)  •  WooCommerce  •  Razorpay (Transactions)      |
+---------------------------------------------------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                            CONNECTOR & INGESTION LAYER                          |
|   RazorpayConnector (Live Test/Sandbox) • ShopifyConnector • WooCommerceConnector   |
+---------------------------------------------------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                       NORMALIZED BUSINESS DATA SCHEMA                           |
|       Merchants  •  Customers (RFM)  •  Orders  •  Payments (Ledger)            |
+---------------------------------------------------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                    DETERMINISTIC ANALYTICS & OPPORTUNITY ENGINE                 |
|       Revenue Surveillance  •  At-Risk Cohort Identification  •  AOV Scanners    |
+---------------------------------------------------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                              AI GROWTH AGENT                                    |
|   Cohort Grounding  •  Mathematical Financial Modeling  •  Structured Strategy  |
+---------------------------------------------------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                        DETERMINISTIC POLICY ENGINE                              |
|   Max Discount Cap (20%) • Audience Cap • Budget Cap • Anti-Fatigue Cooldown    |
+---------------------------------------------------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                         HUMAN APPROVAL STATE MACHINE                            |
|                 DRAFT -> PENDING_APPROVAL -> APPROVED / REJECTED                |
+---------------------------------------------------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                    CAMPAIGN EXECUTION & ATTRIBUTION ENGINE                      |
|       Dynamic Razorpay Payment Links  •  Webhooks  •  Lift & Realized ROI       |
+---------------------------------------------------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                      CRYPTOGRAPHIC AUDIT CHAIN (SHA-256)                        |
|       Tamper-Evident Ledger  •  Hash Chaining  •  Mathematical Integrity        |
+---------------------------------------------------------------------------------+
```

---

## 2. Ingestion & Connector Layer

Merchants do not change their existing e-commerce storefront or payment gateway. ApexGrowth connects via dedicated connectors:

### A. RazorpayConnector (`backend/app/services/razorpay_service.py` & `sandbox_service.py`)
* **Status:** **Fully Implemented & Connected** (Razorpay Test Mode API & Local Deterministic Sandbox).
* **Capabilities:**
  * Ingests payments, refunds, and payment link lifecycle events.
  * Dynamically creates personalized Razorpay payment links (`POST /v1/payment_links`) with expiration windows and bounded incentive discounts.
  * Ingests webhooks (`payment_link.paid`, `payment.failed`) with HMAC-SHA256 signature verification and deduplication.

### B. ShopifyConnector (Roadmap / Demo Connector)
* **Status:** **Architecture Defined** (Roadmap Phase).
* **Target Interface:** Shopify Admin GraphQL API & Webhooks (`orders/create`, `checkouts/abandon`).
* **Ingested Entities:** Product catalog, order ledger, abandoned checkout metadata.
* **Sync Mapping:** Maps Shopify `customer.total_spent` and `orders_count` into the unified `Customer` RFM profile.

### C. WooCommerceConnector (Roadmap / Demo Connector)
* **Status:** **Architecture Defined** (Roadmap Phase).
* **Target Interface:** WooCommerce REST API v3 (`/wp-json/wc/v3/orders`, `/wp-json/wc/v3/customers`).
* **Sync Mapping:** Pulls historical transactions and updates customer dormancy metrics.

### D. CustomStoreConnector
* **Status:** **Developer API Specification**.
* **Target Interface:** Direct REST API (`POST /api/v1/orders/ingest`) for headless custom Next.js/Laravel storefronts.

---

## 3. Normalized Business Data Model

All external connector streams normalize into an immutable local schema:

1. **Merchant:** `id`, `name`, `business_type`, `currency`, `settings`.
2. **Customer:** `id`, `merchant_id`, `name`, `email`, `total_spend`, `order_count`, `average_order_value`, `days_since_last_order`, `rfm_segment`, `churn_risk_score`, `last_incentive_sent_at`.
3. **Order:** `id`, `merchant_id`, `customer_id`, `amount`, `discount_amount`, `final_amount`, `status`, `campaign_id`.
4. **Payment:** `id`, `order_id`, `razorpay_payment_id`, `amount`, `status`, `method`, `fee`, `tax`.
5. **PolicyConfig:** `max_discount_percent`, `max_campaign_audience`, `max_budget_inr`, `cooldown_days_per_customer`, `require_manual_approval_above_inr`.
6. **Strategy:** `action_type`, `proposed_discount_percent`, `validity_hours`, `target_audience_count`, `estimated_gross_revenue`, `estimated_campaign_cost`, `estimated_net_lift`, `projected_roi`.
7. **Campaign & CampaignAction:** `status`, `execution_mode`, `budget_cap`, `actual_revenue_generated`, `actual_incentive_spent`, `net_revenue_lift`, `realized_roi`, `razorpay_payment_link_id`.
8. **AuditEvent:** `sequence_number`, `timestamp`, `actor_type`, `actor_id`, `action`, `summary`, `details`, `prev_hash`, `current_hash`.

---

## 4. Controlled Agentic Principles

1. **Zero Financial Hallucinations:** The LLM does not perform calculations. All projections (gross revenue, discount costs, net lift, ROI multiplier) and actual metrics are calculated deterministically by Python backend algorithms.
2. **Policy as Authoritative Gate:** The AI cannot execute any action without passing the deterministic Policy Engine (`policy_service.py`).
3. **Mandatory Human Signoff:** Any campaign with financial liability above the merchant's threshold (`require_manual_approval_above_inr`) requires explicit human approval before live payment links are generated.
4. **Pre-Execution Revalidation:** Even after human approval, the Policy Engine revalidates boundaries immediately before link dispatch. If policy settings changed in the interim, execution is safely halted and audited.
5. **Tamper-Evident SHA-256 Audit Trail:** Every lifecycle step is hash-chained:
   $$\text{Hash}_n = \text{SHA256}(\text{Seq}_n \parallel \text{Time}_n \parallel \text{Actor}_n \parallel \text{Action}_n \parallel \text{Details}_n \parallel \text{Hash}_{n-1})$$
