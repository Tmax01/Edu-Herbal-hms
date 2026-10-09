import { DepartmentGuide } from '../../components/ui/DepartmentGuide';
import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useUsers } from '../../hooks/useUsers';
import { Role } from '../../types';
import { chatChannels } from '../../constants/system';
import { ChatMessage } from '../../types/communication';
import { useAuth } from '../../contexts/AuthContext';


const roleColors: Record<Role, string> = {
  cto: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  doctor: 'bg-teal-100 text-teal-700',
  nurse: 'bg-pink-100 text-pink-700',
  pharmacist: 'bg-amber-100 text-amber-700',
  lab_tech: 'bg-indigo-100 text-indigo-700',
  receptionist: 'bg-slate-100 text-slate-700',
  accountant: 'bg-green-100 text-green-700',
  call_centre: 'bg-orange-100 text-orange-700',
  store_officer: 'bg-cyan-100 text-cyan-700',
  hr: 'bg-emerald-100 text-emerald-700',
};

const roleShort: Record<Role, string> = {
  cto: 'CTO', admin: 'Admin', doctor: 'Doctor', nurse: 'Nurse',
  pharmacist: 'Pharmacist', lab_tech: 'Lab', receptionist: 'Reception',
  accountant: 'Accounts', call_centre: 'Call Ctr', store_officer: 'Stores',
  hr: 'HR',
};

function formatTime(ts: string) {
  const d = new Date(ts.replace(' ', 'T'));
  return d.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: string) {
  const d = new Date(ts.replace(' ', 'T'));
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GH', { day: '2-digit', month: 'short' });
}

