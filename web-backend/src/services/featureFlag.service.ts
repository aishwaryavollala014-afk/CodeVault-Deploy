// Feature flags / kill switches. See /admin/plan.md §3.4.
// Keys: "sync_enabled" (global sync on/off), "maintenance", "ai_enabled", per-platform toggles.
//
// TODO: implement get/set backed by the FeatureFlag table; cache in Redis; audit each toggle.

export const FeatureFlagService = {
  // get(key):            Promise<boolean>
  // set(key, enabled, actorId): Promise<void>   — audited
  // all():               Promise<FeatureFlag[]>
};
