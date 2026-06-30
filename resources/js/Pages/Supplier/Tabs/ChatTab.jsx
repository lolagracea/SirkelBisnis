import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon } from 'lucide-react';
import api from '../../../lib/api';

export default function ChatTab({ setToast, user }) {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const res = await api.get('/chats');
      setChats(res.data.data);
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Failed to fetch chats' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await api.get(`/chats/${chatId}`);
      setSelectedChat(res.data.data);
      setMessages(res.data.data.messages);
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Failed to fetch messages' });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await api.post(`/chats/${selectedChat.id}/message`, { message: newMessage });
      setMessages([...messages, res.data.data]);
      setNewMessage('');
    } catch (err) {
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
              chats.map((chat) => (
                <div 
                  key={chat.id} 
                  onClick={() => fetchMessages(chat.id)}
                  className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${selectedChat?.id === chat.id ? 'bg-slate-100' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                      {user.role === 'supplier' ? chat.umkm?.user?.name?.charAt(0) : chat.supplier?.user?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {user.role === 'supplier' ? chat.umkm?.user?.name : chat.supplier?.user?.name}
                      </p>
                      {chat.messages && chat.messages.length > 0 && (
                        <p className="text-xs text-slate-500 truncate">{chat.messages[0].message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                  {user.role === 'supplier' ? selectedChat.umkm?.user?.name?.charAt(0) : selectedChat.supplier?.user?.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {user.role === 'supplier' ? selectedChat.umkm?.user?.name : selectedChat.supplier?.user?.name}
                  </h3>
                  <p className="text-xs text-emerald-600 font-medium">Online</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isMe = (user.role === 'supplier' && msg.sender_type.includes('SupplierProfile')) ||
                               (user.role === 'umkm' && msg.sender_type.includes('UmkmProfile'));
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-2xl ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
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
                  <button type="submit" className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 transition">
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
