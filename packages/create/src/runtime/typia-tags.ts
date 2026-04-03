import type {} from 'typia';

declare module 'typia' {
  export namespace tags {
    export type Source<Value extends 'html' | 'text' | 'rich-text'> = {
      readonly __wpTypiaSource?: Value;
    };

    export type Selector<Value extends string> = {
      readonly __wpTypiaSelector?: Value;
    };
  }
}

export {};
