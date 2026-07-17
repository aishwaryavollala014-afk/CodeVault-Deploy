// Admin — payments & subscriptions (refund / cancel / comp). See /admin/plan.md §3.3 & §6.
// TODO: fetch GET /api/admin/payments ; transactions table + revenue dashboard; refund/cancel
// via provider API behind a typed confirm + reason (audited). Requires 2FA before enabling.
export default function AdminPaymentsPage() {
  return (
    <section>
      <h1 style={{ margin: 0 }}>Payments</h1>
      <p style={{ color: "#6b7280" }}>Transactions, refunds, cancellations, revenue. Not implemented — needs billing live (admin/plan.md §3.3 &amp; §6).</p>
    </section>
  );
}
