--
-- PostgreSQL database dump
--

\restrict MEh8S7DTP9ARE2o9IIEQwqVzTaywZwLZoeDbiouhpmwUhoRfqSJm1kz2W4JZplD

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditAction" AS ENUM (
    'login',
    'logout',
    'connect',
    'disconnect',
    'authorize',
    'token_refresh',
    'delete',
    'admin'
);


--
-- Name: Difficulty; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Difficulty" AS ENUM (
    'easy',
    'medium',
    'hard'
);


--
-- Name: FolderConvention; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FolderConvention" AS ENUM (
    'number',
    'difficulty',
    'topic'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'sync',
    'expiry',
    'badge',
    'repo',
    'system'
);


--
-- Name: OAuthProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OAuthProvider" AS ENUM (
    'github'
);


--
-- Name: PlanType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PlanType" AS ENUM (
    'free',
    'pro'
);


--
-- Name: PlatformType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PlatformType" AS ENUM (
    'leetcode',
    'codeforces',
    'codechef',
    'hackerrank'
);


--
-- Name: RepoVisibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RepoVisibility" AS ENUM (
    'public',
    'private'
);


--
-- Name: SyncStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SyncStatus" AS ENUM (
    'queued',
    'running',
    'success',
    'partial',
    'failed',
    'expired'
);


--
-- Name: SyncTrigger; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SyncTrigger" AS ENUM (
    'schedule',
    'manual'
);


--
-- Name: TokenStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TokenStatus" AS ENUM (
    'none',
    'active',
    'expired'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'user',
    'admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "userId" text,
    action public."AuditAction" NOT NULL,
    "targetType" text,
    "targetId" text,
    ip text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: auth_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "refreshTokenHash" text NOT NULL,
    "familyId" text NOT NULL,
    "userAgent" text,
    ip text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: connection_secrets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.connection_secrets (
    "connectionId" text NOT NULL,
    "tokenCipher" bytea NOT NULL,
    "tokenIv" bytea NOT NULL,
    "keyVersion" integer DEFAULT 1 NOT NULL,
    "rotatedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.connections (
    id text NOT NULL,
    "userId" text NOT NULL,
    platform public."PlatformType" NOT NULL,
    username text NOT NULL,
    "syncEnabled" boolean DEFAULT false NOT NULL,
    "tokenStatus" public."TokenStatus" DEFAULT 'none'::public."TokenStatus" NOT NULL,
    "tokenExpiresAt" timestamp(3) without time zone,
    "solvedCount" integer DEFAULT 0 NOT NULL,
    "lastSyncedAt" timestamp(3) without time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    CONSTRAINT chk_solved_count_nonneg CHECK (("solvedCount" >= 0))
);


