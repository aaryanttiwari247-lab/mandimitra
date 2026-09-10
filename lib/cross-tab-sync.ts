import { Booking, BookingStatus } from "./types";

export type ProcurementSyncMessage = {
  type: "STATUS_UPDATED" | "BOOKING_CREATED" | "QUEUE_UPDATED";
  token?: string;
  bookingId?: string;
  status?: BookingStatus | string;
  booking?: Partial<Booking>;
  timestamp: string;
};

const CHANNEL_NAME = "mandimitra_procurement_sync";

let broadcastChannel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!("BroadcastChannel" in window)) return null;
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      broadcastChannel = null;
    }
  }
  return broadcastChannel;
}

/**
 * Broadcasts a real-time procurement update to all open tabs and windows in the browser.
 */
export function broadcastProcurementUpdate(
  payload: Omit<ProcurementSyncMessage, "timestamp">
) {
  if (typeof window === "undefined") return;

  const message: ProcurementSyncMessage = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  // 1. Native BroadcastChannel (instant sub-millisecond sync across tabs)
  try {
    const channel = getChannel();
    if (channel) {
      channel.postMessage(message);
    }
  } catch (err) {
    console.warn("BroadcastChannel post error:", err);
  }

  // 2. Custom window events for same-page components
  try {
    window.dispatchEvent(
      new CustomEvent("mandimitra_sync_event", { detail: message })
    );
    window.dispatchEvent(new Event("smartProcurementQueueUpdated"));
    window.dispatchEvent(new Event("smartProcurementBookingUpdated"));
  } catch {}
}

/**
 * Subscribes to real-time procurement events from any tab.
 * Returns an unsubscription function.
 */
export function subscribeProcurementUpdates(
  onMessage: (msg: ProcurementSyncMessage) => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const channel = getChannel();

  const handleChannelMessage = (event: MessageEvent<ProcurementSyncMessage>) => {
    if (event.data && event.data.type) {
      onMessage(event.data);
    }
  };

  const handleCustomEvent = (event: Event) => {
    const custom = event as CustomEvent<ProcurementSyncMessage>;
    if (custom.detail) {
      onMessage(custom.detail);
    }
  };

  if (channel) {
    channel.addEventListener("message", handleChannelMessage);
  }

  window.addEventListener("mandimitra_sync_event", handleCustomEvent);

  return () => {
    if (channel) {
      channel.removeEventListener("message", handleChannelMessage);
    }
    window.removeEventListener("mandimitra_sync_event", handleCustomEvent);
  };
}
