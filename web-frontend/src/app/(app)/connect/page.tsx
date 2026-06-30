'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConnectPage() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState('leetcode');
  const [username, setUsername] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const platforms = [
    { id: 'leetcode', name: 'LeetCode', short: 'LC', class: 'lc', url: 'leetcode.com/u/…' },
    { id: 'codeforces', name: 'Codeforces', short: 'CF', class: 'cf', url: 'codeforces.com/profile/…' },
    { id: 'codechef', name: 'CodeChef', short: 'CC', class: 'cc', url: 'codechef.com/users/…' },
    { id: 'hackerrank', name: 'HackerRank', short: 'HR', class: 'hr', url: 'hackerrank.com/…' },
  ];

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const handleConnect = async (withSync: boolean) => {
    try {
      setIsSubmitting(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not logged in');

      // 1. Connect Platform
      const res = await fetch(`${API_URL}/platforms/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          username,
          sessionToken: withSync ? sessionToken : undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to connect platform');
      }

      // 2. Setup GitHub Repo (if sync enabled)
      if (withSync) {
        const repoRes = await fetch(`${API_URL}/github-repos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            platform: selectedPlatform,
            repoFullName: 'CodeVault-Solutions',
            visibility: 'public',
            folderConvention: 'number',
            defaultBranch: 'main'
          })
        });

        if (!repoRes.ok) {
          const data = await repoRes.json();
          throw new Error(data.error || 'Failed to setup repository mapping');
        }
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlatName = platforms.find(p => p.id === selectedPlatform)?.name || 'LeetCode';

  return (
    <div className="wrap" style={{ maxWidth: 680, margin: '40px auto', padding: '0 24px' }}>
      <div className="step-label" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--brand-d)', fontWeight: 700 }}>Step 1 of 2</div>
      <h1 style={{ fontSize: 26, letterSpacing: '-.02em', margin: '8px 0 6px' }}>Connect a platform</h1>
      <p className="sub" style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 24 }}>Pick a platform to add to your dashboard. Stats start instantly; code sync needs a one-time authorization.</p>

      <div className="panel">
        <div className="plats">
          {platforms.map(p => (
            <button
              key={p.id}
              className={`pcard ${selectedPlatform === p.id ? 'sel' : ''}`}
              type="button"
              onClick={() => setSelectedPlatform(p.id)}
            >
              <span className={`b ${p.class}`}>{p.short}</span>
              <div>
                <div className="nm">{p.name}</div>
                <div className="m">{p.url}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="field" style={{ marginTop: 20 }}>
          <label htmlFor="uname" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Your <span id="pname">{selectedPlatName}</span> username</label>
          <div className="inwrap">
            <span className="pfx">@</span>
            <input 
              id="uname" 
              type="text" 
              placeholder="gaurav" 
              autoComplete="off" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="field" style={{ marginTop: 20 }}>
          <label htmlFor="token" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Session Token (Optional, required for sync)</label>
          <div className="inwrap">
            <span className="pfx">🔑</span>
            <input 
              id="token" 
              type="password" 
              placeholder="e.g. LEETCODE_SESSION cookie" 
              autoComplete="off" 
              value={sessionToken}
              onChange={(e) => setSessionToken(e.target.value)}
            />
          </div>
        </div>

        {error && <p style={{ color: 'var(--brand-d)', fontSize: 13, marginTop: 12, fontWeight: 600 }}>{error}</p>}

        <div className="modes">
          <div className="mode">
            <div className="mt">Stats only <span className="tag free">no login</span></div>
            <div className="md">Pull public stats for your dashboard. Nothing is pushed to GitHub.</div>
            <button 
              type="button"
              disabled={isSubmitting}
              onClick={() => handleConnect(false)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, borderRadius: 10, border: '1px solid var(--border-2)', background: '#fff', padding: 11, cursor: 'pointer', color: 'var(--ink)' }}
            >
              {isSubmitting ? 'Connecting...' : 'Add for stats'}
            </button>
          </div>
          <div className="mode">
            <div className="mt">Stats + code sync <span className="tag auth">authorize once</span></div>
            <div className="md">Also push your accepted solutions to GitHub, organized by problem number.</div>
            <button 
              type="button"
              disabled={isSubmitting}
              onClick={() => handleConnect(true)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, borderRadius: 10, border: '1px solid var(--brand)', background: 'var(--brand)', padding: 11, cursor: 'pointer', color: '#fff' }}
            >
              {isSubmitting ? 'Syncing...' : 'Authorize & sync'}
            </button>
          </div>
        </div>
        <div className="note" style={{ fontSize: 12, color: 'var(--faint)', marginTop: 14, textAlign: 'center' }}>Your password is never shared with CodeVault.</div>
      </div>
    </div>
  );
}
