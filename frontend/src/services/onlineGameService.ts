import Peer, { type DataConnection } from 'peerjs';
import type {
  OnlineConnectionStatus,
  OnlineMessage,
  OnlineMessageType,
  OnlinePlayerProfile,
  OnlineRole,
  OnlineRoomConfig,
  MovePayload,
  ChatPayload,
} from '../types/online';
import type { PlayerColor } from '../types/chess';

export type OnlineEventCallback<T = any> = (data: T) => void;

export const generateRoomCode = (): string => {
  const prefixes = ['KNG', 'QEN', 'ROK', 'BHP', 'KNT', 'PWN', 'CHK', 'MAT'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
};

class OnlineGameService {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private role: OnlineRole = 'HOST';
  private roomConfig: OnlineRoomConfig | null = null;
  private status: OnlineConnectionStatus = 'IDLE';
  private localPlayer: OnlinePlayerProfile | null = null;
  private opponentPlayer: OnlinePlayerProfile | null = null;
  private processedMessageIds = new Set<string>();

  // Event Listeners
  private listeners: Record<string, Set<OnlineEventCallback>> = {};

  constructor() {
    this.setupStorageListener();
  }

  // Subscribe to service events
  public on(event: string, callback: OnlineEventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event].add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: OnlineEventCallback) {
    this.listeners[event]?.delete(callback);
  }

  private emit(event: string, data?: any) {
    this.listeners[event]?.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`[OnlineGameService] Error in listener for "${event}":`, err);
      }
    });
  }

  private setStatus(newStatus: OnlineConnectionStatus, message?: string) {
    this.status = newStatus;
    this.emit('status', { status: newStatus, message });
  }

  public getStatus(): OnlineConnectionStatus {
    return this.status;
  }

  public getRole(): OnlineRole {
    return this.role;
  }

  public getOpponent(): OnlinePlayerProfile | null {
    return this.opponentPlayer;
  }

  public getRoomConfig(): OnlineRoomConfig | null {
    return this.roomConfig;
  }

  // Generate a random 6-character room code (e.g. KNG-742)
  public static generateRoomCode(): string {
    return generateRoomCode();
  }

  // --- HOST: Create a Room ---
  public createRoom(
    roomCode: string,
    config: Omit<OnlineRoomConfig, 'roomCode'>,
    player: Omit<OnlinePlayerProfile, 'color' | 'isReady'>
  ) {
    this.cleanup();
    this.role = 'HOST';
    this.roomConfig = { ...config, roomCode: roomCode.toUpperCase() };

    // Resolve Host Color
    let hostColor: PlayerColor = 'w';
    if (config.hostColor === 'black') hostColor = 'b';
    else if (config.hostColor === 'random') hostColor = Math.random() < 0.5 ? 'w' : 'b';

    this.localPlayer = {
      ...player,
      color: hostColor,
      isReady: true,
    };

    this.setStatus('WAITING_FOR_OPPONENT', 'Room created. Share the code with a friend.');
    this.initBroadcastChannel(roomCode);
    this.initHostPeer(roomCode);
  }

  // --- GUEST: Join an Existing Room ---
  public joinRoom(
    roomCode: string,
    player: Omit<OnlinePlayerProfile, 'color' | 'isReady'>
  ) {
    this.cleanup();
    this.role = 'GUEST';
    const formattedCode = roomCode.trim().toUpperCase();
    this.roomConfig = {
      roomCode: formattedCode,
      timeControl: 'rapid_10_0',
      baseMinutes: 10,
      incrementSeconds: 0,
      hostColor: 'random',
      isPrivate: true,
    };

    this.localPlayer = {
      ...player,
      color: 'b', // Default until host ACK
      isReady: true,
    };

    this.setStatus('CONNECTING', `Connecting to room ${formattedCode}...`);
    this.initBroadcastChannel(formattedCode);
    this.initGuestPeer(formattedCode);

    // Announce presence across broadcast channel immediately
    this.broadcastMessage('ROOM_JOIN', {
      guest: this.localPlayer,
    });
  }

  // Broadcast Channel setup (Zero-latency cross-tab communication)
  private initBroadcastChannel(roomCode: string) {
    try {
      this.broadcastChannel = new BroadcastChannel(`chaturang_online_${roomCode}`);
      this.broadcastChannel.onmessage = (event) => {
        this.handleIncomingRawMessage(event.data);
      };
    } catch (e) {
      console.warn('[OnlineGameService] BroadcastChannel not supported, falling back to WebRTC/Storage.', e);
    }
  }

  // LocalStorage storage events fallback for same-browser sync
  private setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('chaturang_msg_') && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          this.handleIncomingRawMessage(parsed);
        } catch {}
      }
    });
  }

  // STUN servers configuration for internet NAT traversal
  private static readonly PEER_CONFIG = {
    debug: 1,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
      ],
    },
  };

  // Initialize WebRTC Peer as Host
  private initHostPeer(roomCode: string) {
    const peerId = `chaturang-host-${roomCode.toLowerCase()}`;
    try {
      this.peer = new Peer(peerId, OnlineGameService.PEER_CONFIG);

      this.peer.on('open', (id) => {
        console.log(`[OnlineGameService] Host peer established with ID: ${id}`);
      });

      this.peer.on('connection', (conn) => {
        console.log('[OnlineGameService] Guest connection received on host peer');
        this.connection = conn;
        this.setupConnectionListeners(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('[OnlineGameService] Host Peer warning/error:', err.type, err.message);
        // If peer ID is taken or network error, local BroadcastChannel continues to work
      });
    } catch (err) {
      console.warn('[OnlineGameService] WebRTC Peer initialization skipped:', err);
    }
  }

  // Initialize WebRTC Peer as Guest
  private initGuestPeer(roomCode: string) {
    const guestPeerId = `chaturang-guest-${roomCode.toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`;
    const hostPeerId = `chaturang-host-${roomCode.toLowerCase()}`;

    try {
      this.peer = new Peer(guestPeerId, OnlineGameService.PEER_CONFIG);

      this.peer.on('open', () => {
        console.log(`[OnlineGameService] Guest peer open. Connecting to host: ${hostPeerId}`);
        const conn = this.peer!.connect(hostPeerId, { reliable: true });
        this.connection = conn;
        this.setupConnectionListeners(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('[OnlineGameService] Guest Peer connection error:', err.type, err.message);
      });
    } catch (err) {
      console.warn('[OnlineGameService] Guest WebRTC init failed:', err);
    }
  }

  private setupConnectionListeners(conn: DataConnection) {
    conn.on('open', () => {
      console.log('[OnlineGameService] WebRTC DataChannel connection open!');
      if (this.role === 'GUEST' && this.localPlayer) {
        this.sendMessage('ROOM_JOIN', { guest: this.localPlayer });
      }
    });

    conn.on('data', (data) => {
      this.handleIncomingRawMessage(data);
    });

    conn.on('close', () => {
      console.log('[OnlineGameService] WebRTC connection closed.');
      this.emit('disconnected');
    });

    conn.on('error', (err) => {
      console.error('[OnlineGameService] Connection error:', err);
    });
  }

  // Universal Message Sender (Dispatches via DataChannel + BroadcastChannel + LocalStorage)
  public sendMessage<T = any>(type: OnlineMessageType, payload: T) {
    if (!this.localPlayer || !this.roomConfig) return;

    const msg: OnlineMessage<T> = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      senderId: this.localPlayer.id,
      senderName: this.localPlayer.name,
      payload,
      timestamp: Date.now(),
    };

    this.processedMessageIds.add(msg.id);
    this.broadcastMessageRaw(msg);
  }

  private broadcastMessage<T = any>(type: OnlineMessageType, payload: T) {
    this.sendMessage(type, payload);
  }

  private broadcastMessageRaw(msg: OnlineMessage) {
    // 1. Send via WebRTC connection if open
    if (this.connection && this.connection.open) {
      try {
        this.connection.send(msg);
      } catch (e) {
        console.warn('[OnlineGameService] Error sending via WebRTC:', e);
      }
    }

    // 2. Send via BroadcastChannel (multi-tab on same browser)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (e) {
        console.warn('[OnlineGameService] Error sending via BroadcastChannel:', e);
      }
    }

    // 3. Fallback via LocalStorage key trigger
    if (this.roomConfig) {
      try {
        const key = `chaturang_msg_${this.roomConfig.roomCode}`;
        localStorage.setItem(key, JSON.stringify(msg));
        setTimeout(() => localStorage.removeItem(key), 200);
      } catch {}
    }
  }

  // Handle incoming message from any transport
  private handleIncomingRawMessage(data: any) {
    if (!data || typeof data !== 'object' || !data.id || !data.type) return;

    const msg = data as OnlineMessage;

    // Ignore self messages or duplicates
    if (msg.senderId === this.localPlayer?.id || this.processedMessageIds.has(msg.id)) {
      return;
    }
    this.processedMessageIds.add(msg.id);

    console.log(`[OnlineGameService] Incoming message: ${msg.type}`, msg.payload);

    switch (msg.type) {
      case 'ROOM_JOIN': {
        if (this.role === 'HOST') {
          // Guest joined the room
          const guest = msg.payload.guest as OnlinePlayerProfile;
          const guestColor: PlayerColor = this.localPlayer?.color === 'w' ? 'b' : 'w';
          const confirmedGuest: OnlinePlayerProfile = {
            ...guest,
            color: guestColor,
          };
          this.opponentPlayer = confirmedGuest;

          // Send ACK with room configuration & colors
          this.sendMessage('ROOM_JOIN_ACK', {
            host: this.localPlayer,
            guestColor,
            config: this.roomConfig,
          });

          this.setStatus('CONNECTED', `Connected with ${guest.name}`);
          this.emit('opponentJoined', confirmedGuest);
        }
        break;
      }

      case 'ROOM_JOIN_ACK': {
        if (this.role === 'GUEST') {
          const { host, guestColor, config } = msg.payload;
          this.opponentPlayer = host;
          if (this.localPlayer) {
            this.localPlayer.color = guestColor;
          }
          if (config) {
            this.roomConfig = config;
          }

          this.setStatus('CONNECTED', `Connected with ${host.name}`);
          this.emit('opponentJoined', host);
          this.emit('configSynced', { config, localColor: guestColor });
        }
        break;
      }

      case 'MOVE': {
        this.emit('move', msg.payload as MovePayload);
        break;
      }

      case 'RESIGN': {
        this.emit('resign', msg.payload?.color as PlayerColor);
        break;
      }

      case 'DRAW_OFFER': {
        this.emit('drawOffer', { senderName: msg.senderName });
        break;
      }

      case 'DRAW_ACCEPT': {
        this.emit('drawAccept');
        break;
      }

      case 'DRAW_DECLINE': {
        this.emit('drawDecline');
        break;
      }

      case 'CHAT': {
        this.emit('chat', {
          chat: msg.payload as ChatPayload,
          senderName: msg.senderName,
        });
        break;
      }

      case 'REMATCH_OFFER': {
        this.emit('rematchOffer');
        break;
      }

      case 'REMATCH_ACCEPT': {
        this.emit('rematchAccept');
        break;
      }

      default:
        break;
    }
  }

  // Game Action Helpers
  public sendMove(payload: MovePayload) {
    this.sendMessage('MOVE', payload);
  }

  public sendResign(color: PlayerColor) {
    this.sendMessage('RESIGN', { color });
  }

  public sendDrawOffer() {
    this.sendMessage('DRAW_OFFER', {});
  }

  public sendDrawResponse(accepted: boolean) {
    this.sendMessage(accepted ? 'DRAW_ACCEPT' : 'DRAW_DECLINE', {});
  }

  public sendChat(message: string, isEmoji = false) {
    this.sendMessage('CHAT', { message, isEmoji });
  }

  public sendRematchOffer() {
    this.sendMessage('REMATCH_OFFER', {});
  }

  public sendRematchAccept() {
    this.sendMessage('REMATCH_ACCEPT', {});
  }

  // Cleanup connections
  public cleanup() {
    if (this.connection) {
      try {
        this.connection.close();
      } catch {}
      this.connection = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
      this.broadcastChannel = null;
    }
    this.processedMessageIds.clear();
    this.status = 'IDLE';
    this.opponentPlayer = null;
  }
}

export const onlineGameService = new OnlineGameService();
