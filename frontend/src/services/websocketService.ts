import { Client } from "@stomp/stompjs";
// @ts-expect-error - Auto-suppressed during migration
import SockJS from "sockjs-client";
import { API_BASE_URL } from "./api";
import { DynamicStateObject } from "./../types/DynamicState";

class WebSocketService {
  constructor() {
    // @ts-expect-error - Auto-suppressed during migration
    this.client = null;
    // @ts-expect-error - Auto-suppressed during migration
    this.connected = false;
    // @ts-expect-error - Auto-suppressed during migration
    this.subscriptions = new Map();
    // @ts-expect-error - Auto-suppressed during migration
    this.reconnectAttempts = 0;
    // @ts-expect-error - Auto-suppressed during migration
    this.maxReconnectDelay = 30000; // Max 30 seconds
    // @ts-expect-error - Auto-suppressed during migration
    this.listeners = new Set();
  }

  addStateListener(callback: DynamicStateObject) {
    // @ts-expect-error - Auto-suppressed during migration
    this.listeners.add(callback);
    // @ts-expect-error - Auto-suppressed during migration
    callback(this.connected);
    // @ts-expect-error - Auto-suppressed during migration
    return () => this.listeners.delete(callback);
  }

  notifyStateChange() {
    // @ts-expect-error - Auto-suppressed during migration
    this.listeners.forEach((cb: DynamicStateObject) => cb(this.connected));
  }

  connect(token: DynamicStateObject, onConnect: DynamicStateObject, onError: DynamicStateObject) {
    // @ts-expect-error - Auto-suppressed during migration
    if (this.client && this.connected) {
      if (onConnect) onConnect();
      return;
    }

    const calculateDelay = () => {
      // Exponential backoff: 2^attempts * 1000ms
      // @ts-expect-error - Auto-suppressed during migration
      const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, this.maxReconnectDelay);
      // @ts-expect-error - Auto-suppressed during migration
      this.reconnectAttempts++;
      // @ts-expect-error - Auto-suppressed during migration
      console.warn(`[STOMP] Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})`);
      return delay;
    };

    // @ts-expect-error - Auto-suppressed during migration
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
         // @ts-expect-error - Auto-suppressed during migration
         this.client.reconnectDelay = calculateDelay();
      }
    });

    // @ts-expect-error - Auto-suppressed during migration
    this.client.onConnect = (frame: DynamicStateObject) => {
      // @ts-expect-error - Auto-suppressed during migration
      this.connected = true;
      // @ts-expect-error - Auto-suppressed during migration
      this.reconnectAttempts = 0; // Reset on success
      this.notifyStateChange();
      if (onConnect) onConnect(frame);
    };

    // @ts-expect-error - Auto-suppressed during migration
    this.client.onWebSocketClose = () => {
      // @ts-expect-error - Auto-suppressed during migration
      if (this.connected) {
         // @ts-expect-error - Auto-suppressed during migration
         this.connected = false;
         this.notifyStateChange();
         console.warn("[STOMP] Connection lost. Attempting reconnect...");
      }
    };

    // @ts-expect-error - Auto-suppressed during migration
    this.client.onStompError = (frame: DynamicStateObject) => {
      console.error("[STOMP] Broker error: " + (frame.headers as DynamicStateObject)["message"]);
      if (onError) onError(frame);
    };

    // @ts-expect-error - Auto-suppressed during migration
    this.client.activate();
  }

  disconnect() {
    // @ts-expect-error - Auto-suppressed during migration
    if (this.client) {
      // @ts-expect-error - Auto-suppressed during migration
      this.client.deactivate();
      // @ts-expect-error - Auto-suppressed during migration
      this.connected = false;
      this.notifyStateChange();
      // @ts-expect-error - Auto-suppressed during migration
      this.subscriptions.clear();
    }
  }

  subscribe(destination: DynamicStateObject, callback: DynamicStateObject) {
    // @ts-expect-error - Auto-suppressed during migration
    if (!this.client || !this.connected) {
      console.warn("[STOMP] Cannot subscribe, not connected.");
      return null;
    }
    
    // @ts-expect-error - Auto-suppressed during migration
    if (this.subscriptions.has(destination)) {
      // @ts-expect-error - Auto-suppressed during migration
      return this.subscriptions.get(destination);
    }

    // @ts-expect-error - Auto-suppressed during migration
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

    // @ts-expect-error - Auto-suppressed during migration
    this.subscriptions.set(destination, subscription);
    return subscription;
  }

  unsubscribe(destination: DynamicStateObject) {
    // @ts-expect-error - Auto-suppressed during migration
    if (this.subscriptions.has(destination)) {
      // @ts-expect-error - Auto-suppressed during migration
      this.subscriptions.get(destination).unsubscribe();
      // @ts-expect-error - Auto-suppressed during migration
      this.subscriptions.delete(destination);
    }
  }

  send(destination: DynamicStateObject, body: DynamicStateObject, headers = {}) {
    // @ts-expect-error - Auto-suppressed during migration
    if (!this.client || !this.connected) {
      console.warn("[STOMP] Cannot send message, not connected.");
      return;
    }
    // @ts-expect-error - Auto-suppressed during migration
    this.client.publish({
      destination,
      body: JSON.stringify(body),
      headers
    });
  }
}

export const wsService = new WebSocketService();
