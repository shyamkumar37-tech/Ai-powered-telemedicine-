import { Client, Frame, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE_URL } from "./api";

export type StateListener = (connected: boolean) => void;
export type MessageCallback = (data: unknown) => void;

class WebSocketService {
  client: Client | null;
  connected: boolean;
  subscriptions: Map<string, StompSubscription>;
  reconnectAttempts: number;
  maxReconnectDelay: number;
  listeners: Set<StateListener>;

  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 30000;
    this.listeners = new Set();
  }

  addStateListener(callback: StateListener) {
    this.listeners.add(callback);
    callback(this.connected);
    return () => this.listeners.delete(callback);
  }

  notifyStateChange() {
    this.listeners.forEach((cb) => cb(this.connected));
  }

  connect(token?: string, onConnect?: (frame?: Frame) => void, onError?: (frame?: Frame) => void) {
    if (this.client && this.connected) {
      if (onConnect) onConnect();
      return;
    }

    const calculateDelay = () => {
      const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, this.maxReconnectDelay);
      this.reconnectAttempts++;
      if (import.meta.env.DEV) {
        console.warn(`[STOMP] Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})`);
      }
      return delay;
    };

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-telecare`),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: (str: string) => {
        if (import.meta.env.DEV) {
          // console.debug("[STOMP]", str);
        }
      },
      reconnectDelay: 1000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      beforeConnect: () => {
        if (this.client) {
          this.client.reconnectDelay = calculateDelay();
        }
      }
    });

    this.client.onConnect = (frame: Frame) => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.notifyStateChange();
      if (onConnect) onConnect(frame);
    };

    this.client.onWebSocketClose = () => {
      if (this.connected) {
        this.connected = false;
        this.notifyStateChange();
        if (import.meta.env.DEV) {
          console.warn("[STOMP] Connection lost. Attempting reconnect...");
        }
      }
    };

    this.client.onStompError = (frame: Frame) => {
      if (import.meta.env.DEV) {
        console.error("[STOMP] Broker error: " + frame.headers["message"]);
      }
      if (onError) onError(frame);
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
      this.notifyStateChange();
      this.subscriptions.clear();
    }
  }

  subscribe(destination: string, callback: MessageCallback): StompSubscription | null {
    if (!this.client || !this.connected) {
      if (import.meta.env.DEV) {
        console.warn("[STOMP] Cannot subscribe, not connected.");
      }
      return null;
    }
    if (this.subscriptions.has(destination)) {
      return this.subscriptions.get(destination)!;
    }
    const subscription = this.client.subscribe(destination, (message) => {
      if (message.body) {
        try {
          const parsed = JSON.parse(message.body);
          callback(parsed);
        } catch {
          callback(message.body);
        }
      }
    });
    this.subscriptions.set(destination, subscription);
    return subscription;
  }

  unsubscribe(destination: string) {
    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination)!.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  send(destination: string, body: any) {
    if (this.client && this.connected) {
      this.client.publish({
        destination,
        body: typeof body === "string" ? body : JSON.stringify(body)
      });
    }
  }
}

export const websocketService = new WebSocketService();
export const wsService = websocketService;

