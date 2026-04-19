import { useScopedKeyboard } from '@bunli/runtime/app';
import {
  createKeyMatcher,
  useFormContext,
} from '@bunli/tui';

const checkboxKeymap = createKeyMatcher({
  toggle: ['space', 'enter'],
});

const navigationKeymap = createKeyMatcher({
  nextField: ['tab'],
  previousField: ['shift+tab'],
});

const submitShortcutKeymap = createKeyMatcher({
  submitShortcut: ['ctrl+s'],
});

const selectKeymap = createKeyMatcher({
  next: ['down', 'enter', 'right', 'space'],
  previous: ['left', 'up'],
});

type KeyboardKey = Parameters<typeof checkboxKeymap.match>[1];

function isNextFieldKey(key: KeyboardKey) {
  return (
    navigationKeymap.match('nextField', key) ||
    key.sequence === '\t' ||
    (key.ctrl === true && key.name === 'i' && key.shift !== true)
  );
}

function isPreviousFieldKey(key: KeyboardKey) {
  return (
    navigationKeymap.match('previousField', key) ||
    key.sequence === '\u001b[Z' ||
    (key.name === 'tab' && key.shift === true)
  );
}

function isSubmitShortcutKey(key: KeyboardKey) {
  return (
    submitShortcutKeymap.match('submitShortcut', key) ||
    key.sequence === '\x13' ||
    (key.ctrl === true && key.name === 's')
  );
}

export function isSelectNextKey(key: KeyboardKey) {
  return (
    selectKeymap.match('next', key) ||
    key.sequence === '\x1b[B' ||
    key.sequence === '\x1b[C' ||
    key.name === 'down' ||
    key.name === 'right' ||
    key.sequence === ' '
  );
}

export function isSelectPreviousKey(key: KeyboardKey) {
  return (
    selectKeymap.match('previous', key) ||
    key.sequence === '\x1b[A' ||
    key.sequence === '\x1b[D' ||
    key.name === 'up' ||
    key.name === 'left'
  );
}

export function isCheckboxToggleKey(key: KeyboardKey) {
  return (
    checkboxKeymap.match('toggle', key) ||
    key.sequence === ' ' ||
    key.sequence === '\r' ||
    key.sequence === '\n'
  );
}

export function isCompletionLineDownKey(key: KeyboardKey) {
  return key.name === 'down' || key.sequence === '\x1b[B';
}

export function isCompletionLineUpKey(key: KeyboardKey) {
  return key.name === 'up' || key.sequence === '\x1b[A';
}

export function isCompletionPageDownKey(key: KeyboardKey) {
  return key.name === 'pagedown' || key.sequence === '\x1b[6~' || key.sequence === ' ';
}

export function isCompletionPageUpKey(key: KeyboardKey) {
  return key.name === 'pageup' || key.sequence === '\x1b[5~';
}

export function isCompletionHomeKey(key: KeyboardKey) {
  return key.name === 'home' || key.sequence === '\x1b[H' || key.sequence === '\x1bOH';
}

export function isCompletionEndKey(key: KeyboardKey) {
  return key.name === 'end' || key.sequence === '\x1b[F' || key.sequence === '\x1bOF';
}

export function useFirstPartyFieldNavigation(options: {
  focused: boolean;
  keyboardScopeId: string;
  nextFieldName?: string;
  previousFieldName?: string;
}) {
  const { focusField, submit } = useFormContext();
  const { focused, keyboardScopeId, nextFieldName, previousFieldName } = options;

  useScopedKeyboard(
    keyboardScopeId,
    (key) => {
      if (!focused) {
        return false;
      }

      if (isSubmitShortcutKey(key)) {
        submit();
        return true;
      }

      if (isNextFieldKey(key) && nextFieldName) {
        focusField(nextFieldName);
        return true;
      }

      if (isPreviousFieldKey(key) && previousFieldName) {
        focusField(previousFieldName);
        return true;
      }

      return false;
    },
    { active: focused },
  );
}
