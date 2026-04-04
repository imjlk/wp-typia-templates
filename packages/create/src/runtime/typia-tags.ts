/**
 * Augments `typia.tags` with wp-typia metadata tags consumed by the
 * block attribute projection pipeline.
 *
 * This module is imported for its declaration side effects so generated
 * projects can use `tags.Source` and `tags.Selector` during compile time.
 */
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
