// Payments & subscriptions. See /admin/plan.md §3.3 + §6.
//
// Provider-authoritative: refund/cancel call the provider API (Razorpay for India, Stripe for
// global) and reconcile via webhook. CodeVault stores only provider refs + status — NEVER raw
// card data (PCI). This service is the controlled trigger + ledger, not the source of truth.
//
// TODO: implement provider clients + webhook handlers + these methods (all audited).

export const PaymentService = {
  // listPayments(query):            Promise<PagedPayments>
  // refund(paymentId, amount?, r):  Promise<void>   — provider API, partial/full
  // cancelSubscription(id, reason): Promise<void>   — provider API
  // compPro(userId, plan, note):    Promise<void>   — grant/extend Pro
  // handleWebhook(evt):             Promise<void>   — write Payment/Subscription rows
  // revenue():                      Promise<RevenueSummary> — MRR/ARR, churn, by plan/geo
};
