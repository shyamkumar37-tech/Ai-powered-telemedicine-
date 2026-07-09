import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { acknowledgeCareMessage, fetchPatientMessages, sendCareMessage } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import { useToast } from "../components/ui/ToastProvider";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, MessageSquare, AlertTriangle, RefreshCw, Send, CheckCircle2, ShieldCheck, Search } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PatientMessagesPage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const profileId = auth?.profileId ?? auth?.userId;
  
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadInbox = async () => {
    setLoading(true);
    try {
      const data = await fetchPatientMessages(profileId);
      const safeContacts = Array.isArray(data?.contacts) ? data.contacts : [];
      const safeMessages = Array.isArray(data?.messages) ? data.messages : [];
      
      const isTestEntity = (str) => {
        if (!str) return false;
        const s = str.toLowerCase();
        return s.includes("test") || s.includes("qa ") || s.includes("ui send");
      };

      const filteredContacts = safeContacts.filter(c => !isTestEntity(c.displayName));
      const filteredMessages = safeMessages.filter(m => 
        !isTestEntity(m.subject) && !isTestEntity(m.body) && 
        !isTestEntity(m.senderName) && !isTestEntity(m.recipientName)
      );

      const dedupedContacts = filteredContacts.filter((contact, index, list) =>
        list.findIndex((item) => item.userId === contact.userId) === index
      );
      
      setContacts(dedupedContacts);
      setMessages(filteredMessages);
      setSelectedUserId((current) => current ?? dedupedContacts[0]?.userId ?? null);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load messages."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, [profileId]);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const query = search.trim().toLowerCase();
    return contacts.filter(c => c.displayName?.toLowerCase().includes(query) || c.role?.toLowerCase().includes(query));
  }, [contacts, search]);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.userId === selectedUserId) ?? null,
    [contacts, selectedUserId]
  );

  const visibleMessages = useMemo(() => {
    if (!selectedContact) return [];
    return messages
      .filter((item) => item.senderUserId === selectedContact.userId || item.recipientUserId === selectedContact.userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // newest first
  }, [messages, selectedContact]);

  const sendMessage = async () => {
    if (!selectedContact || !body.trim()) {
      pushToast({ type: "error", title: "Error", message: "Please select a contact and enter a message." });
      return;
    }
    setSending(true);
    try {
      const created = await sendCareMessage({
        patientId: profileId,
        senderUserId: auth.userId,
        recipientUserId: selectedContact.userId,
        subject: subject.trim() || "Care coordination message",
        body: body.trim()
      });
      setMessages((current) => [created, ...current]);
      setSubject("");
      setBody("");
      pushToast({ type: "success", title: "Sent", message: "Message delivered successfully." });
    } catch (err) {
      pushToast({ type: "error", title: "Error", message: getApiErrorMessage(err, "Unable to send message.") });
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  return (
    <div id="tct-root">
      <div className="app">
        <PatientSidebar />
        
        <main id="page-main" role="main" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="topbar">
            <div>
              <h1 className="serif">Messages</h1>
              <p>Communicate directly with your care team and specialists.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <MessageSquare />Support
              </div>
              <div className="signed-in" style={{ marginTop: '12px', marginLeft: '8px' }}>
                <User />
                Signed in as {auth?.fullName || "Anita Patient"}
              </div>
            </div>
            <div className="topbar-right">
              <LanguageSwitcher customClass="lang" hideLabel />
              <button className="btn-ghost" onClick={handleLogout} aria-label="Log out">
                <LogOut />Logout
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* Contacts Sidebar */}
            <div style={{ width: '320px', background: 'var(--tct-panel)', borderRight: '1px solid var(--tct-panel-line-strong)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid var(--tct-panel-line)' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="var(--tct-text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 16px 10px 40px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--tct-panel-line-strong)',
                      borderRadius: '100px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="skeleton-pulse" style={{ height: '60px', borderRadius: '12px' }}></div>)}
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <p style={{ color: 'var(--tct-text-muted)', fontSize: '13px', textAlign: 'center', marginTop: '24px' }}>No contacts available.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredContacts.map(contact => (
                      <button
                        key={contact.userId}
                        onClick={() => setSelectedUserId(contact.userId)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '16px',
                          borderRadius: '12px',
                          background: selectedUserId === contact.userId ? 'rgba(255,255,255,0.08)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--tct-teal-dim)', color: 'var(--tct-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {contact.displayName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '600' }}>{contact.displayName}</p>
                          <p style={{ fontSize: '12px', color: 'var(--tct-text-secondary)', marginTop: '2px' }}>{contact.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--tct-root-bg)' }}>
              {selectedContact ? (
                <>
                  <div style={{ padding: '24px', borderBottom: '1px solid var(--tct-panel-line-strong)', background: 'var(--tct-panel)' }}>
                    <h2 style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: '600' }}>{selectedContact.displayName}</h2>
                    <p style={{ fontSize: '13px', color: 'var(--tct-text-secondary)' }}>{selectedContact.role}</p>
                  </div>
                  
                  <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column-reverse', gap: '16px' }}>
                    {visibleMessages.length === 0 ? (
                      <div className="empty-state" style={{ margin: 'auto', border: 'none' }}>
                        <MessageSquare />
                        <h3>No messages yet</h3>
                        <p>Start a conversation with {selectedContact.displayName}.</p>
                      </div>
                    ) : (
                      visibleMessages.map(msg => {
                        const isMine = msg.senderUserId === auth.userId;
                        return (
                          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '80%', alignSelf: isMine ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                              background: isMine ? 'var(--tct-teal)' : 'var(--tct-panel)',
                              border: isMine ? 'none' : '1px solid var(--tct-panel-line-strong)',
                              borderRadius: '16px',
                              borderBottomRightRadius: isMine ? '4px' : '16px',
                              borderBottomLeftRadius: !isMine ? '4px' : '16px',
                              padding: '16px',
                              color: isMine ? '#0A121C' : '#FFFFFF',
                            }}>
                              {msg.subject && <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', opacity: 0.9 }}>{msg.subject}</h4>}
                              <p style={{ fontSize: '14px', lineHeight: '1.5' }}>{msg.body}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '11px', color: 'var(--tct-text-muted)' }}>
                              <span>{new Date(msg.createdAt).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                              {!isMine && !msg.acknowledged && (
                                <button 
                                  onClick={async () => {
                                    try {
                                      const updated = await acknowledgeCareMessage(msg.id);
                                      setMessages(curr => curr.map(m => m.id === updated.id ? updated : m));
                                    } catch (e) {}
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--tct-teal)', cursor: 'pointer', fontWeight: '600' }}
                                >
                                  Mark as read
                                </button>
                              )}
                              {msg.acknowledged && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--tct-teal)' }}><CheckCircle2 size={12}/> Read</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div style={{ padding: '24px', background: 'var(--tct-panel)', borderTop: '1px solid var(--tct-panel-line-strong)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input
                        type="text"
                        placeholder="Subject (Optional)"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        style={{
                          width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '12px', color: '#FFFFFF', fontSize: '14px', outline: 'none'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <textarea
                          placeholder="Type your message..."
                          value={body}
                          onChange={e => setBody(e.target.value)}
                          style={{
                            flex: 1, minHeight: '80px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '12px', color: '#FFFFFF', fontSize: '14px', outline: 'none', resize: 'vertical'
                          }}
                        />
                        <button
                          className="btn-primary"
                          disabled={sending || !body.trim()}
                          onClick={sendMessage}
                          style={{ alignSelf: 'flex-end', padding: '12px 24px', height: '44px' }}
                        >
                          <Send size={16} /> Send
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                    <ShieldCheck />
                    <h3>Secure Messaging</h3>
                    <p>Select a contact from the sidebar to view your conversation history or send a new message.</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
