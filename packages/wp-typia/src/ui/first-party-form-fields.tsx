import {
  createElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
} from 'react';

import { useScopedKeyboard } from '@bunli/runtime/app';
import {
  type SelectOption,
  useFormField,
  useTuiTheme,
} from '@bunli/tui';

import {
  FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT,
  FIRST_PARTY_FIELD_GAP,
  FIRST_PARTY_SELECT_FIELD_CONTROL_HEIGHT,
  FIRST_PARTY_SELECT_FIELD_LABEL_GAP,
} from './first-party-form-model';
import {
  isCheckboxToggleKey,
  isSelectNextKey,
  isSelectPreviousKey,
  useFirstPartyFieldNavigation,
} from './first-party-form-keyboard';

export function FirstPartyTextField({
  defaultValue = '',
  description,
  label,
  name,
  nextFieldName,
  placeholder,
  previousFieldName,
  required,
}: {
  defaultValue?: string;
  description?: string;
  label: string;
  name: string;
  nextFieldName?: string;
  placeholder?: string;
  previousFieldName?: string;
  required?: boolean;
}) {
  const { tokens } = useTuiTheme();
  const reactScopeId = useId();
  const field = useFormField<string>(name, {
    defaultValue,
    submitOnEnter: true,
  });
  const keyboardScopeId = `first-party-text:${name}:${reactScopeId}`;

  useFirstPartyFieldNavigation({
    focused: field.focused,
    keyboardScopeId,
    nextFieldName,
    previousFieldName,
  });

  return createElement(
    'box',
    { style: { flexDirection: 'column', marginBottom: FIRST_PARTY_FIELD_GAP, gap: 1 } },
    createElement('text', {
      content: `${field.focused ? '>' : ' '} ${label}${required ? ' *' : ''}`,
      fg: field.focused ? tokens.accent : tokens.textPrimary,
    }),
    description
      ? createElement('text', {
          content: description,
          fg: tokens.textMuted,
        })
      : null,
    createElement(
      'box',
      {
        border: true,
        height: 3,
        style: {
          borderColor: field.error
            ? tokens.textDanger
            : field.focused
              ? tokens.accent
              : tokens.borderMuted,
        },
      },
      createElement('input', {
        focused: field.focused,
        onInput: (nextValue: string) => {
          field.setValue(nextValue);
        },
        onSubmit: (submittedValue: string) => {
          field.setValue(submittedValue);
          field.blur();
        },
        placeholder,
        style: {
          focusedBackgroundColor: tokens.backgroundMuted,
        },
        value: field.value ?? '',
      }),
    ),
    field.error
      ? createElement('text', { content: field.error, fg: tokens.textDanger })
      : null,
  );
}

