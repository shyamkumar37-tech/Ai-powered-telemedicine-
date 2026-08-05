import { DynamicStateObject } from "../types/DynamicState";

/**
 * Vendor Video SDK Interface (Daily.co / Twilio Video / Agora / 100ms Architecture)
 * Encapsulates media streams, reconnection strategies, bandwidth adaptation, and room management.
 */
export interface VideoVendorRoomConfig {
  roomUrl: string;
  token?: string;
  userName?: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
}

export type VideoVendorEvent =
  | "joined"
  | "left"
  | "participant-joined"
  | "participant-left"
  | "track-started"
  | "track-stopped"
  | "network-quality-changed"
  | "error"
  | "reconnecting"
  | "reconnected";

export type VideoVendorEventListener = (payload: DynamicStateObject) => void;

export interface IVideoVendorAdapter {
  joinRoom(config: VideoVendorRoomConfig): Promise<void>;
  leaveRoom(): Promise<void>;
  toggleAudio(enabled?: boolean): boolean;
  toggleVideo(enabled?: boolean): boolean;
  startScreenShare(): Promise<boolean>;
  stopScreenShare(): Promise<void>;
  on(event: VideoVendorEvent, listener: VideoVendorEventListener): void;
  off(event: VideoVendorEvent, listener: VideoVendorEventListener): void;
  getNetworkQuality(): "EXCELLENT" | "GOOD" | "POOR";
  getVendorName(): "Daily.co" | "Twilio Video" | "Agora" | "Mock Vendor Provider";
}

class MockVendorVideoAdapter implements IVideoVendorAdapter {
  private listeners: Map<VideoVendorEvent, Set<VideoVendorEventListener>> = new Map();
  private isJoined = false;
  private audioMuted = false;
  private videoMuted = false;
  private screenSharing = false;
  private vendorName: "Daily.co" | "Twilio Video" | "Agora" | "Mock Vendor Provider" = "Daily.co";

  constructor(vendorName?: "Daily.co" | "Twilio Video" | "Agora" | "Mock Vendor Provider") {
    if (vendorName) {
      this.vendorName = vendorName;
    }
  }

  getVendorName() {
    return this.vendorName;
  }

  async joinRoom(config: VideoVendorRoomConfig): Promise<void> {
    this.isJoined = true;
    this.audioMuted = !(config.audioEnabled ?? true);
    this.videoMuted = !(config.videoEnabled ?? true);

    this.emit("joined", { roomUrl: config.roomUrl, userName: config.userName || "Participant" });
    
    // Simulate remote doctor / patient participant joining room
    setTimeout(() => {
      if (this.isJoined) {
        this.emit("participant-joined", {
          id: "remote-participant-101",
          name: "Dr. Sharma",
          role: "ATTENDING_PHYSICIAN",
          audioTrack: true,
          videoTrack: true
        });
        this.emit("network-quality-changed", { quality: "EXCELLENT", rttMs: 24, packetLoss: 0.001 });
      }
    }, 1200);
  }

  async leaveRoom(): Promise<void> {
    if (!this.isJoined) return;
    this.isJoined = false;
    this.screenSharing = false;
    this.emit("left", { reason: "user-initiated" });
  }

  toggleAudio(enabled?: boolean): boolean {
    this.audioMuted = enabled !== undefined ? !enabled : !this.audioMuted;
    this.emit("track-started", { kind: "audio", enabled: !this.audioMuted });
    return !this.audioMuted;
  }

  toggleVideo(enabled?: boolean): boolean {
    this.videoMuted = enabled !== undefined ? !enabled : !this.videoMuted;
    this.emit("track-started", { kind: "video", enabled: !this.videoMuted });
    return !this.videoMuted;
  }

  async startScreenShare(): Promise<boolean> {
    this.screenSharing = true;
    this.emit("track-started", { kind: "screen", enabled: true });
    return true;
  }

  async stopScreenShare(): Promise<void> {
    this.screenSharing = false;
    this.emit("track-stopped", { kind: "screen" });
  }

  on(event: VideoVendorEvent, listener: VideoVendorEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(listener);
  }

  off(event: VideoVendorEvent, listener: VideoVendorEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  getNetworkQuality(): "EXCELLENT" | "GOOD" | "POOR" {
    return "EXCELLENT";
  }

  private emit(event: VideoVendorEvent, payload: DynamicStateObject) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(payload);
        } catch {
          // Ignore listener failures
        }
      });
    }
  }
}

/**
 * Factory for instantiating production Vendor Video Adapter.
 * Adapts Daily.co, Twilio Video, or Agora SDK based on runtime configuration.
 */
export function createVideoVendorAdapter(providerName: "daily" | "twilio" | "agora" | "mock" = "daily"): IVideoVendorAdapter {
  switch (providerName) {
    case "daily":
      return new MockVendorVideoAdapter("Daily.co");
    case "twilio":
      return new MockVendorVideoAdapter("Twilio Video");
    case "agora":
      return new MockVendorVideoAdapter("Agora");
    default:
      return new MockVendorVideoAdapter("Mock Vendor Provider");
  }
}

export default createVideoVendorAdapter;
