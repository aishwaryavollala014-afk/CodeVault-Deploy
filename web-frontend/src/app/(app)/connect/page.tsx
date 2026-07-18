'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlatformChip } from '@/components/PlatformChip';
import { apiFetch } from "@/utils/api";

interface ExistingConnection {
  platform: string;
  username: string;
  syncEnabled: boolean;
  tokenStatus: string;
}

export default function ConnectPage() {
  const router = useRouter();
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [usernames, setUsernames] = useState<Record<string, string>>({
    leetcode: '',
    codeforces: '',
    codechef: '',
    hackerrank: '',
  });

  const [existingConnections, setExistingConnections] = useState<ExistingConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const platforms = [
    { id: 'leetcode', name: 'LeetCode', url: 'leetcode.com/u/…' },
    { id: 'codeforces', name: 'Codeforces', url: 'codeforces.com/profile/…' },
    { id: 'codechef', name: 'CodeChef', url: 'codechef.com/users/…' },
    { id: 'hackerrank', name: 'HackerRank', url: 'hackerrank.com/…' },
  ];

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  // Load existing connections on mount
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await apiFetch(`${API_URL}/platforms`, {
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          const connections: ExistingConnection[] = data.connections || data || [];
          setExistingConnections(connections);
        }
      } catch (err) {
        console.error('Failed to load existing connections', err);
      } finally {
        setIsLoadingConnections(false);
      }
    };

    fetchConnections();
  }, [router, API_URL]);

  const connectedPlatformIds = new Set(existingConnections.map(c => c.platform));

  // Only show unconnected platforms for new connections
  const unconnectedPlatforms = platforms.filter(p => !connectedPlatformIds.has(p.id));

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConnect = async () => {
    if (selectedPlatforms.size === 0) {
      setError('Please select at least one platform.');
      return;
    }

    // Validate all selected platforms have a username
    for (const platformId of selectedPlatforms) {
      if (!usernames[platformId]?.trim()) {
        const name = platforms.find(p => p.id === platformId)?.name;
        setError(`Please enter your ${name} username.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      const results = [];

      for (const platform of selectedPlatforms) {
        const res = await apiFetch(`${API_URL}/platforms/connect`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platform,
            username: usernames[platform].trim()
          })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to connect ${platform}`);
        }

        results.push(platform);
      }

      setSuccess(`Connected ${results.length} platform${results.length > 1 ? 's' : ''}! Redirecting to dashboard...`);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${platforms.find(p => p.id === platform)?.name}? You can always reconnect later.`)) return;
    
    try {
      setDisconnecting(platform);

      const res = await apiFetch(`${API_URL}/platforms/${platform}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to disconnect');

      // Remove from existing connections
      setExistingConnections(prev => prev.filter(c => c.platform !== platform));
      setSuccess(`${platforms.find(p => p.id === platform)?.name} disconnected.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDisconnecting(null);
    }
  };

  if (isLoadingConnections) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--faint)' }}>Loading your connections...</div>;
  }

  return (
    <div style={{ maxWidth: 680, margin: '40px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 26, letterSpacing: '-.02em', margin: '8px 0 6px' }}>Connect your platforms</h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 24 }}>
        Link your competitive-programming profiles. We pull your public stats instantly — no passwords needed.
      </p>

      {/* ─── EXISTING CONNECTIONS ─── */}
      {existingConnections.length > 0 && (
        <div className="panel" style={{ marginBottom: 24 }}>
          <h2 className="h" style={{ marginBottom: 16 }}>
            <svg className="ico sm" aria-hidden="true"><use href="#ic-check"/></svg>
            Connected platforms
          </h2>

          {existingConnections.map(conn => {
            const p = platforms.find(pl => pl.id === conn.platform);
            if (!p) return null;

            return (
              <div
                key={conn.platform}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  border: '1px solid var(--border-2)',
                  borderRadius: 12,
                  background: 'var(--paper)',
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <PlatformChip platformId={conn.platform} size="md" showName={false} variant="ghost" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>@{conn.username}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'rgba(26, 162, 96, 0.1)',
                    color: '#1aa260',
                  }}>
                    Connected
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDisconnect(conn.platform)}
                    disabled={disconnecting === conn.platform}
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      background: 'none',
                      border: '1px solid var(--border-2)',
                      borderRadius: 8,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {disconnecting === conn.platform ? '...' : 'Disconnect'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ADD NEW CONNECTIONS ─── */}
      {unconnectedPlatforms.length > 0 ? (
        <div className="panel">
          <h2 className="h" style={{ marginBottom: 16 }}>
            {existingConnections.length > 0 ? 'Add more platforms' : 'Select platforms to connect'}
          </h2>

          {/* Platform selector cards */}
          <div className="plats">
            {unconnectedPlatforms.map(p => (
              <button
                key={p.id}
                className={`pcard ${selectedPlatforms.has(p.id) ? 'sel' : ''}`}
                type="button"
                onClick={() => togglePlatform(p.id)}
              >
                <PlatformChip platformId={p.id} size="lg" showName={false} variant="ghost" />
                <div>
                  <div className="nm">{p.name}</div>
                  <div className="m">{p.url}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Username inputs for each selected platform */}
          {Array.from(selectedPlatforms).map(platformId => {
            const p = platforms.find(p => p.id === platformId)!;
            return (
              <div key={p.id} style={{ marginTop: 20, padding: 16, border: '1px solid var(--border-2)', borderRadius: 12, background: 'var(--paper)' }}>
                <label htmlFor={`uname-${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  <PlatformChip platformId={p.id} size="sm" showName={false} variant="ghost" />
                  Your {p.name} username
                </label>
                <div className="inwrap">
                  <span className="pfx">@</span>
                  <input 
                    id={`uname-${p.id}`}
                    type="text" 
                    placeholder="e.g. gaurav"
                    autoComplete="off" 
                    value={usernames[p.id]}
                    onChange={(e) => setUsernames(prev => ({ ...prev, [p.id]: e.target.value }))}
                  />
                </div>
              </div>
            );
          })}

          {selectedPlatforms.size === 0 && (
            <div style={{ marginTop: 20, padding: 16, textAlign: 'center', color: 'var(--faint)', border: '1px dashed var(--border-2)', borderRadius: 12, fontSize: 14 }}>
              Select a platform above to connect it.
            </div>
          )}

          {/* Error / Success messages */}
          {error && <p style={{ color: 'var(--brand-d)', fontSize: 13, marginTop: 16, fontWeight: 600 }}>{error}</p>}
          {success && <p style={{ color: '#1aa260', fontSize: 13, marginTop: 16, fontWeight: 600 }}>{success}</p>}

          {/* Connect button */}
          {selectedPlatforms.size > 0 && (
            <button 
              type="button"
              disabled={isSubmitting}
              onClick={handleConnect}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 24, 
                width: '100%',
                padding: '14px 20px',
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'inherit',
                color: '#fff',
                background: 'var(--brand)',
                border: '2px solid var(--brand)',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? '⏳ Connecting...' : `Connect ${selectedPlatforms.size} platform${selectedPlatforms.size !== 1 ? 's' : ''}`}
            </button>
          )}
          <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 12, textAlign: 'center' }}>We only pull your public stats. No passwords or tokens needed.</div>
        </div>
      ) : (
        /* All 4 platforms connected */
        <div className="panel" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>All platforms connected!</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
            Your stats are being pulled from all 4 platforms.
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '12px 28px',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'inherit',
              color: '#fff',
              background: 'var(--brand)',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            Go to Dashboard →
          </button>
        </div>
      )}

      {/* Messages shown outside panels */}
      {error && unconnectedPlatforms.length === 0 && <p style={{ color: 'var(--brand-d)', fontSize: 13, marginTop: 16, fontWeight: 600, textAlign: 'center' }}>{error}</p>}
      {success && unconnectedPlatforms.length === 0 && <p style={{ color: '#1aa260', fontSize: 13, marginTop: 16, fontWeight: 600, textAlign: 'center' }}>{success}</p>}
    </div>
  );
}
