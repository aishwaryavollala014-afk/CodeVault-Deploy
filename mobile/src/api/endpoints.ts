import { web, git } from './client';

/* ---- Auth (web-backend /api/auth) ---- */
export const requestEmailLogin = (email: string) =>
  web.post('/auth/email', { email }).then((r) => r.data);

export const verifyEmailLogin = (token: string) =>
  web.post('/auth/email/verify', { token }).then((r) => r.data);

export const fetchMe = () => web.get('/auth/me').then((r) => r.data);

export const logout = () => web.post('/auth/logout').then((r) => r.data);

/* ---- Connections (web /api/platforms) ---- */
export const listConnections = () => web.get('/platforms').then((r) => r.data);
export const addConnection = (platform: string, username: string) =>
  web.post('/platforms/connect', { platform, username }).then((r) => r.data);
export const removeConnection = (platform: string) =>
  web.delete(`/platforms/${platform}`).then((r) => r.data);

/* ---- Stats (web /api/stats) ---- */
export const fetchStats = () => web.get('/stats').then((r) => r.data);

/* ---- Public profile (web /api/public/:handle) ---- */
export const fetchPublicProfile = (handle: string) =>
  web.get(`/public/${handle}`).then((r) => r.data);

/* ---- Settings (web /api/settings) ---- */
export const fetchSettings = () => web.get('/settings').then((r) => r.data);
export const updateSettings = (patch: any) =>
  web.patch('/settings', patch).then((r) => r.data);

/* ---- GitHub repos (web /api/github-repos) ---- */
export const fetchGithubRepos = () => web.get('/github-repos').then((r) => r.data);

/* ---- Notifications (web /api/notifications) ---- */
export const fetchNotifications = () =>
  web.get('/notifications').then((r) => r.data);
export const markAllNotificationsRead = () =>
  web.post('/notifications/read-all').then((r) => r.data);

/* ---- Social: follow + messages (web) ---- */
export const fetchFollowers = (handle: string) =>
  web.get(`/users/${handle}/followers`).then((r) => r.data);
export const fetchFollowing = (handle: string) =>
  web.get(`/users/${handle}/following`).then((r) => r.data);
export const followUser = (handle: string) =>
  web.post(`/users/${handle}/follow`).then((r) => r.data);
export const unfollowUser = (handle: string) =>
  web.delete(`/users/${handle}/follow`).then((r) => r.data);

export const listConversations = () => web.get('/messages').then((r) => r.data);
export const unreadMessageCount = () =>
  web.get('/messages/unread-count').then((r) => r.data);
export const getConversation = (handle: string) =>
  web.get(`/messages/${handle}`).then((r) => r.data);
export const sendMessage = (handle: string, body: string) =>
  web.post(`/messages/${handle}`, { body }).then((r) => r.data);

/* ---- Sync + repos + problems (git-service /api) ---- */
export const triggerSync = (connectionId?: string) =>
  git.post('/sync', connectionId ? { connectionId } : {}).then((r) => r.data);
export const fetchSyncStatus = () => git.get('/sync/status').then((r) => r.data);
export const fetchSyncActivity = () =>
  git.get('/sync/activity').then((r) => r.data);
export const fetchRepos = () => git.get('/repos').then((r) => r.data);
export const fetchProblems = () => git.get('/problems').then((r) => r.data);