export default function ChatPage() {
  const { user } = useAuth();
  const { users: staffUsers } = useUsers();
  const [activeChannel, setActiveChannel] = useState('general');
  const [dmTarget, setDmTarget] = useState<string | null>(null);
  const { messages, channels, postMessage } = useChat(dmTarget ? `dm_${[user?.id || 'USR-001', dmTarget].sort().join('_')}` : activeChannel);
  const [input, setInput] = useState('');
  const [dmSearch, setDmSearch] = useState('');
  const [showDmList, setShowDmList] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const channelMsgs = messages.filter((m) =>
    dmTarget ? m.channel === `dm_${[user?.id || 'USR-001', dmTarget].sort().join('_')}` : m.channel === activeChannel
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMsgs.length, activeChannel, dmTarget]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const channelKey = dmTarget
      ? `dm_${[user.id, dmTarget].sort().join('_')}`
      : activeChannel;
    await postMessage(
      {
        channel: channelKey,
        content: input.trim(),
        recipientId: dmTarget || undefined,
      },
      user.id,
      user.name,
      user.role
    );
    setInput('');
    inputRef.current?.focus();
  };


  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const dmStaff = staffUsers.filter((u) => u.id !== user?.id);
  const filteredDm = dmStaff.filter((u) => {
    const name = (u.name || (u as any).fullName || '').toLowerCase();
    const dept = (u.department || '').toLowerCase();
    const q = dmSearch.toLowerCase();
    return name.includes(q) || dept.includes(q);
  });

  const dmTargetUser = dmTarget ? staffUsers.find((u) => u.id === dmTarget) : null;

  const activeChannelInfo = chatChannels.find((c) => c.id === activeChannel);

  // Group messages by date
  const grouped: { date: string; msgs: ChatMessage[] }[] = [];
  for (const msg of channelMsgs) {
    const d = formatDate(msg.timestamp);
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== d) grouped.push({ date: d, msgs: [msg] });
    else last.msgs.push(msg);
  }

  const unreadDm: Record<string, number> = {};

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="px-4 pt-3 pb-0 shrink-0">
        <DepartmentGuide department="chat" />
      </div>
    <div className="flex flex-1 min-h-0">
      {/* Sidebar */}
      <div className="w-60 shrink-0 bg-[#1e293b] flex flex-col border-r border-white/10 overflow-y-auto">
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Channels</p>
        </div>
        <div className="py-1">
          {chatChannels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => { setActiveChannel(ch.id); setDmTarget(null); }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                !dmTarget && activeChannel === ch.id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <span className="text-base">{ch.icon}</span>
              <span className="truncate">#{ch.name}</span>
            </button>
          ))}
        </div>

        <div className="px-4 pt-4 pb-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Direct Messages</p>
            <button onClick={() => setShowDmList(!showDmList)} className="text-white/30 hover:text-white/70 text-lg leading-none">+</button>
          </div>
        </div>

        {showDmList && (
          <div className="px-3 pb-2">
            <input
              value={dmSearch}
              onChange={(e) => setDmSearch(e.target.value)}
              placeholder="Search staff..."
              className="w-full px-2 py-1.5 text-xs bg-white/10 text-white placeholder-white/30 rounded-lg border border-white/10 focus:outline-none focus:border-white/30"
            />
            <div className="mt-1 max-h-40 overflow-y-auto space-y-0.5">
              {filteredDm.map((u) => {
                const displayName = u.name || (u as any).fullName || 'Staff';
                return (
                  <button
                    key={u.id}
                    onClick={() => { setDmTarget(u.id); setShowDmList(false); setDmSearch(''); }}
                    className="w-full text-left px-2 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded flex items-center gap-2"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                      {displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </div>
                    <span className="truncate">{displayName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="py-1">
          {dmStaff.filter((u) => {
            const key = `dm_${[user!.id, u.id].sort().join('_')}`;
            return messages.some((m) => m.channel === key);
          }).map((u) => {
            const key = `dm_${[user!.id, u.id].sort().join('_')}`;
            const count = unreadDm[key] || 0;
            const displayName = u.name || (u as any).fullName || 'Staff';
            return (
              <button
                key={u.id}
                onClick={() => { setDmTarget(u.id); setActiveChannel(''); }}
                className={`w-full text-left px-4 py-2 flex items-center gap-2 text-sm transition-colors ${
                  dmTarget === u.id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                  {displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                </div>
                <span className="truncate flex-1">{displayName}</span>
                {count > 0 && <span className="bg-[#1b4fce] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* My status */}
        <div className="mt-auto px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-[10px] font-bold">
                {user?.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-400 border border-[#1e293b]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/80 font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-white/30">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#f0f4f8] flex items-center gap-3 shrink-0">
          {dmTarget ? (
            <>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {((dmTargetUser?.name || (dmTargetUser as any)?.fullName || 'Staff')).split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <p className="font-semibold text-[#0f172a] text-sm">{dmTargetUser?.name || (dmTargetUser as any)?.fullName || 'Staff'}</p>
                <p className="text-xs text-slate-400">{dmTargetUser?.department} · {dmTargetUser?.branch}</p>
              </div>
            </>
          ) : (
            <>
              <span className="text-xl">{activeChannelInfo?.icon}</span>
              <div>
                <p className="font-semibold text-[#0f172a] text-sm">#{activeChannelInfo?.name}</p>
                <p className="text-xs text-slate-400">{activeChannelInfo?.description}</p>
              </div>
            </>
          )}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] text-slate-300 bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-200 font-medium">● Live</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {grouped.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-4xl mb-3">{dmTarget ? '💬' : activeChannelInfo?.icon}</div>
              <p className="text-slate-400 text-sm">No messages yet in {dmTarget ? `DM with ${dmTargetUser?.name}` : `#${activeChannelInfo?.name}`}</p>
              <p className="text-slate-300 text-xs mt-1">Be the first to say something</p>
            </div>
          )}
          {grouped.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#f0f4f8]" />
                <span className="text-[10px] text-slate-400 font-medium px-2">{group.date}</span>
                <div className="flex-1 h-px bg-[#f0f4f8]" />
              </div>
              <div className="space-y-2">
                {group.msgs.map((msg, i) => {
                  const isMe = msg.senderId === user?.id;
                  const prevMsg = group.msgs[i - 1];
                  const showSender = !prevMsg || prevMsg.senderId !== msg.senderId;
                  return (
                    <div key={msg.id} className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}>
                      {showSender ? (
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 ${isMe ? 'from-[#0d9488] to-[#059669]' : ''}`}>
                          {msg.senderName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                      ) : (
                        <div className="w-8 shrink-0" />
                      )}
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showSender && (
                          <div className={`flex items-center gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="text-xs font-semibold text-[#0f172a]">{msg.senderName}</span>
                            {(() => {
                              const role = (msg.senderRole && msg.senderRole in roleColors) ? (msg.senderRole as Role) : 'doctor';
                              return <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${roleColors[role]}`}>{roleShort[role]}</span>;
                            })()}
                            <span className="text-[10px] text-slate-300">{formatTime(msg.timestamp)}</span>
                          </div>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          msg.type === 'alert'
                            ? 'bg-amber-50 border border-amber-200 text-amber-900'
                            : isMe
                            ? 'bg-[#1b4fce] text-white rounded-tr-sm'
                            : 'bg-[#f0f4f8] text-[#0f172a] rounded-tl-sm'
                        }`}>
                          {msg.type === 'alert' && <span className="font-semibold mr-1">📢</span>}
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-3 border-t border-[#f0f4f8] shrink-0">
          <div className="flex items-center gap-3 bg-[#f8fafc] border border-[#dbe4ef] rounded-xl px-4 py-2">
            <div className="flex-1">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={dmTarget ? `Message ${dmTargetUser?.name}…` : `Message #${activeChannelInfo?.name}…`}
                className="w-full bg-transparent text-sm text-[#0f172a] placeholder-slate-400 focus:outline-none"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-lg bg-[#1b4fce] flex items-center justify-center text-white shrink-0 disabled:opacity-30 hover:bg-[#1a47c0] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 7L2 2l2 5-2 5 10-5z" fill="currentColor" /></svg>
            </button>
          </div>
          <p className="text-[10px] text-slate-300 mt-1 px-1">Press Enter to send</p>
        </div>
      </div>
      </div>
    </div>
  );
}
