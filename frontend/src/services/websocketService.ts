import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE_URL } from "./api";
import { DynamicStateObject } from "./../types/DynamicState";

class WebSocketService {
  client: any;
  connected: boolean;
  subscriptions: Map<any, any>;
  reconnectAttempts: number;
  maxReconnectDelay: number;
  listeners: Set<any>;
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.listeners = new Set();
  }

  addStateListener(callback: DynamicStateObject) {
    (this.listeners.add as any)(callback);
    callback(this.connected);
    return () => this.listeners.delete(callback);
  }

  notifyStateChange() {
    this.listeners.forEach((cb: DynamicStateObject) => cb(this.connected));
  }

  connect(token: DynamicStateObject, onConnect: DynamicStateObject, onError: DynamicStateObject) {
    if (this.client && this.connected) {
      if (onConnect) onConnect();
      return;
    }

    const calculateDelay = () => {
      // Exponential backoff: 2^attempts * 1000ms
      const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, this.maxReconnectDelay);
      this.reconnectAttempts++;
      console.warn(`[STOMP] Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})`);
      return delay;
    };
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-telecare`),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str: DynamicStateObject) => {
        if (import.meta.env.DEV) {
          // console.debug("[STOMP]", str); // Muted in dev to avoid noise
        }
      },
      reconnectDelay: 1000, // This is overridden by beforeConnect
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      beforeConnect: () => {
         // STOMP.js doesn't natively support dynamic backoff via property, 
         // but we can simulate connection retry logic or let it reconnect with a fixed delay.
         // Let's implement the dynamic delay via timeout wrapper if needed.
         this.client.reconnectDelay = calculateDelay();
      }
    });
    this.client.onConnect = (frame: DynamicStateObject) => {
      this.connected = true;
      this.reconnectAttempts = 0; // Reset on success
      this.notifyStateChange();
      if (onConnect) onConnect(frame);
    };
    this.client.onWebSocketClose = () => {
      if (this.connected) {
         this.connected = false;
         this.notifyStateChange();
         console.warn("[STOMP] Connection lost. Attempting reconnect...");
      }
    };
    this.client.onStompError = (frame: DynamicStateObject) => {
      console.error("[STOMP] Broker error: " + (frame.headers as DynamicStateObject)["message"]);
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

  subscribe(destination: DynamicStateObject, callback: DynamicStateObject) {
    if (!this.client || !this.connected) {
      console.warn("[STOMP] Cannot subscribe, not connected.");
      return null;
    }
    if (this.subscriptions.has(destination)) {
      return this.subscriptions.get(destination);
    }
    const subscription = this.client.subscribe(destination, (message: DynamicStateObject) => {
      if (message.body) {
        try {
          const parsed = JSON.parse(message.body);
          callback(parsed);
        } catch (e: DynamicStateObject) {
          callback(message.body);
        }
      }
    });
    this.subscriptions.set(destination, subscription);
    return subscription;
  }

  unsubscribe(destination: DynamicStateObject) {
    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination).unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  send(destination: DynamicStateObject, body: DynamicStateObject, headers = {}) {
    if (!this.client || !this.connected) {
      console.warn("[STOMP] Cannot send message, not connected.");
      return;
    }
    this.client.publish({
      destination,
      body: JSON.stringify(body),
      headers
    });
  }

}

export const wsService = new WebSocketService();
