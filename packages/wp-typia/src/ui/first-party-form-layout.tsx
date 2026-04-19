import {
  createElement,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';

import { useScopedKeyboard } from '@bunli/runtime/app';
import {
  Spinner,
  useTuiTheme,
} from '@bunli/tui';

import type { AlternateBufferCompletionPayload } from './alternate-buffer-lifecycle';
import {
  isCompletionEndKey,
  isCompletionHomeKey,
  isCompletionLineDownKey,
  isCompletionLineUpKey,
  isCompletionPageDownKey,
  isCompletionPageUpKey,
} from './first-party-form-keyboard';

export function FirstPartyScrollBox({
  children,
  scrollTop,
  viewportHeight,
}: {
  children?: ReactNode;
  scrollTop: number;
  viewportHeight: number;
}) {
  const { tokens } = useTuiTheme();
  const bodyRef = useRef<{ scrollTop: number } | null>(null);

  useEffect(() => {
    if (!bodyRef.current) {
      return;
    }

    bodyRef.current.scrollTop = scrollTop;
  }, [scrollTop]);

  return createElement(
    'scrollbox',
    {
      ref: bodyRef,
      height: viewportHeight,
      scrollY: true,
      scrollbarOptions: {
        visible: true,
        trackOptions: {
          backgroundColor: tokens.backgroundMuted,
          foregroundColor: tokens.borderMuted,
        },
      },
      viewportOptions: { width: '100%' },
      contentOptions: { width: '100%' },
    },
    createElement(
      'box',
      { width: '100%', style: { flexDirection: 'column' } },
      children,
    ),
  );
}

export function FirstPartySubmittingSurface({
  description = 'Please wait while wp-typia finishes this command.',
  title = 'Submitting...',
  viewportHeight,
}: {
  description?: string;
  title?: string;
  viewportHeight: number;
}) {
  const { tokens } = useTuiTheme();

  return createElement(
    'box',
    {
      border: true,
      height: viewportHeight,
      width: '100%',
      'data-form-surface': 'submitting',
      style: {
        alignItems: 'center',
        borderColor: tokens.borderMuted,
        flexDirection: 'column',
        gap: 1,
        justifyContent: 'center',
      },
    },
    createElement(Spinner, {
      title,
      variant: 'dot',
    }),
    createElement('text', {
      content: description,
      fg: tokens.textMuted,
    }),
  );
}

export function FirstPartyFormViewport({
  children,
  isSubmitting = false,
  scrollTop,
  submittingDescription,
  submittingTitle,
  viewportHeight,
}: {
  children?: ReactNode;
  isSubmitting?: boolean;
  scrollTop: number;
  submittingDescription?: string;
  submittingTitle?: string;
  viewportHeight: number;
}) {
  if (isSubmitting) {
    return createElement(FirstPartySubmittingSurface, {
      description: submittingDescription,
      title: submittingTitle,
      viewportHeight,
    });
  }

  return createElement(FirstPartyScrollBox, {
    scrollTop,
    viewportHeight,
    children,
  });
}

export function FirstPartyCompletionViewport({
  completion,
  viewportHeight,
}: {
  completion: AlternateBufferCompletionPayload;
  viewportHeight: number;
}) {
  const { tokens } = useTuiTheme();
  const reactScopeId = useId();
  const keyboardScopeId = `first-party-completion:${reactScopeId}`;
  const bodyHeight = Math.max(4, viewportHeight - 3);
  const bodyRef = useRef<{ scrollTop: number } | null>(null);

  const setCompletionScrollTop = useCallback((nextScrollTop: number) => {
    if (!bodyRef.current) {
      return false;
    }

    bodyRef.current.scrollTop = Math.max(0, nextScrollTop);
    return true;
  }, []);

  const adjustCompletionScrollTop = useCallback(
    (delta: number) => {
      if (!bodyRef.current) {
        return false;
      }

      bodyRef.current.scrollTop = Math.max(0, bodyRef.current.scrollTop + delta);
      return true;
    },
    [],
  );

  useScopedKeyboard(
    keyboardScopeId,
    (key) => {
      if (isCompletionLineDownKey(key)) {
        return adjustCompletionScrollTop(1);
      }
      if (isCompletionLineUpKey(key)) {
        return adjustCompletionScrollTop(-1);
      }
      if (isCompletionPageDownKey(key)) {
        return adjustCompletionScrollTop(Math.max(1, bodyHeight - 1));
      }
      if (isCompletionPageUpKey(key)) {
        return adjustCompletionScrollTop(-Math.max(1, bodyHeight - 1));
      }
      if (isCompletionHomeKey(key)) {
        return setCompletionScrollTop(0);
      }
      if (isCompletionEndKey(key)) {
        return setCompletionScrollTop(Number.MAX_SAFE_INTEGER);
      }

      return false;
    },
    { active: true },
  );

  return createElement(
    'box',
    {
      border: true,
      height: viewportHeight,
      width: '100%',
      'data-form-surface': 'completed',
      style: {
        borderColor: tokens.borderMuted,
        flexDirection: 'column',
      },
    },
    createElement(
      'scrollbox',
      {
        ref: bodyRef,
        height: bodyHeight,
        scrollY: true,
        scrollbarOptions: {
          visible: true,
          trackOptions: {
            backgroundColor: tokens.backgroundMuted,
            foregroundColor: tokens.borderMuted,
          },
        },
        viewportOptions: { width: '100%' },
        contentOptions: { width: '100%' },
      },
      createElement(
        'box',
        {
          width: '100%',
          style: {
            flexDirection: 'column',
            gap: 1,
          },
        },
        createElement('text', {
          content: completion.title,
          fg: tokens.accent,
        }),
        ...(completion.preambleLines ?? []).map((line, index) =>
          createElement('text', {
            content: line,
            fg: tokens.textMuted,
            key: `preamble:${index}`,
          }),
        ),
        ...(completion.warningLines ?? []).map((line, index) =>
          createElement('text', {
            content: `⚠️ ${line}`,
            fg: tokens.textWarning,
            key: `warning:${index}`,
          }),
        ),
        ...(completion.summaryLines ?? []).map((line, index) =>
          createElement('text', {
            content: line,
            fg: tokens.textPrimary,
            key: `summary:${index}`,
          }),
        ),
        (completion.nextSteps?.length ?? 0) > 0
          ? createElement('text', {
              content: 'Next steps:',
              fg: tokens.textPrimary,
              key: 'next-steps:title',
            })
          : null,
        ...(completion.nextSteps ?? []).map((line, index) =>
          createElement('text', {
            content: `  ${line}`,
            fg: tokens.textPrimary,
            key: `next-step:${index}`,
          }),
        ),
        (completion.optionalLines?.length ?? 0) > 0
          ? createElement('text', {
              content: completion.optionalTitle ?? 'Optional:',
              fg: tokens.textPrimary,
              key: 'optional:title',
            })
          : null,
        ...(completion.optionalLines ?? []).map((line, index) =>
          createElement('text', {
            content: `  ${line}`,
            fg: tokens.textMuted,
            key: `optional:${index}`,
          }),
        ),
        completion.optionalNote
          ? createElement('text', {
              content: `Note: ${completion.optionalNote}`,
              fg: tokens.textMuted,
              key: 'optional:note',
            })
          : null,
      ),
    ),
    createElement('text', {
      content: 'PgUp/PgDn | ↑/↓ | Home/End | Enter: close | q: exit | Ctrl+C: quit',
      fg: tokens.textMuted,
    }),
  );
}
