import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Store } from 'lucide-react';
import axios from 'axios';
import echo from '../../../echo';

const TOKEN_KEY = 'sirkel_token';

export default function ChatTab({ setToast, user, defaultSelectedChatId }) {
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
    if (defaultSelectedChatId && chats.length > 0) {
      openChat(defaultSelectedChatId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSelectedChatId, chats.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe ke SEMUA channel chat milik user begitu daftar obrolan termuat,
  // supaya pesan baru tetap masuk real-time walau chat itu belum sedang dibuka
  // (jadi sidebar & badge unread ikut update tanpa perlu refresh).
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
                  // kalau chat-nya lagi dibuka, anggap langsung terbaca
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
      if (setToast) {
        setToast({ visible: true, type: 'error', message: 'Gagal mengambil data pesan' });
      } else {
        console.error('Failed to fetch chats', err);
      }
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
      // Backend sudah menandai pesan lawan bicara sebagai "read" saat endpoint
      // ini dipanggil, jadi kita nolkan juga unread_count di sisi UI.
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      if (setToast) {
        setToast({ visible: true, type: 'error', message: 'Gagal mengambil isi pesan' });
      } else {
        console.error('Failed to fetch messages', err);
      }
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
      if (setToast) {
        setToast({ visible: true, type: 'error', message: 'Gagal mengirim pesan' });
      } else {
        console.error('Failed to send message', err);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn h-[calc(100vh-120px)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Pesan Langsung</h1>
        <p className="text-[#64748B] text-sm">Komunikasi langsung dengan Supplier untuk diskusi spesifikasi, negosiasi harga, dll.</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex">
        {/* Chat List */}
        <div className="w-1/3 border-r border-[#E2E8F0] flex flex-col">
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <h3 className="font-bold text-[#0F172A]">Daftar Obrolan</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-[#94A3B8] text-xs font-bold">Memuat...</div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-[#94A3B8] text-xs font-bold">Belum ada obrolan.</div>
            ) : (
              chats.map((chat) => {
                const hasUnread = (chat.unread_count || 0) > 0;
                return (
                  <div
                    key={chat.id}
                    onClick={() => openChat(chat.id)}
                    className={`p-4 border-b border-[#F1F5F9] cursor-pointer hover:bg-[#F8FAFC] transition ${selectedChat?.id === chat.id ? 'bg-[#F1F5F9]' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        <Store size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${hasUnread ? 'font-extrabold text-[#0F172A]' : 'font-bold text-[#0F172A]'}`}>
                            {chat.supplier?.supplier_name || chat.supplier?.user?.name || 'Supplier'}
                          </p>
                          {hasUnread && (
                            <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                              {chat.unread_count > 9 ? '9+' : chat.unread_count}
                            </span>
                          )}
                        </div>
                        {chat.messages && chat.messages.length > 0 && (
                          <p className={`text-xs truncate ${hasUnread ? 'text-[#0F172A] font-semibold' : 'text-[#64748B]'}`}>
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
        <div className="flex-1 flex flex-col bg-[#F8FAFC]/50">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-[#E2E8F0] bg-white flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  <Store size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[#0F172A] text-sm">
                    {selectedChat.supplier?.supplier_name || selectedChat.supplier?.user?.name || 'Supplier'}
                  </h3>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Online</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.sender_type.includes('UmkmProfile');
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <Store size={14} />
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-sm'
                            : 'bg-blue-50 border border-blue-100 text-[#0F172A] rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-[10px] mt-1 text-right font-medium ${isMe ? 'text-emerald-100' : 'text-blue-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {isMe && (
                        <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                          <UserIcon size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-[#E2E8F0]">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tulis pesan ke supplier..."
                    className="flex-1 px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-11 h-11">
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#94A3B8]">
              <div className="h-16 w-16 bg-white border border-[#E2E8F0] rounded-full flex items-center justify-center mb-4 text-[#CBD5E1]">
                <UserIcon size={32} />
              </div>
              <p className="text-sm font-semibold text-[#64748B]">Pilih percakapan untuk mulai mengirim pesan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}