--
-- Name: github_repos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.github_repos (
    id text NOT NULL,
    "userId" text NOT NULL,
    platform public."PlatformType" NOT NULL,
    "repoFullName" text NOT NULL,
    visibility public."RepoVisibility" DEFAULT 'public'::public."RepoVisibility" NOT NULL,
    "folderConvention" public."FolderConvention" DEFAULT 'number'::public."FolderConvention" NOT NULL,
    "defaultBranch" text DEFAULT 'main'::text NOT NULL,
    "fileCount" integer DEFAULT 0 NOT NULL,
    "lastSyncAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT chk_file_count_nonneg CHECK (("fileCount" >= 0))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    body text,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: oauth_identities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_identities (
    id text NOT NULL,
    "userId" text NOT NULL,
    provider public."OAuthProvider" DEFAULT 'github'::public."OAuthProvider" NOT NULL,
    "providerUserId" text NOT NULL,
    "accessTokenCipher" bytea NOT NULL,
    "tokenIv" bytea NOT NULL,
    "keyVersion" integer DEFAULT 1 NOT NULL,
    scopes text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: problems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.problems (
    id text NOT NULL,
    "userId" text NOT NULL,
    "connectionId" text NOT NULL,
    platform public."PlatformType" NOT NULL,
    number text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    difficulty public."Difficulty",
    topics text[],
    language text,
    "solutionPath" text,
    "solvedAt" timestamp(3) without time zone,
    "syncedToGit" boolean DEFAULT false NOT NULL,
    "syncedAt" timestamp(3) without time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: stats_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stats_snapshots (
    id text NOT NULL,
    "userId" text NOT NULL,
    platform public."PlatformType" NOT NULL,
    payload jsonb NOT NULL,
    "fetchedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: sync_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_runs (
    id text NOT NULL,
    "userId" text NOT NULL,
    "connectionId" text NOT NULL,
    status public."SyncStatus" DEFAULT 'queued'::public."SyncStatus" NOT NULL,
    trigger public."SyncTrigger" DEFAULT 'schedule'::public."SyncTrigger" NOT NULL,
    "itemsFetched" integer DEFAULT 0 NOT NULL,
    "itemsPushed" integer DEFAULT 0 NOT NULL,
    "errorCode" text,
    "startedAt" timestamp(3) without time zone,
    "finishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_items_pushed_le_fetched CHECK (("itemsPushed" <= "itemsFetched"))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    "githubLogin" text NOT NULL,
    handle text NOT NULL,
    "displayName" text,
    email text,
    "avatarUrl" text,
    role public."UserRole" DEFAULT 'user'::public."UserRole" NOT NULL,
    plan public."PlanType" DEFAULT 'free'::public."PlanType" NOT NULL,
    "publicProfileEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_sessions auth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);


--
-- Name: connection_secrets connection_secrets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connection_secrets
    ADD CONSTRAINT connection_secrets_pkey PRIMARY KEY ("connectionId");


--
-- Name: connections connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_pkey PRIMARY KEY (id);


--
-- Name: github_repos github_repos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.github_repos
    ADD CONSTRAINT github_repos_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: oauth_identities oauth_identities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_identities
    ADD CONSTRAINT oauth_identities_pkey PRIMARY KEY (id);


--
-- Name: problems problems_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problems
    ADD CONSTRAINT problems_pkey PRIMARY KEY (id);


--
-- Name: stats_snapshots stats_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stats_snapshots
    ADD CONSTRAINT stats_snapshots_pkey PRIMARY KEY (id);


--
-- Name: sync_runs sync_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_runs
    ADD CONSTRAINT sync_runs_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_userId_createdAt_idx" ON public.audit_logs USING btree ("userId", "createdAt");


--
-- Name: auth_sessions_refreshTokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "auth_sessions_refreshTokenHash_key" ON public.auth_sessions USING btree ("refreshTokenHash");


--
-- Name: auth_sessions_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "auth_sessions_userId_idx" ON public.auth_sessions USING btree ("userId");


--
-- Name: connections_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "connections_userId_idx" ON public.connections USING btree ("userId");


--
-- Name: connections_userId_platform_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "connections_userId_platform_key" ON public.connections USING btree ("userId", platform);


--
-- Name: github_repos_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "github_repos_userId_idx" ON public.github_repos USING btree ("userId");


--
-- Name: github_repos_userId_platform_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "github_repos_userId_platform_key" ON public.github_repos USING btree ("userId", platform);


--
-- Name: idx_notifications_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_unread ON public.notifications USING btree ("userId") WHERE ("readAt" IS NULL);


--
-- Name: idx_problems_topics_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_problems_topics_gin ON public.problems USING gin (topics);


--
-- Name: notifications_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notifications_userId_createdAt_idx" ON public.notifications USING btree ("userId", "createdAt");


--
-- Name: notifications_userId_readAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notifications_userId_readAt_idx" ON public.notifications USING btree ("userId", "readAt");


--
-- Name: oauth_identities_provider_providerUserId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "oauth_identities_provider_providerUserId_key" ON public.oauth_identities USING btree (provider, "providerUserId");


--
-- Name: oauth_identities_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauth_identities_userId_idx" ON public.oauth_identities USING btree ("userId");


--
-- Name: problems_connectionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "problems_connectionId_idx" ON public.problems USING btree ("connectionId");


--
-- Name: problems_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "problems_userId_idx" ON public.problems USING btree ("userId");


--
-- Name: problems_userId_platform_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "problems_userId_platform_slug_key" ON public.problems USING btree ("userId", platform, slug);


--
-- Name: stats_snapshots_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stats_snapshots_userId_idx" ON public.stats_snapshots USING btree ("userId");


--
-- Name: stats_snapshots_userId_platform_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "stats_snapshots_userId_platform_key" ON public.stats_snapshots USING btree ("userId", platform);


--
-- Name: sync_runs_connectionId_startedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sync_runs_connectionId_startedAt_idx" ON public.sync_runs USING btree ("connectionId", "startedAt");


--
-- Name: sync_runs_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sync_runs_userId_idx" ON public.sync_runs USING btree ("userId");


--
-- Name: users_githubLogin_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "users_githubLogin_key" ON public.users USING btree ("githubLogin");


--
-- Name: users_handle_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_handle_key ON public.users USING btree (handle);


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: auth_sessions auth_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: connection_secrets connection_secrets_connectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connection_secrets
    ADD CONSTRAINT "connection_secrets_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES public.connections(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: connections connections_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT "connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: github_repos github_repos_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.github_repos
    ADD CONSTRAINT "github_repos_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: oauth_identities oauth_identities_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_identities
    ADD CONSTRAINT "oauth_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: problems problems_connectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problems
    ADD CONSTRAINT "problems_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES public.connections(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: problems problems_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problems
    ADD CONSTRAINT "problems_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stats_snapshots stats_snapshots_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stats_snapshots
    ADD CONSTRAINT "stats_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sync_runs sync_runs_connectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_runs
    ADD CONSTRAINT "sync_runs_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES public.connections(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sync_runs sync_runs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_runs
    ADD CONSTRAINT "sync_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict MEh8S7DTP9ARE2o9IIEQwqVzTaywZwLZoeDbiouhpmwUhoRfqSJm1kz2W4JZplD

