type EventCallback<T = unknown> = (data: T) => void;
type EventMap = Record<string, EventCallback[]>;

class EventBus {
  private events: EventMap;

  constructor() {
    this.events = {};
  }

  on<T>(event: string, callback: EventCallback<T>): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback as EventCallback);
  }

  emit<T>(event: string, data?: T): void {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data as unknown));
    }
  }

  off<T>(event: string, callback: EventCallback<T>): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  // Helper method to clear all events
  clear(): void {
    this.events = {};
  }
}

export const eventBus = new EventBus(); 