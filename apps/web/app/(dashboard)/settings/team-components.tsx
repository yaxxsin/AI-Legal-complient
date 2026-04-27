'use client';
import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-user';

export function TeamTab() {
  const { data: user } = useCurrentUser();
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [errorText, setErrorText] = useState('');

  const fetchTeams = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';
      const res = await fetch(`${apiUrl}/teams`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        if (data.length > 0 && !selectedTeamId) {
          setSelectedTeamId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';
      const res = await fetch(`${apiUrl}/teams`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName })
      });
      if (res.ok) {
        setNewTeamName('');
        fetchTeams();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setInviteLink('');
    if (!selectedTeamId || !inviteEmail) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';
      const res = await fetch(`${apiUrl}/teams/${selectedTeamId}/invitations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      
      const resText = await res.text();
      if (res.ok) {
        const data = JSON.parse(resText);
        setInviteLink(`${window.location.origin}${data.link}`);
        setInviteEmail('');
        fetchTeams(); // refresh invites list
      } else {
        const err = JSON.parse(resText);
        setErrorText(err.message || 'Gagal mengundang');
      }
    } catch (e) {
      setErrorText('Terjadi kesalahan koneksi');
    }
  };

  const handleRemoveMember = async (teamId: string, userIdTarget: string) => {
    if (!confirm('Hapus anggota ini dari tim?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';
      const res = await fetch(`${apiUrl}/teams/${teamId}/members/${userIdTarget}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) fetchTeams();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) return <div>Memuat data ruang kerja tim...</div>;

  const currentTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <div className="space-y-6">
      {/* Create Team Form */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-1">Ruang Kerja Tim</h2>
        <p className="text-sm text-muted-foreground mb-6">Kelola kolaborasi tim untuk bisnis ini.</p>
        
        {teams.length === 0 ? (
          <form onSubmit={handleCreateTeam} className="flex gap-3 mt-4">
            <input 
              type="text" 
              placeholder="Nama Tim Baru" 
              className="flex-1 h-11 bg-background border border-input rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
            />
            <button type="submit" className="px-6 h-11 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90">
              Buat Tim
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-border pb-4 overflow-x-auto">
              {teams.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    selectedTeamId === t.id ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted/50 border border-transparent hover:bg-muted'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {currentTeam && (
              <div className="space-y-6 animate-fade-in">
                {/* Member List */}
                <div>
                  <h3 className="font-medium mb-3">Anggota Tim ({currentTeam.members?.length || 0})</h3>
                  <div className="space-y-2">
                    {currentTeam.members?.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                            {m.user?.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-none">{m.user?.fullName} {m.userId === user?.id && '(Anda)'}</p>
                            <p className="text-xs text-muted-foreground mt-1">{m.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-muted uppercase tracking-wider">{m.role}</span>
                          {currentTeam.ownerId !== m.userId && (
                            <button onClick={() => handleRemoveMember(currentTeam.id, m.userId)} className="text-xs text-destructive hover:underline">Hapus</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite Section */}
                {currentTeam.ownerId === user?.id && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-medium mb-3">Undang Anggota Baru</h3>
                    <form onSubmit={handleInvite} className="flex gap-3 items-start flex-col md:flex-row">
                      <input 
                        type="email" placeholder="Alamat Email" required
                        className="w-full md:flex-1 h-11 bg-background border border-input rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      />
                      <select 
                        className="w-full md:w-32 h-11 bg-background border border-input rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button type="submit" className="w-full md:w-auto px-6 h-11 bg-foreground text-background font-semibold rounded-xl text-sm hover:bg-foreground/90">
                        Undang
                      </button>
                    </form>
                    
                    {errorText && <p className="text-destructive text-sm mt-3">{errorText}</p>}
                    
                    {inviteLink && (
                      <div className="mt-4 p-3 rounded-lg border border-success/30 bg-success/10 flex flex-col gap-2">
                        <p className="text-xs text-success font-medium">Link undangan berhasil dibuat (simulasi):</p>
                        <code className="text-xs p-2 bg-background rounded border select-all overflow-x-auto">{inviteLink}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
