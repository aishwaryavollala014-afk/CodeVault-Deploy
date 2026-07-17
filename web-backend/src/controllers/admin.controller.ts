// HTTP handlers for /api/admin/* — see /admin/plan.md §5. Thin controllers that delegate to
// AdminService / PaymentService / FeatureFlagService and rely on requireAdmin for access.
//
// TODO: implement. All mutating handlers must require a confirm token + reason and be audited.

export const AdminController = {
  // overview(req, res)
  // listUsers(req, res)          getUser(req, res)
  // suspendUser(req, res)        revokeSessions(req, res)   deleteUser(req, res)
  // logins(req, res)             audit(req, res)
  // listPayments(req, res)       refund(req, res)           cancelSubscription(req, res)   compPro(req, res)
  // flags(req, res)              setFlag(req, res)
  // retrySync(req, res)
};
