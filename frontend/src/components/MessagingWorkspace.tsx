import { useEffect, useMemo, useState } from "react";
import LocalizedText from "./LocalizedText";
import SectionCard from "./SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { sendChatMessage } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { formatDisplayValue } from "../utils/formatDisplayValue";
import { translateDisplayText } from "../utils/i18n";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import EmptyStateCard from "./ui/EmptyStateCard";
import ErrorStateCard from "./ui/ErrorStateCard";
import LoadingSkeleton from "./ui/LoadingSkeleton";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

const inboxLoaders = {
  PATIENT: () => Promise.resolve([]),
  DOCTOR: () => Promise.resolve([]),
  CAREGIVER: () => Promise.resolve([]),
  PHARMACIST: () => Promise.resolve([])
};

export interface MessagingWorkspaceProps {
  role?: DynamicState;
  title?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function MessagingWorkspace({ role, title }: MessagingWorkspaceProps) {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const profileId = auth.profileId ?? auth.userId;
  const [contacts, setContacts] = useState<DynamicStateObject[]>([]);
  const [messages, setMessages] = useState<DynamicStateObject[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<DynamicStateObject | null>(null);
  const [subject, setSubject] = useState<DynamicState>("");
  const [body, setBody] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(true);
  const [sending, setSending] = useState<DynamicState>(false);
  const [error, setError] = useState<DynamicState>("");
  const [message, setMessage] = useState<DynamicState>("");
  const [reloadToken, setReloadToken] = useState<DynamicState>(0);

  const loadInbox = async (signal: DynamicStateObject) => {
    const loader = (inboxLoaders as DynamicStateObject)[role];
    if (!loader) {
      return;
    }
    setLoading(true);
    try {
      const data = await runWithRequestTimeout(
        (requestSignal: DynamicStateObject) => loader(profileId, { signal: requestSignal }),
        { signal }
      );
      
      const safeContacts = Array.isArray((data as any)?.contacts) ? (data as any).contacts : [];
      const safeMessages = Array.isArray((data as any)?.messages) ? (data as any).messages : [];
      
      // Filter out test/dev/QA data
      const isTestEntity = (str: DynamicStateObject) => {
        if (!str) return false;
        const s = str.toLowerCase();
        return s.includes("test") || s.includes("qa ") || s.includes("ui send");
      };

      const filteredContacts = safeContacts.filter((c: DynamicStateObject) => !isTestEntity(c.displayName));
      const filteredMessages = safeMessages.filter((m: DynamicStateObject) => 
        !isTestEntity(m.subject) && !isTestEntity(m.body) && 
        !isTestEntity(m.senderName) && !isTestEntity(m.recipientName)
      );

      const dedupedContacts = filteredContacts.filter((contact: DynamicStateObject, index: number | string, list: DynamicStateObject) =>
        list.findIndex((item: DynamicStateObject) => item.userId === contact.userId) === index
      );
      
      setContacts(dedupedContacts);
      setMessages(filteredMessages);
      setSelectedUserId((current: DynamicStateObject) => current ?? (dedupedContacts as DynamicStateObject)[0]?.userId ?? null);
      setError("");
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, t("unableLoadMessages")));
      logAsyncFailure(`messages:${role.toLowerCase()}:load`, err, { profileId, role });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadInbox(controller.signal);
    return () => {
      controller.abort();
    };
  }, [profileId, role, reloadToken, t]);

  const selectedContact = useMemo(
    () => contacts.find((contact: DynamicStateObject) => contact.userId === selectedUserId) ?? null,
    [contacts, selectedUserId]
  );

  const visibleMessages = useMemo(() => {
    if (!selectedContact) {
      return messages;
    }
    return messages.filter((item: DynamicStateObject) => item.senderUserId === selectedContact.userId || item.recipientUserId === selectedContact.userId);
  }, [messages, selectedContact]);

