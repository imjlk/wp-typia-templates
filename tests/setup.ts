import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Mock WordPress globals
global.wp = {
  blocks: {},
  element: {},
  components: {},
  blockEditor: {},
  data: {},
  i18n: {
    __: (str: string) => str,
    _x: (str: string) => str,
    _n: (single: string, plural: string, num: number) => num === 1 ? single : plural,
  },
} as any;

// Mock Web APIs
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }),
  },
});