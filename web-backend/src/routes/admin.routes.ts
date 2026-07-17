import { Router } from 'express';

// Admin routes — see /admin/plan.md §5. Mount at /api/admin behind requireAuth + requireAdmin.
// NOT mounted in the app yet (skeleton). When implementing, wire AdminController and add:
//   router.use(requireAuth, requireAdmin);
//   router.get('/overview', AdminController.overview);
//   router.get('/users', AdminController.listUsers);
//   router.get('/users/:id', AdminController.getUser);
//   router.post('/users/:id/suspend', AdminController.suspendUser);
//   router.post('/users/:id/sessions/revoke', AdminController.revokeSessions);
//   router.delete('/users/:id', AdminController.deleteUser);
//   router.get('/logins', AdminController.logins);
//   router.get('/audit', AdminController.audit);
//   router.get('/payments', AdminController.listPayments);
//   router.post('/payments/:id/refund', AdminController.refund);
//   router.post('/subscriptions/:id/cancel', AdminController.cancelSubscription);
//   router.post('/subscriptions/:id/comp', AdminController.compPro);
//   router.get('/flags', AdminController.flags);
//   router.patch('/flags/:key', AdminController.setFlag);
//   router.post('/sync/:userId/retry', AdminController.retrySync);

const router = Router();

export default router;