  const sendMessage = async () => {
    if (!selectedContact || !body.trim()) {
      setError(t("selectContactAndEnterMessage"));
      return;
    }

    const patientId = role === "PATIENT" ? profileId : selectedContact.profileId;
    setSending(true);
    try {
      const created = await sendChatMessage({
        patientId,
        senderUserId: auth.userId,
        recipientUserId: selectedContact.userId,
        subject: subject.trim() || t("careMessageSubject"),
        body: body.trim()
      });
      setMessages((current: DynamicStateObject) => [created, ...current]);
      setSubject("");
      setBody("");
      setMessage(t("messageSentLabel"));
      setError("");
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, t("unableSendMessage")));
      logAsyncFailure(`messages:${role.toLowerCase()}:send`, err, { profileId, role });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title={title}>
        {loading ? <LoadingSkeleton lines={3} /> : null}
        {!loading && error ? (
          <ErrorStateCard
            title={t("unableLoadMessages")}
            body={error}
            actionLabel={t("retry")}
            onAction={() => setReloadToken((current: DynamicStateObject) => current + 1)}
          />
        ) : null}
        {!loading && !error && !contacts.length ? (
          <EmptyStateCard
            title={t("noContactsAvailableYet")}
            body={t("noContactsAvailableYet")}
          />
        ) : null}
        <div className="space-y-3">
          {contacts.map((contact: DynamicStateObject) => {
            const active = contact.userId === selectedUserId;
            return (
              <button
                key={contact.userId}
                type="button"
                className={`w-full rounded-2xl px-4 py-4 text-left transition ${
                  active ? "bg-clinic text-white" : "bg-mist text-slate-700 hover:bg-slate-100"
                }`}
                aria-label={contact.displayName}
                data-voice-label={contact.displayName}
                onClick={() => {
                  setSelectedUserId(contact.userId);
                  setMessage("");
                  setError("");
                }}
              >
                <p className="font-semibold">{contact.displayName}</p>
                <p className={`mt-1 text-sm ${active ? "text-white/80" : "text-slate-500"}`}>{translateDisplayText(language, contact.descriptor || formatDisplayValue(contact.role))}</p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title={selectedContact ? t("conversationWith").replace("{name}", selectedContact.displayName) : t("composeMessage")}>
        <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
          <input
            className="field"
            placeholder={t("subject")}
            aria-label={t("subject")}
            data-voice-label={t("subject")}
            value={subject}
            onChange={(event: DynamicStateObject) => setSubject(event.target.value)}
          />
          <button
            className="btn-primary"
            type="button"
            disabled={sending || !selectedContact}
            onClick={sendMessage}
            aria-label={sending ? t("sending") : t("sendMessage")}
            data-voice-label={sending ? t("sending") : t("sendMessage")}
          >
            {sending ? t("sending") : t("sendMessage")}
          </button>
        </div>
        <textarea
          className="field mt-4 min-h-28 resize-y"
          placeholder={t("typeCareCoordinationMessage")}
          aria-label={t("typeCareCoordinationMessage")}
          data-voice-label={t("typeCareCoordinationMessage")}
          value={body}
          onChange={(event: DynamicStateObject) => setBody(event.target.value)}
        />
        {message ? <p className="mt-3 text-sm text-emerald-600" role="status" aria-live="polite">{message}</p> : null}
        {error && !loading ? <p className="mt-3 text-sm text-red-600" role="alert">{error}</p> : null}

        <div className="mt-6 space-y-4">
          {!visibleMessages.length ? <p className="text-sm text-slate-500">{t("noConversationHistoryYet")}</p> : null}
          {visibleMessages.map((item: DynamicStateObject) => {
            const outgoing = item.senderUserId === auth.userId;
            return (
              <div key={item.id} className={`rounded-2xl p-4 ${outgoing ? "bg-emerald-50" : "bg-mist"}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <LocalizedText as="p" className="font-semibold text-ink" value={item.subject} />
                    <p className="text-xs text-slate-500">
                      {item.senderName} {"->"} {item.recipientName}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={item.body} />
                {!item.acknowledged && item.recipientUserId === auth.userId ? (
                  <button
                    type="button"
                    className="btn-secondary mt-3"
                    aria-label={t("acknowledge")}
                    data-voice-label={t("acknowledge")}
                    onClick={async () => {
                      try {
                        setMessages((prev: DynamicStateObject) => prev.map((m: DynamicStateObject) => m.id === item.id ? { ...m, acknowledged: true } : m));
                      } catch (err: DynamicStateObject) {
                        setError(getApiErrorMessage(err, t("unableAcknowledgeMessage")));
                      }
                    }}
                  >
                    {t("acknowledge")}
                  </button>
                ) : (
                  <p className="mt-3 text-xs font-semibold text-slate-500">{item.acknowledged ? t("acknowledged") : t("pendingAcknowledgement")}</p>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
