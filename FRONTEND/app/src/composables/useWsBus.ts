/**
 * Lightweight WebSocket event bus.
 * DefaultLayout dispatches incoming WS messages here.
 * Any component can subscribe via useWsBus().on(type, handler).
 */

type WsHandler = (data: any) => void;

const listeners = new Map<string, Set<WsHandler>>();

/** Subscribe to a WS message type. Returns unsubscribe function. */
function on(type: string, handler: WsHandler): () => void {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type)!.add(handler);
  return () => listeners.get(type)?.delete(handler);
}

/** Dispatch a parsed WS message to all subscribers of its type. */
function emit(data: { type: string; [key: string]: any }): void {
  const handlers = listeners.get(data.type);
  if (handlers) {
    for (const h of handlers) {
      try { h(data); } catch { /* don't break other listeners */ }
    }
  }
}

export function useWsBus() {
  return { on, emit };
}