export function FirstPartySelectField({
  defaultValue,
  label,
  name,
  nextFieldName,
  options,
  previousFieldName,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  nextFieldName?: string;
  options: SelectOption[];
  previousFieldName?: string;
}) {
  const { tokens } = useTuiTheme();
  const reactScopeId = useId();
  const field = useFormField<string>(name, {
    defaultValue: defaultValue ?? String(options[0]?.value ?? ''),
    submitOnEnter: false,
  });

  const matchingIndex = useMemo(
    () => options.findIndex((option) => option.value === field.value),
    [field.value, options],
  );
  const selectedIndex = matchingIndex >= 0 ? matchingIndex : 0;

  const selectedOption = options[selectedIndex] ?? options[0];
  const navigationScopeId = `first-party-select:${name}:${reactScopeId}:nav`;
  const selectionScopeId = `first-party-select:${name}:${reactScopeId}:select`;

  useEffect(() => {
    const fallbackOption = options[0];
    if (!fallbackOption || matchingIndex >= 0) {
      return;
    }

    const fallbackValue = String(fallbackOption.value);
    if (field.value === fallbackValue) {
      return;
    }

    field.setValue(fallbackValue);
  }, [field.setValue, field.value, matchingIndex, options]);

  useFirstPartyFieldNavigation({
    focused: field.focused,
    keyboardScopeId: navigationScopeId,
    nextFieldName,
    previousFieldName,
  });

  const moveSelection = useCallback(
    (delta: number) => {
      if (!selectedOption || options.length === 0) {
        return;
      }

      const nextIndex = (selectedIndex + delta + options.length) % options.length;
      const nextOption = options[nextIndex];
      if (!nextOption) {
        return;
      }

      field.setValue(String(nextOption.value));
    },
    [field, options, selectedIndex, selectedOption],
  );

  useScopedKeyboard(
    selectionScopeId,
    (key) => {
      if (!field.focused) {
        return false;
      }

      if (isSelectNextKey(key)) {
        moveSelection(1);
        return true;
      }

      if (isSelectPreviousKey(key)) {
        moveSelection(-1);
        return true;
      }

      return false;
    },
    { active: field.focused },
  );

  return createElement(
    'box',
    {
      style: {
        flexDirection: 'column',
        gap: FIRST_PARTY_SELECT_FIELD_LABEL_GAP,
        marginBottom: FIRST_PARTY_FIELD_GAP,
      },
    },
    createElement('text', {
      content: `${field.focused ? '>' : ' '} ${label}`,
      fg: field.focused ? tokens.accent : tokens.textPrimary,
    }),
    createElement(
      'box',
      {
        border: true,
        height: FIRST_PARTY_SELECT_FIELD_CONTROL_HEIGHT,
        style: {
          borderColor: field.error
            ? tokens.textDanger
            : field.focused
              ? tokens.accent
              : tokens.borderMuted,
        },
      },
      createElement('text', {
        content: `${field.focused ? '▶' : ' '} ${selectedOption?.name ?? ''}`,
        fg: field.focused ? tokens.accent : tokens.textPrimary,
      }),
    ),
    selectedOption?.description
      ? createElement('text', {
          content: `  ${selectedOption.description}`,
          fg: tokens.textMuted,
        })
      : null,
    field.error
      ? createElement('text', { content: field.error, fg: tokens.textDanger })
      : null,
  );
}

export function FirstPartyCheckboxField({
  label,
  name,
  nextFieldName,
  previousFieldName,
}: {
  label: string;
  name: string;
  nextFieldName?: string;
  previousFieldName?: string;
}) {
  const { tokens } = useTuiTheme();
  const reactScopeId = useId();
  const field = useFormField<boolean>(name, {
    defaultValue: false,
    submitOnEnter: false,
  });
  const navigationScopeId = `first-party-checkbox:${name}:${reactScopeId}:nav`;
  const toggleScopeId = `first-party-checkbox:${name}:${reactScopeId}:toggle`;

  useFirstPartyFieldNavigation({
    focused: field.focused,
    keyboardScopeId: navigationScopeId,
    nextFieldName,
    previousFieldName,
  });

  const toggle = useCallback(() => {
    field.setValue(!field.value);
  }, [field]);

  useScopedKeyboard(
    toggleScopeId,
    (key) => {
      if (!field.focused) {
        return false;
      }

      if (isCheckboxToggleKey(key)) {
        toggle();
        return true;
      }

      return false;
    },
    { active: field.focused },
  );

  return createElement(
    'box',
    {
      style: {
        flexDirection: 'column',
        height: FIRST_PARTY_CHECKBOX_FIELD_BODY_HEIGHT,
        marginBottom: FIRST_PARTY_FIELD_GAP,
      },
    },
    createElement('text', {
      content: `${field.focused ? '>' : ' '} ${field.value ? '[x]' : '[ ]'} ${label}`,
      fg: field.focused ? tokens.accent : tokens.textPrimary,
    }),
    field.error
      ? createElement('text', { content: field.error, fg: tokens.textDanger })
      : null,
  );
}
