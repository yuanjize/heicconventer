import "@testing-library/jest-dom";

// Polyfill MessageEvent
if (typeof MessageEvent === 'undefined') {
  global.MessageEvent = class MessageEvent extends Event {
    data: any;
    constructor(type: string, eventInitDict?: MessageEventInit) {
      super(type, eventInitDict);
      this.data = eventInitDict?.data;
    }
  } as any;
}

// Polyfill Worker
class Worker {
  url: string;
  onmessage: ((e: MessageEvent) => void) | null;
  onerror: ((e: ErrorEvent) => void) | null;

  constructor(stringUrl: string) {
    this.url = stringUrl;
    this.onmessage = null;
    this.onerror = null;
  }

  postMessage(_msg: any) {
    // Default implementation does nothing, can be mocked
  }

  terminate() {}
  
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}

global.Worker = Worker as any;