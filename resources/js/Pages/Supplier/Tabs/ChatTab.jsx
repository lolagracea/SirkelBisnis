import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Store } from 'lucide-react';
import axios from 'axios';
import echo from '../../../echo';

const TOKEN_KEY = 'sirkel_token';

export default function ChatTab({ setToast, user }) {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Dipakai di dalam callback Echo supaya selalu tau chat mana yang sedang
  // dibuka tanpa kena masalah stale-closure dari useEffect.
  const selectedChatIdRef = useRef(null);
  useEffect(() => {
    selectedChatIdRef.current = selectedChat?.id ?? null;
  }, [selectedChat?.id]);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chats.length === 0) return;

    const channelNames = chats.map((c) => `chat.${c.id}`);
    const channels = channelNames.map((name) => echo.private(name));

    channels.forEach((channel, idx) => {
      const chatId = chats[idx].id;

      channel.listen('.chat.message', (e) => {
        const isCurrentlyOpen = selectedChatIdRef.current === chatId;

        if (isCurrentlyOpen) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === e.message.id)) return prev;
            return [...prev, e.message];
          });
        }

        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [e.message],
                  unread_count: isCurrentlyOpen ? 0 : (c.unread_count || 0) + 1,
                }
              : c
          )
        );
      });
    });

    return () => {
      channelNames.forEach((name) => echo.leave(name));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats.map((c) => c.id).join(',')]);

  const fetchChats = async () => {
    try {
      const res = await axios.get('/api/chats', {
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` }
      });
      setChats(res.data.data);
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Failed to fetch chats' });
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (chatId) => {
    try {
      const res = await axios.get(`/api/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` }
      });
      setSelectedChat(res.data.data);
      setMessages(res.data.data.messages);
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Failed to fetch messages' });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const res = await axios.post(
        `/api/chats/${selectedChat.id}/message`,
        { message: messageText },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
            'X-Socket-Id': echo.socketId(),
          }
        }
      );
      setMessages((prev) => [...prev, res.data.data]);
      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChat.id ? { ...c, messages: [res.data.data] } : c
        )
      );
    } catch (err) {
      setNewMessage(messageText);
      setToast({ visible: true, type: 'error', message: 'Failed to send message' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn h-[calc(100vh-120px)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Direct Messaging</h1>
        <p className="text-slate-500 text-sm">Komunikasi langsung dengan UMKM untuk diskusi spesifikasi, negosiasi harga, dll.</p>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex">
        {/* Chat List */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800">Daftar Obrolan</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-400">Loading...</div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">Belum ada obrolan.</div>
            ) : (
              chats.map((chat) => {
                const hasUnread = (chat.unread_count || 0) > 0;
                return (
                  <div
                    key={chat.id}
                    onClick={() => openChat(chat.id)}
                    className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${selectedChat?.id === chat.id ? 'bg-slate-100' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        <UserIcon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${hasUnread ? 'font-extrabold text-slate-900' : 'font-bold text-slate-800'}`}>
                            {chat.umkm?.user?.name || 'UMKM'}
                          </p>
                          {hasUnread && (
                            <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                              {chat.unread_count > 9 ? '9+' : chat.unread_count}
                            </span>
                          )}
                        </div>
                        {chat.messages && chat.messages.length > 0 && (
                          <p className={`text-xs truncate ${hasUnread ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                            {chat.messages[0].message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                  <UserIcon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {selectedChat.umkm?.user?.name || 'UMKM'}
                  </h3>
                  <p className="text-xs text-emerald-600 font-medium">Online</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.sender_type.includes('SupplierProfile');
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                          <UserIcon size={14} />
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-emerald-50 border border-emerald-100 text-slate-800 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-emerald-500'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {isMe && (
                        <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <Store size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tulis pesan..."
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-11 h-11">
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <UserIcon size={48} className="mb-4 opacity-20" />
              <p>Pilih percakapan untuk mulai mengirim pesan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}