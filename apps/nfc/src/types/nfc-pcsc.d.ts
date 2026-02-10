declare module 'nfc-pcsc' {
  import { EventEmitter } from 'events';

  export class NFC extends EventEmitter {
    constructor();
    on(event: 'reader', listener: (reader: Reader) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export class Reader extends EventEmitter {
    name: string;
    on(event: 'card', listener: (card: Card) => void): this;
    on(event: 'card.off', listener: (card?: Card) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
    transmit(data: Buffer, responseLength: number): Promise<Buffer>;
  }

  export interface Card {
    uid: string;
    atr: Buffer;
    type: string;
    standard?: string;
  }
}
