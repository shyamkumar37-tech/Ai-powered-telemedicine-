import React, { useEffect, useState, useRef, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { fetchConversations, fetchConversationHistory, sendChatMessage, markConversationRead } from "../services/telecareService";
import { useWebSocket } from "../hooks/useWebSocket";
import { format, isToday, isYesterday } from "date-fns";
import { MessageSquare, Send, CheckCircle2, User, Search, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "./ui/ToastProvider";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function ChatInterface() {
  const { t } = useLanguage();
  const { auth } = useAuth();
  const { pushToast } = useToast();
  
  const [conversations, setConversations] = useState<DynamicStateObject[]>([]);
  const [activeContactId, setActiveContactId] = useState<DynamicStateObject | null>(null);
  const [messages, setMessages] = useState<DynamicState>({}); // mapped by contactUserId
  const [messageInput, setMessageInput] = useState<DynamicState>("");
  
  const [loadingConversations, setLoadingConversations] = useState<DynamicState>(true);
  const [loadingHistory, setLoadingHistory] = useState<DynamicState>(false);
  const [sending, setSending] = useState<DynamicState>(false);
  
  const [searchQuery, setSearchQuery] = useState<DynamicState>("");

  const messagesEndRef = useRef<DynamicState>(null);

  // Initial load of conversations
  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const data = await fetchConversations();
      setConversations(data || []);
      if (data && data.length > 0 && !activeContactId) {
        setActiveContactId((data as DynamicStateObject)[0].contactUserId);
      }
    } catch (error: DynamicStateObject) {
      console.error("Failed to load conversations", error);
      pushToast({ type: "error", title: "Connection Error", message: "Failed to load conversations." });
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (auth?.userId) {
      loadConversations();
    }
  }, [auth?.userId]);

  // Load history when a conversation is selected
  useEffect(() => {
    if (activeContactId) {
      const convo = conversations.find((c: DynamicStateObject) => c.contactUserId === activeContactId);
      if (!convo || !convo.id) {
         // No conversation history yet
         setMessages((prev: DynamicStateObject) => ({ ...prev, [activeContactId]: [] }));
         return;
      }
      
      const loadHistory = async () => {
        setLoadingHistory(true);
        try {
          const history = await fetchConversationHistory(convo.id);
          setMessages((prev: DynamicStateObject) => ({ ...prev, [activeContactId]: history }));
          
          // Mark as read if there are unread messages
          if (convo.unreadCount > 0) {
            await markConversationRead(convo.id);
            setConversations((prev: DynamicStateObject) => prev.map((c: DynamicStateObject) => c.contactUserId === activeContactId ? { ...c, unreadCount: 0 } : c));
          }
        } catch (error: DynamicStateObject) {
          console.error("Failed to load history", error);
        } finally {
          setLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [activeContactId, conversations]); // Added conversations to dependency array

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeContactId]);

  // WebSocket Integration
  const handleIncomingMessage = (newMsg: DynamicStateObject) => {
    // We don't have the contact user ID in newMsg easily unless we check sender/recipient
    const contactId = newMsg.senderId === auth?.userId ? newMsg.recipientId : newMsg.senderId;
    // Wait, ChatMessageResponse doesn't have recipientId. It has conversationId and senderId.
    // Let's just reload conversations to get the latest list and unread counts.
    loadConversations();

    // Also update history if we are currently viewing it
    const convo = conversations.find((c: DynamicStateObject) => c.id === newMsg.conversationId);
    if (convo) {
       setMessages((prev: DynamicStateObject) => {
         const history = (prev as DynamicStateObject)[convo.contactUserId] || [];
         if (history.find((m: DynamicStateObject) => m.id === newMsg.id)) return prev; // prevent dups
         return { ...prev, [convo.contactUserId]: [...history, newMsg] };
       });
       
       if (activeContactId === convo.contactUserId && newMsg.senderId !== auth?.userId) {
         markConversationRead(newMsg.conversationId).catch(console.error);
       }
    }
  };

  const { connected } = useWebSocket('/user/queue/messages', handleIncomingMessage);

  const activeMessages = (messages as DynamicStateObject)[activeContactId] || [];

  const handleSend = async (e: DynamicStateObject) => {
    e.preventDefault();
    console.log("handleSend triggered", { messageInput, activeContactId, sending });
    if (!messageInput.trim() || !activeContactId || sending) {
        console.log("handleSend aborted");
        return;
    }

    const content = messageInput.trim();
    setMessageInput("");
    setSending(true);

    const activeConvo = conversations.find((c: DynamicStateObject) => c.contactUserId === activeContactId);
    
    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversationId: activeConvo?.id,
      senderId: auth?.userId,
      content: content,
      sentAt: new Date().toISOString(),
      read: false,
      isPending: true
    };
    
    setMessages((prev: DynamicStateObject) => ({
      ...prev,
      [activeContactId]: [...((prev as DynamicStateObject)[activeContactId] || []), optimisticMsg]
    }));

    try {
      console.log("Sending chat message to backend", { conversationId: activeConvo?.id, recipientId: activeContactId, content });
      const savedMsg = await sendChatMessage({
        conversationId: activeConvo?.id,
        recipientId: activeContactId,
        content: content
      });
      console.log("Chat message sent successfully", savedMsg);

      // Replace temp message with real one
      setMessages((prev: DynamicStateObject) => ({
        ...prev,
        [activeContactId]: (prev as DynamicStateObject)[activeContactId].map((m: DynamicStateObject) => m.id === tempId ? savedMsg : m)
      }));
      
      // Reload conversations to update IDs and last messages
      loadConversations();
    } catch (error: DynamicStateObject) {
      console.error("Failed to send", error);
      pushToast({ type: "error", title: "Failed to send message", message: "Please try again." });
      // Remove failed temp message
      setMessages((prev: DynamicStateObject) => ({
        ...prev,
        [activeContactId]: (prev as DynamicStateObject)[activeContactId].filter((m: DynamicStateObject) => m.id !== tempId)
      }));
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: DynamicStateObject) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return `Yesterday, ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c: DynamicStateObject) => c.contactName?.toLowerCase().includes(q) || c.contactRole?.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-surface rounded-2xl shadow-panel overflow-hidden border border-white/10 backdrop-blur-md">
      
      {/* Sidebar: Conversations */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-white/10 flex flex-col bg-surface/50">
        <div className="p-5 border-b border-white/10 bg-transparent">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-display font-semibold text-ink flex items-center gap-2">
              <MessageSquare size={20} className="text-primary" />
              {t("messages") || "Messages"}</h2>
            {!connected && (
               <span className="flex items-center text-xs text-amber-500 font-medium">
                 <RefreshCw size={12} className="animate-spin mr-1" /> {t("reconnecting") || "Reconnecting..."}</span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e: DynamicStateObject) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-ink placeholder-ink-muted focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all outline-none shadow-inner"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center">
              <Loader2 className="animate-spin mb-2" size={24} />
              {t("loadingConversations") || "Loading conversations..."}</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {t("noConversationsFound") || "No conversations found."}</div>
          ) : (
            filteredConversations.map((convo: DynamicStateObject) => (
              <button 
                key={convo.id || convo.contactUserId}
                onClick={() => setActiveContactId(convo.contactUserId)}
                className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-all flex gap-3 ${activeContactId === convo.contactUserId ? 'bg-primary/10 border-l-4 border-l-primary shadow-[inset_4px_0_0_0_var(--tc-primary)]' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 shadow-md text-white flex items-center justify-center font-semibold text-sm flex-shrink-0 border border-white/10">
                  {convo.contactName?.charAt(0) || <User size={18} />}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-medium text-ink truncate text-[15px]">{convo.contactName}</h4>
                    <span className="text-xs text-ink-muted font-medium whitespace-nowrap ml-2">
                      {formatMessageTime(convo.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-[13px] truncate pr-2 ${convo.unreadCount > 0 ? 'text-ink font-medium' : 'text-ink-muted'}`}>
                      {convo.lastMessage || "Started a conversation"}
                    </p>
                    {convo.unreadCount > 0 && (
                      <span className="bg-primary text-canvas text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main: Chat Area */}
      <div className="flex-1 flex flex-col bg-surface relative">
        {activeContactId ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-surface/80 backdrop-blur-md flex items-center justify-between z-10 sticky top-0">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 shadow-md text-white flex items-center justify-center font-semibold border border-white/10">
                   {conversations.find((c: DynamicStateObject) => c.contactUserId === activeContactId)?.contactName?.charAt(0) || <User size={18} />}
                </div>
                <div>
                  <h3 className="font-medium text-lg text-ink">
                    {conversations.find((c: DynamicStateObject) => c.contactUserId === activeContactId)?.contactName}
                  </h3>
                  <p className="text-xs text-ink-muted capitalize font-medium tracking-wide">
                    {conversations.find((c: DynamicStateObject) => c.contactUserId === activeContactId)?.contactRole?.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-canvas/50 inner-shadow">
              {loadingHistory ? (
                <div className="flex justify-center items-center h-full text-ink-muted">
                   <Loader2 className="animate-spin" size={24} />
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-ink-muted space-y-4">
                  <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-2 shadow-inner">
                    <MessageSquare size={28} className="text-white/20" />
                  </div>
                  <p className="font-medium">{t("sendAMessageToStartTheConversation") || "Send a message to start the conversation"}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {activeMessages.map((msg: DynamicStateObject, i: DynamicStateObject) => {
                    const isMe = msg.senderId === auth?.userId;
                    const showHeader = i === 0 || (activeMessages as DynamicStateObject)[i-1].senderId !== msg.senderId || new Date(msg.sentAt).getTime() - new Date((activeMessages as DynamicStateObject)[i-1].sentAt).getTime() > 300000;
                    
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-fadeSlideUp`} style={{ animationDuration: '0.2s' }}>
                        {showHeader && (
                           <div className="text-[11px] font-medium text-ink-muted mb-1.5 mx-2 tracking-wide uppercase">
                             {formatMessageTime(msg.sentAt)}
                           </div>
                        )}
                        <div className={`max-w-[75%] px-5 py-3 relative shadow-md backdrop-blur-sm ${isMe ? 'bg-primary text-canvas rounded-2xl rounded-br-sm font-medium' : 'bg-white/10 border border-white/10 text-ink rounded-2xl rounded-bl-sm'}`}>
                          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{msg.content}</p>
                            {isMe && (
                              <div className="absolute right-2.5 bottom-1.5 flex opacity-80">
                                {msg.isPending ? (
                                  <Loader2 size={12} className="animate-spin text-canvas/70" />
                                ) : msg.readAt ? (
                                  <CheckCircle2 size={12} className="text-blue-900" />
                                ) : (
                                  <CheckCircle2 size={12} className="text-canvas/60" />
                                )}
                              </div>
                            )}
                            {isMe && <div className="h-2.5" />} {/* spacing for tick marks */}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-5 bg-surface/80 backdrop-blur-md border-t border-white/10 z-10 sticky bottom-0">
              <form onSubmit={handleSend} className="flex items-end gap-3 max-w-4xl mx-auto">
                <textarea 
                  value={messageInput}
                  onChange={(e: DynamicStateObject) => setMessageInput(e.target.value)}
                  onKeyDown={(e: DynamicStateObject) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 max-h-32 min-h-[48px] bg-canvas border border-white/10 rounded-2xl px-5 py-3 text-[15px] text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none shadow-inner"
                  rows={1}
                />
                <button 
                  type="submit" 
                  aria-label="Send message"
                  disabled={!messageInput.trim() || sending || !connected}
                  className="h-[48px] w-[48px] bg-primary hover:bg-teal-400 disabled:bg-white/10 disabled:text-white/30 text-canvas rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-md transform hover:scale-105 active:scale-95"
                >
                  <Send size={18} className="ml-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-surface/50 text-ink-muted p-6 text-center">
            <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-6 shadow-inner">
              <MessageSquare size={36} className="text-white/20" />
            </div>
            <h3 className="text-2xl font-display font-medium text-ink">{t("noConversationSelected") || "No Conversation Selected"}</h3>
            <p className="mt-3 text-[15px] max-w-md">{t("chooseAConversationFromTheSidebarToStartMessagingWithYourCareTeam") || "Choose a conversation from the sidebar to start messaging with your care team."}</p>
          </div>
        )}
      </div>

    </div>
  );
}
