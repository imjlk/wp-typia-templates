/**
 * Built-in emitter template bodies grouped away from artifact assembly so
 * authoring stays focused on the emitted TS/TSX/PHP sources themselves.
 */

export const SHARED_HOOKS_TEMPLATE = `import { useMemo } from '@wordpress/element';

import {
	createUseTypiaValidationHook,
	formatValidationError,
	formatValidationErrors,
} from '@wp-typia/block-runtime/validation';

export {
	formatValidationError,
	formatValidationErrors,
	type TypiaValidationError,
	type ValidationResult,
	type ValidationState,
} from '@wp-typia/block-runtime/validation';

export const useTypiaValidation = createUseTypiaValidationHook( {
	useMemo,
} );
`;

export const BLOCK_METADATA_WRAPPER_TEMPLATE = `import rawMetadata from './block.json';
import { defineScaffoldBlockMetadata } from '@wp-typia/block-runtime/blocks';

const metadata = defineScaffoldBlockMetadata(rawMetadata);

export default metadata;
`;

export const MANIFEST_DOCUMENT_WRAPPER_TEMPLATE = `import rawCurrentManifest from './typia.manifest.json';
import { defineManifestDocument } from '@wp-typia/block-runtime/editor';

const currentManifest = defineManifestDocument(rawCurrentManifest);

export default currentManifest;
`;

export const MANIFEST_DEFAULTS_DOCUMENT_WRAPPER_TEMPLATE = `import rawCurrentManifest from './typia.manifest.json';
import { defineManifestDefaultsDocument } from '@wp-typia/block-runtime/defaults';

const currentManifest = defineManifestDefaultsDocument(rawCurrentManifest);

export default currentManifest;
`;

export const BASIC_EDIT_TEMPLATE = `/**
 * Editor component for {{title}} Block
 */

import type { BlockEditProps } from '@wp-typia/block-types/blocks/registration';
import {
  InspectorControls,
  RichText,
  useBlockProps,
} from '@wordpress/block-editor';
import { Notice, PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import currentManifest from './manifest-document';
import {
  InspectorFromManifest,
  useEditorFields,
  useTypedAttributeUpdater,
} from '@wp-typia/block-runtime/inspector';
import { {{pascalCase}}Attributes } from './types';
import {
  sanitize{{pascalCase}}Attributes,
  validate{{pascalCase}}Attributes,
} from './validators';
import { useTypiaValidation } from './hooks';

type EditProps = BlockEditProps<{{pascalCase}}Attributes>;

const validationErrorItemStyle = { color: '#cc1818', fontSize: '12px' };
const validationListStyle = { margin: 0, paddingLeft: '1em' };

function Edit({ attributes, setAttributes }: EditProps) {
  const isVisible = attributes.isVisible !== false;
  const blockProps = useBlockProps({
    className: \`{{cssClassName}}\${isVisible ? '' : ' is-hidden'}\`,
  });
  const editorFields = useEditorFields(currentManifest, {
    hidden: ['id', 'schemaVersion'],
    manual: ['content'],
    labels: {
      alignment: __('Alignment', '{{textDomain}}'),
      className: __('CSS Class', '{{textDomain}}'),
      content: __('Content', '{{textDomain}}'),
      isVisible: __('Visible', '{{textDomain}}'),
    },
  });
  const classNameField = editorFields.getField('className');
  const { errorMessages, isValid } = useTypiaValidation(
    attributes,
    validate{{pascalCase}}Attributes
  );
  const validateEditorUpdate = (nextAttributes: {{pascalCase}}Attributes) => {
    try {
      return {
        data: sanitize{{pascalCase}}Attributes(nextAttributes),
        errors: [],
        isValid: true as const,
      };
    } catch {
      return validate{{pascalCase}}Attributes(nextAttributes);
    }
  };
  const { updateField } = useTypedAttributeUpdater(
    attributes,
    setAttributes,
    validateEditorUpdate
  );

  return (
    <>
      <InspectorControls>
        <InspectorFromManifest
          attributes={attributes}
          fieldLookup={editorFields}
          onChange={updateField}
          paths={['alignment', 'isVisible']}
          title={__('Settings', '{{textDomain}}')}
        >
          <TextControl
            label={__('Content', '{{textDomain}}')}
            value={attributes.content || ''}
            onChange={(value) => updateField('content', value)}
            help={__('Mirrors the main block content.', '{{textDomain}}')}
          />

          <TextControl
            label={classNameField?.label || __('CSS Class', '{{textDomain}}')}
            value={attributes.className || ''}
            onChange={(value) => updateField('className', value)}
            help={__('Add an optional CSS class name.', '{{textDomain}}')}
          />
        </InspectorFromManifest>

        {!isValid && (
          <PanelBody title={__('Validation Errors', '{{textDomain}}')} initialOpen>
            {errorMessages.map((error, index) => (
              <div key={index} style={validationErrorItemStyle}>
                • {error}
              </div>
            ))}
          </PanelBody>
        )}
      </InspectorControls>

      <div {...blockProps}>
        <div className="{{cssClassName}}__content">
          <RichText
            tagName="p"
            value={attributes.content || ''}
            onChange={(value) => updateField('content', value)}
            placeholder={__('Add your content...', '{{textDomain}}')}
          />
        </div>
        {!isValid && (
          <Notice status="error" isDismissible={false}>
            <p>
              <strong>{__('Validation Errors', '{{textDomain}}')}</strong>
            </p>
            <ul style={validationListStyle}>
              {errorMessages.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Notice>
        )}
      </div>
    </>
  );
}

export default Edit;
`;

export const BASIC_SAVE_TEMPLATE = `/**
 * Save/Frontend component for {{title}} Block
 */

import { RichText, useBlockProps } from '@wordpress/block-editor';
import { {{pascalCase}}Attributes } from './types';

interface SaveProps {
  attributes: {{pascalCase}}Attributes;
}

export default function Save({ attributes }: SaveProps) {
  const isVisible = attributes.isVisible !== false;
  const blockProps = useBlockProps.save({
    className: \`{{cssClassName}}\${isVisible ? '' : ' is-hidden'}\`,
    hidden: isVisible ? undefined : true,
    'aria-hidden': isVisible ? undefined : 'true',
  });

  return (
    <div {...blockProps}>
      <div
        className="{{cssClassName}}__content"
        data-align={attributes.alignment || 'left'}
      >
        <RichText.Content tagName="p" value={attributes.content} />
      </div>
    </div>
  );
}
`;

export const BASIC_INDEX_TEMPLATE = `/**
 * WordPress {{title}} Block
 *
 * Typia-powered type-safe block
 */

import {
  registerScaffoldBlockType,
  type BlockConfiguration,
} from '@wp-typia/block-types/blocks/registration';
import type { BlockSupports } from '@wp-typia/block-types/blocks/supports';
import { __ } from '@wordpress/i18n';
import {
  buildScaffoldBlockRegistration,
  parseScaffoldBlockMetadata,
} from '@wp-typia/block-runtime/blocks';

// Import components
import Edit from './edit';
import Save from './save';
import metadata from './block-metadata';
import './editor.scss';
import './style.scss';

// Import types
import { {{pascalCase}}Attributes } from './types';
import { validators } from './validators';

const scaffoldSupports = {
  html: false,
  multiple: true,
  align: ['wide', 'full'],
} satisfies BlockSupports;

// Register the block
const registration = buildScaffoldBlockRegistration(
  parseScaffoldBlockMetadata<BlockConfiguration<{{pascalCase}}Attributes>>(metadata),
  {
    supports: scaffoldSupports,
    example: {
      attributes: validators.random(),
    },
    edit: Edit,
    save: Save,
  }
);

registerScaffoldBlockType(registration.name, registration.settings);
`;

export const BASIC_VALIDATORS_TEMPLATE = `import typia from 'typia';
import currentManifest from "./manifest-defaults-document";
import { {{pascalCase}}Attributes, {{pascalCase}}ValidationResult } from "./types";
import { generateBlockId } from "@wp-typia/block-runtime/identifiers";
import { createTemplateValidatorToolkit } from "./validator-toolkit";

const scaffoldValidators = createTemplateValidatorToolkit<{{pascalCase}}Attributes>({
  assert: typia.createAssert<{{pascalCase}}Attributes>(),
  clone: typia.misc.createClone<{{pascalCase}}Attributes>() as (
    value: {{pascalCase}}Attributes,
  ) => {{pascalCase}}Attributes,
  is: typia.createIs<{{pascalCase}}Attributes>(),
  manifest: currentManifest,
  prune: typia.misc.createPrune<{{pascalCase}}Attributes>(),
  random: typia.createRandom<{{pascalCase}}Attributes>() as (
    ...args: unknown[]
  ) => {{pascalCase}}Attributes,
  finalize: (normalized) => ({
    ...normalized,
    id: normalized.id && normalized.id.length > 0 ? normalized.id : generateBlockId(),
  }),
  validate: typia.createValidate<{{pascalCase}}Attributes>(),
});

export const validate{{pascalCase}}Attributes =
  scaffoldValidators.validateAttributes as (
    attributes: unknown,
  ) => {{pascalCase}}ValidationResult;

export const validators = scaffoldValidators.validators;

export const sanitize{{pascalCase}}Attributes =
  scaffoldValidators.sanitizeAttributes as (
    attributes: Partial<{{pascalCase}}Attributes>,
  ) => {{pascalCase}}Attributes;

export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;
`;

export const INTERACTIVITY_EDIT_TEMPLATE = `import type { BlockEditProps } from '@wp-typia/block-types/blocks/registration';
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls, RichText, BlockControls, AlignmentToolbar } from '@wordpress/block-editor';
import { PanelBody, RangeControl, Button, Notice } from '@wordpress/components';
import { useState } from '@wordpress/element';
import currentManifest from './manifest-document';
import {
  InspectorFromManifest,
  useEditorFields,
  useTypedAttributeUpdater,
} from '@wp-typia/block-runtime/inspector';
import type { {{pascalCase}}Attributes } from './types';
import {
  sanitize{{pascalCase}}Attributes,
  validate{{pascalCase}}Attributes,
} from './validators';
import { useTypiaValidation } from './hooks';

type EditProps = BlockEditProps<{{pascalCase}}Attributes>;

const actionButtonRowStyle = { display: 'flex', gap: '8px', marginTop: '16px' };
const validationListStyle = { margin: 0, paddingLeft: '1em' };

export default function Edit({ attributes, setAttributes, isSelected }: EditProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const editorFields = useEditorFields(currentManifest, {
    manual: ['content', 'clickCount', 'maxClicks'],
    labels: {
      alignment: __('Alignment', '{{textDomain}}'),
      animation: __('Animation', '{{textDomain}}'),
      interactiveMode: __('Interactive Mode', '{{textDomain}}'),
      isVisible: __('Visible', '{{textDomain}}'),
      showCounter: __('Show Counter', '{{textDomain}}'),
    },
  });
  const { errorMessages, isValid } = useTypiaValidation(
    attributes,
    validate{{pascalCase}}Attributes,
  );
  const validateEditorUpdate = (nextAttributes: {{pascalCase}}Attributes) => {
    try {
      return {
        data: sanitize{{pascalCase}}Attributes(nextAttributes),
        errors: [],
        isValid: true as const,
      };
    } catch {
      return validate{{pascalCase}}Attributes(nextAttributes);
    }
  };
  const { updateField } = useTypedAttributeUpdater(
    attributes,
    setAttributes,
    validateEditorUpdate
  );
  const alignmentValue = editorFields.getStringValue(
    attributes,
    'alignment',
    'left'
  ) as NonNullable<{{pascalCase}}Attributes['alignment']>;
  const clickCount = attributes.clickCount ?? 0;
  const isVisible = editorFields.getBooleanValue(
    attributes,
    'isVisible',
    true
  );
  const isAnimating = attributes.isAnimating ?? false;
  const maxClicks = attributes.maxClicks ?? 0;
  const showCounter = editorFields.getBooleanValue(
    attributes,
    'showCounter',
    true
  );
  const interactiveMode = editorFields.getStringValue(
    attributes,
    'interactiveMode',
    'click'
  ) as NonNullable<{{pascalCase}}Attributes['interactiveMode']>;
  const animation = editorFields.getStringValue(
    attributes,
    'animation',
    'none'
  ) as NonNullable<{{pascalCase}}Attributes['animation']>;

  const blockProps = useBlockProps({
    className: \`{{cssClassName}} {{cssClassName}}--\${interactiveMode}\`,
    'data-wp-interactive': '{{slugKebabCase}}',
    'data-wp-context': JSON.stringify({
      clicks: clickCount,
      isAnimating,
      isVisible,
      animation,
      maxClicks,
    })
  });
  const previewContentStyle = { textAlign: alignmentValue };
  const progressBarStyle = { width: \`\${(clickCount / maxClicks) * 100}%\` };

  const resetCounter = () => {
    updateField('clickCount', 0);
    updateField('isAnimating', false);
  };

  const testAnimation = () => {
    updateField('isAnimating', true);
    setTimeout(() => {
      updateField('isAnimating', false);
    }, 1000);
  };

  return (
    <>
      <BlockControls>
        <AlignmentToolbar
          value={alignmentValue}
          onChange={(value) => updateField('alignment', (value || alignmentValue) as NonNullable<{{pascalCase}}Attributes['alignment']>)}
        />
      </BlockControls>

      <InspectorControls>
        <InspectorFromManifest
          attributes={attributes}
          fieldLookup={editorFields}
          onChange={updateField}
          paths={['alignment', 'interactiveMode', 'animation', 'showCounter', 'isVisible']}
          title={__('Interactive Settings', '{{textDomain}}')}
        />

        <PanelBody title={__('Counter Settings', '{{textDomain}}')}>
          <RangeControl
            label={__('Max Clicks', '{{textDomain}}')}
            value={maxClicks}
            onChange={(value) => updateField('maxClicks', value ?? maxClicks)}
            min={0}
            max={100}
            help={__('Set to 0 for unlimited clicks', '{{textDomain}}')}
          />

          <div style={actionButtonRowStyle}>
            <Button
              variant="secondary"
              onClick={resetCounter}
              isSmall
            >
              {__('Reset Counter', '{{textDomain}}')}
            </Button>
            <Button
              variant="secondary"
              onClick={testAnimation}
              isSmall
            >
              {__('Test Animation', '{{textDomain}}')}
            </Button>
          </div>
        </PanelBody>

        {!isValid && (
          <PanelBody title={__('Validation Errors', '{{textDomain}}')} initialOpen>
            {errorMessages.map((error, index) => (
              <Notice key={index} status="error" isDismissible={false}>
                {error}
              </Notice>
            ))}
          </PanelBody>
        )}

        {isSelected && (
          <PanelBody title={__('Preview', '{{textDomain}}')}>
            <Button
              variant={isPreviewing ? 'primary' : 'secondary'}
              onClick={() => setIsPreviewing(!isPreviewing)}
              aria-pressed={isPreviewing}
              isSmall
            >
              {isPreviewing
                ? __('Disable Preview Mode', '{{textDomain}}')
                : __('Enable Preview Mode', '{{textDomain}}')}
            </Button>

            {clickCount > 0 && (
              <Notice status="info" isDismissible={false}>
                {__('Current clicks:', '{{textDomain}}')} {clickCount}
                {maxClicks > 0 && \` / \${maxClicks}\`}
              </Notice>
            )}
          </PanelBody>
        )}
      </InspectorControls>

      <div {...blockProps}>
        <div
          className={\`{{cssClassName}}__content \${isAnimating ? 'is-animating' : ''}\`}
          style={previewContentStyle}
          data-wp-on--click={isPreviewing ? 'actions.handleClick' : undefined}
          data-wp-on--mouseenter={isPreviewing && interactiveMode === 'hover' ? 'actions.handleMouseEnter' : undefined}
          data-wp-on--mouseleave={isPreviewing && interactiveMode === 'hover' ? 'actions.handleMouseLeave' : undefined}
        >
          <RichText
            tagName="p"
            value={attributes.content}
            onChange={(value) => updateField('content', value)}
            placeholder={__( {{titleJson}} + ' – click me to interact!', '{{textDomain}}')}
          />

          {!isValid && (
            <Notice status="error" isDismissible={false}>
              <p>
                <strong>{__('Validation Errors', '{{textDomain}}')}</strong>
              </p>
              <ul style={validationListStyle}>
                {errorMessages.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Notice>
          )}

          {showCounter && (
            <div className="{{cssClassName}}__counter">
              <span className="{{cssClassName}}__counter-label">
                {__('Clicks:', '{{textDomain}}')}
              </span>
              <span
                className="{{cssClassName}}__counter-value"
                data-wp-text="state.clicks"
              >
                {clickCount}
              </span>
            </div>
          )}

          {maxClicks > 0 && (
            <div className="{{cssClassName}}__progress">
              <div
                className="{{cssClassName}}__progress-bar"
                style={progressBarStyle}
                data-wp-style--width="state.progress + '%'"
              />
            </div>
          )}

          {animation !== 'none' && (
            <div
              className={\`{{cssClassName}}__animation \${isAnimating ? 'is-active' : ''}\`}
              data-wp-class--is-active="state.isAnimating"
            >
              {animation}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
`;

export const INTERACTIVITY_SAVE_TEMPLATE = `import { useBlockProps, RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import type { {{pascalCase}}Attributes } from './types';

export default function Save({ attributes }: { attributes: {{pascalCase}}Attributes }) {
  const clickCount = attributes.clickCount ?? 0;
  const interactiveMode = attributes.interactiveMode ?? 'click';
  const animation = attributes.animation ?? 'none';
  const isAnimating = attributes.isAnimating ?? false;
  const isVisible = attributes.isVisible ?? true;
  const maxClicks = attributes.maxClicks ?? 0;
  const showCounter = attributes.showCounter ?? true;
  const contentStyle = { textAlign: attributes.alignment };
  const blockProps = useBlockProps.save({
    className: \`{{cssClassName}} {{cssClassName}}--\${interactiveMode}\`,
    'data-wp-interactive': '{{slugKebabCase}}',
    'data-wp-context': JSON.stringify({
      clicks: clickCount,
      isAnimating,
      isVisible,
      animation,
      maxClicks,
    })
  });

  return (
    <div {...blockProps}>
      <div
        className={\`{{cssClassName}}__content \${isAnimating ? 'is-animating' : ''}\`}
        style={contentStyle}
        data-wp-on--click="actions.handleClick"
        data-wp-on--mouseenter={interactiveMode === 'hover' ? 'actions.handleMouseEnter' : undefined}
        data-wp-on--mouseleave={interactiveMode === 'hover' ? 'actions.handleMouseLeave' : undefined}
        data-wp-bind--hidden="!state.isVisible"
      >
        <RichText.Content
          tagName="p"
          value={attributes.content}
          className="{{cssClassName}}__text"
        />

        {showCounter && (
          <div
            className="{{cssClassName}}__counter"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="{{cssClassName}}__counter-label">
              { __( 'Clicks:', '{{textDomain}}' ) }
            </span>
            <span
              className="{{cssClassName}}__counter-value"
              data-wp-text="state.clicks"
            >
              {clickCount}
            </span>
          </div>
        )}

        {maxClicks > 0 && (
          <div className="{{cssClassName}}__progress">
            <div
              className="{{cssClassName}}__progress-bar"
              role="progressbar"
              aria-label={ __( 'Click progress', '{{textDomain}}' ) }
              aria-valuemin={0}
              aria-valuemax={maxClicks}
              aria-valuenow={Math.min(clickCount, maxClicks)}
              data-wp-bind--aria-valuenow="state.clampedClicks"
              data-wp-style--width="state.progress + '%'"
            />
          </div>
        )}

        <div
          className={\`{{cssClassName}}__animation \${animation}\`}
          aria-hidden="true"
          data-wp-class--is-active="state.isAnimating"
        />

        {maxClicks > 0 && (
          <div
            className="{{cssClassName}}__completion"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            data-wp-bind--hidden="!state.isComplete"
          >
            { __( '🎉 Complete!', '{{textDomain}}' ) }
          </div>
        )}

        <button
          className="{{cssClassName}}__reset"
          data-wp-on--click="actions.reset"
          aria-label={ __( 'Reset counter', '{{textDomain}}' ) }
        >
          <span aria-hidden="true">↻</span>
          <span className="screen-reader-text">
            { __( 'Reset counter', '{{textDomain}}' ) }
          </span>
        </button>
      </div>
    </div>
  );
}
`;

export const INTERACTIVITY_INDEX_TEMPLATE = `import {
  registerScaffoldBlockType,
  type BlockConfiguration,
} from '@wp-typia/block-types/blocks/registration';
import type { BlockSupports } from '@wp-typia/block-types/blocks/supports';
import {
  buildScaffoldBlockRegistration,
  parseScaffoldBlockMetadata,
} from '@wp-typia/block-runtime/blocks';

import Edit from './edit';
import Save from './save';
import metadata from './block-metadata';
import './editor.scss';
import './style.scss';

import type { {{pascalCase}}Attributes } from './types';

const scaffoldSupports = {
  html: false,
  align: true,
  anchor: true,
  className: true,
  interactivity: true,
} satisfies BlockSupports;

const registration = buildScaffoldBlockRegistration(
  parseScaffoldBlockMetadata<BlockConfiguration<{{pascalCase}}Attributes>>(metadata),
  {
    supports: scaffoldSupports,
    edit: Edit,
    save: Save,
  }
);

registerScaffoldBlockType(registration.name, registration.settings);
`;

export const INTERACTIVITY_SCRIPT_TEMPLATE = `/**
 * WordPress Interactivity API implementation for {{title}} block
 */
import { store, getContext, getElement, withSyncEvent } from '@wordpress/interactivity';
import type { {{pascalCase}}Context } from './types';

function getBlockContext() {
  return getContext<{{pascalCase}}Context>();
}

// Store configuration
store('{{slugKebabCase}}', {
  // State - reactive data that updates the UI
  state: {
    get clicks() {
      return getBlockContext().clicks;
    },
    get isAnimating() {
      return getBlockContext().isAnimating;
    },
    get isVisible() {
      return getBlockContext().isVisible;
    },
    get progress() {
      const context = getBlockContext();
      const clampedClicks =
        context.maxClicks > 0
          ? Math.min(context.clicks, context.maxClicks)
          : context.clicks;
      return context.maxClicks > 0 ? (clampedClicks / context.maxClicks) * 100 : 0;
    },
    get clampedClicks() {
      const context = getBlockContext();
      return context.maxClicks > 0
        ? Math.min(context.clicks, context.maxClicks)
        : context.clicks;
    },
    get isComplete() {
      const context = getBlockContext();
      return context.clicks >= context.maxClicks && context.maxClicks > 0;
    }
  },

  // Actions - user interactions
  actions: {
    // Handle block click
    handleClick: () => {
      const context = getBlockContext();
      const { ref } = getElement();

      if (!ref) {
        return;
      }

      if (context.maxClicks > 0 && context.clicks >= context.maxClicks) {
        return;
      }

      const previousClicks = context.clicks;

      // Increment click counter
      context.clicks += 1;

      // Trigger animation
      if (context.animation !== 'none') {
        context.isAnimating = true;
        setTimeout(() => {
          context.isAnimating = false;
        }, 1000);
      }

      // Emit custom event
      ref.dispatchEvent(new CustomEvent('{{slugKebabCase}}:click', {
        detail: { clicks: context.clicks }
      }));

      // Check if max clicks reached
      if (context.maxClicks > 0 && previousClicks < context.maxClicks && context.clicks === context.maxClicks) {
        ref.dispatchEvent(new CustomEvent('{{slugKebabCase}}:complete', {
          detail: { totalClicks: context.clicks }
        }));
      }
    },

    // Handle hover events
    handleMouseEnter: () => {
      const context = getBlockContext();
      if (context.animation === 'none') return;
      context.isAnimating = true;
    },

    handleMouseLeave: () => {
      const context = getBlockContext();
      if (context.animation === 'none') return;
      context.isAnimating = false;
    },

    // Reset counter
    reset: withSyncEvent((event: Event) => {
      event.stopPropagation();
      const context = getBlockContext();
      context.clicks = 0;
      context.isAnimating = false;
    })
  }
});
`;

export const INTERACTIVITY_VALIDATORS_TEMPLATE = `import typia from 'typia';
import currentManifest from "./manifest-defaults-document";
import { {{pascalCase}}Attributes, {{pascalCase}}ValidationResult } from "./types";
import { createTemplateValidatorToolkit } from "./validator-toolkit";

const scaffoldValidators = createTemplateValidatorToolkit<{{pascalCase}}Attributes>({
  assert: typia.createAssert<{{pascalCase}}Attributes>(),
  clone: typia.misc.createClone<{{pascalCase}}Attributes>() as (
    value: {{pascalCase}}Attributes,
  ) => {{pascalCase}}Attributes,
  is: typia.createIs<{{pascalCase}}Attributes>(),
  manifest: currentManifest,
  prune: typia.misc.createPrune<{{pascalCase}}Attributes>(),
  random: typia.createRandom<{{pascalCase}}Attributes>() as (
    ...args: unknown[]
  ) => {{pascalCase}}Attributes,
  validate: typia.createValidate<{{pascalCase}}Attributes>(),
});

export const validate{{pascalCase}}Attributes =
  scaffoldValidators.validateAttributes as (
    attributes: unknown,
  ) => {{pascalCase}}ValidationResult;

export const validators = scaffoldValidators.validators;

export const sanitize{{pascalCase}}Attributes =
  scaffoldValidators.sanitizeAttributes as (
    attributes: Partial<{{pascalCase}}Attributes>,
  ) => {{pascalCase}}Attributes;

/**
 * Runtime type guard for checking if an object is {{pascalCase}}Attributes.
 */
export const is{{pascalCase}}Attributes = (obj: unknown): obj is {{pascalCase}}Attributes => {
  return validators.is(obj);
};

export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;
`;

export const PERSISTENCE_EDIT_TEMPLATE = `import type { BlockEditProps } from '@wp-typia/block-types/blocks/registration';
import { __ } from '@wordpress/i18n';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	TextControl,
} from '@wordpress/components';
import currentManifest from './manifest-document';
import {
	InspectorFromManifest,
	useEditorFields,
	useTypedAttributeUpdater,
} from '@wp-typia/block-runtime/inspector';
import type { {{pascalCase}}Attributes } from './types';
import {
	sanitize{{pascalCase}}Attributes,
	validate{{pascalCase}}Attributes,
} from './validators';
import { useTypiaValidation } from './hooks';

type EditProps = BlockEditProps< {{pascalCase}}Attributes >;

export default function Edit( {
	attributes,
	setAttributes,
}: EditProps ) {
	const editorFields = useEditorFields(
		currentManifest,
		{
			manual: [ 'content', 'resourceKey' ],
			labels: {
				buttonLabel: __( 'Button Label', '{{textDomain}}' ),
				resourceKey: __( 'Resource Key', '{{textDomain}}' ),
				showCount: __( 'Show Count', '{{textDomain}}' ),
			},
		}
	);
	const { errorMessages, isValid } = useTypiaValidation(
		attributes,
		validate{{pascalCase}}Attributes
	);
	const validateEditorUpdate = (
		nextAttributes: {{pascalCase}}Attributes
	) => {
		try {
			return {
				data: sanitize{{pascalCase}}Attributes( nextAttributes ),
				errors: [],
				isValid: true as const,
			};
		} catch {
			return validate{{pascalCase}}Attributes( nextAttributes );
		}
	};
	const { updateField } = useTypedAttributeUpdater(
		attributes,
		setAttributes,
		validateEditorUpdate
	);
	const alignmentValue = editorFields.getStringValue(
		attributes,
		'alignment',
		'left'
	);
	const persistencePolicy = '{{persistencePolicy}}';
	const persistencePolicyDescription = __(
		{{persistencePolicyDescriptionJson}},
		'{{textDomain}}'
	);

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ alignmentValue }
					onChange={ ( value ) =>
						updateField(
							'alignment',
							( value || alignmentValue ) as NonNullable< {{pascalCase}}Attributes[ 'alignment' ] >
						)
					}
				/>
			</BlockControls>
			<InspectorControls>
				<InspectorFromManifest
					attributes={ attributes }
					fieldLookup={ editorFields }
					onChange={ updateField }
					paths={ [ 'alignment', 'isVisible', 'showCount', 'buttonLabel' ] }
					title={ __( 'Persistence Settings', '{{textDomain}}' ) }
				>
					<TextControl
						label={ __( 'Resource Key', '{{textDomain}}' ) }
						value={ attributes.resourceKey ?? '' }
						onChange={ ( value ) => updateField( 'resourceKey', value ) }
						help={ __( 'Stable persisted identifier used by the storage-backed counter endpoint.', '{{textDomain}}' ) }
					/>
					<Notice status="info" isDismissible={ false }>
						{ __( 'Storage mode: {{dataStorageMode}}', '{{textDomain}}' ) }
					</Notice>
					<Notice status="info" isDismissible={ false }>
						{ __( 'Persistence policy: {{persistencePolicy}}', '{{textDomain}}' ) }
						<br />
						{ persistencePolicyDescription }
					</Notice>
					<Notice status="info" isDismissible={ false }>
						{ __( 'Render mode: dynamic. \`render.php\` bootstraps durable post context, while fresh session-only write data is loaded from the dedicated \`/bootstrap\` endpoint after hydration.', '{{textDomain}}' ) }
					</Notice>
				</InspectorFromManifest>
				{ ! isValid && (
					<PanelBody
						title={ __( 'Validation Errors', '{{textDomain}}' ) }
						initialOpen
					>
						{ errorMessages.map( ( error, index ) => (
							<Notice key={ index } status="error" isDismissible={ false }>
								{ error }
							</Notice>
						) ) }
					</PanelBody>
				) }
			</InspectorControls>
			<div
				{ ...useBlockProps( {
					className: '{{cssClassName}}',
					style: {
						textAlign:
							alignmentValue as NonNullable< {{pascalCase}}Attributes[ 'alignment' ] >,
					},
				} ) }
			>
				<RichText
					tagName="p"
					value={ attributes.content }
					onChange={ ( value ) => updateField( 'content', value ) }
					placeholder={ __( {{titleJson}} + ' persistence block', '{{textDomain}}' ) }
				/>
				<p className="{{cssClassName}}__meta">
					{ __( 'Resource key:', '{{textDomain}}' ) } { attributes.resourceKey || '—' }
				</p>
				<p className="{{cssClassName}}__meta">
					{ __( 'Storage mode:', '{{textDomain}}' ) } {{dataStorageMode}}
				</p>
				<p className="{{cssClassName}}__meta">
					{ __( 'Persistence policy:', '{{textDomain}}' ) } {{persistencePolicy}}
				</p>
				{ ! isValid && (
					<Notice status="error" isDismissible={ false }>
						<ul>
							{ errorMessages.map( ( error, index ) => <li key={ index }>{ error }</li> ) }
						</ul>
					</Notice>
				) }
			</div>
		</>
	);
}
`;

export const PERSISTENCE_INDEX_TEMPLATE = `import {
\tregisterScaffoldBlockType,
\ttype BlockConfiguration,
} from '@wp-typia/block-types/blocks/registration';
import {
	buildScaffoldBlockRegistration,
	parseScaffoldBlockMetadata,
} from '@wp-typia/block-runtime/blocks';

import Edit from './edit';
import Save from './save';
import metadata from './block-metadata';
import './style.scss';

import type { {{pascalCase}}Attributes } from './types';

const registration = buildScaffoldBlockRegistration(
	parseScaffoldBlockMetadata<BlockConfiguration< {{pascalCase}}Attributes >>( metadata ),
	{
		edit: Edit,
		save: Save,
	}
);

registerScaffoldBlockType(registration.name, registration.settings);
`;

export const PERSISTENCE_SAVE_TEMPLATE = `export default function Save() {
	// This block is intentionally server-rendered. PHP bootstraps post context,
	// storage-backed state, and write-policy data before the frontend hydrates.
	return null;
}
`;

export const PERSISTENCE_VALIDATORS_TEMPLATE = `import typia from 'typia';
import currentManifest from './manifest-defaults-document';
import type {
	{{pascalCase}}Attributes,
	{{pascalCase}}ValidationResult,
} from './types';
import { generateResourceKey } from '@wp-typia/block-runtime/identifiers';
import { createTemplateValidatorToolkit } from './validator-toolkit';

const scaffoldValidators = createTemplateValidatorToolkit< {{pascalCase}}Attributes >( {
	assert: typia.createAssert< {{pascalCase}}Attributes >(),
	clone: typia.misc.createClone< {{pascalCase}}Attributes >() as (
		value: {{pascalCase}}Attributes,
	) => {{pascalCase}}Attributes,
	is: typia.createIs< {{pascalCase}}Attributes >(),
	manifest: currentManifest,
	prune: typia.misc.createPrune< {{pascalCase}}Attributes >(),
	random: typia.createRandom< {{pascalCase}}Attributes >() as (
		...args: unknown[]
	) => {{pascalCase}}Attributes,
	finalize: ( normalized ) => ( {
		...normalized,
		resourceKey:
			normalized.resourceKey && normalized.resourceKey.length > 0
				? normalized.resourceKey
				: generateResourceKey( '{{slugKebabCase}}' ),
	} ),
	validate: typia.createValidate< {{pascalCase}}Attributes >(),
} );

export const validators = scaffoldValidators.validators;

export const validate{{pascalCase}}Attributes =
	scaffoldValidators.validateAttributes as (
		attributes: unknown
	) => {{pascalCase}}ValidationResult;

export const sanitize{{pascalCase}}Attributes =
	scaffoldValidators.sanitizeAttributes as (
		attributes: Partial< {{pascalCase}}Attributes >
	) => {{pascalCase}}Attributes;

export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;
`;

export const PERSISTENCE_INTERACTIVITY_TEMPLATE = `import { getContext, store } from '@wordpress/interactivity';
import { generatePublicWriteRequestId } from '@wp-typia/block-runtime/identifiers';

import { fetchBootstrap, fetchState, writeState } from './api';
import type {
	{{pascalCase}}ClientState,
	{{pascalCase}}Context,
	{{pascalCase}}State,
} from './types';
import type {
	{{pascalCase}}WriteStateRequest,
} from './api-types';

function hasExpiredPublicWriteToken(
	expiresAt?: number
): boolean {
	return (
		typeof expiresAt === 'number' &&
		expiresAt > 0 &&
		Date.now() >= expiresAt * 1000
	);
}

function getWriteBlockedMessage(
	context: {{pascalCase}}Context
): string {
	return context.persistencePolicy === 'authenticated'
		? 'Sign in to persist this counter.'
		: 'Public writes are temporarily unavailable.';
}

const BOOTSTRAP_MAX_ATTEMPTS = 3;
const BOOTSTRAP_RETRY_DELAYS_MS = [ 250, 500 ];

async function waitForBootstrapRetry( delayMs: number ): Promise< void > {
	await new Promise( ( resolve ) => {
		setTimeout( resolve, delayMs );
	} );
}

function getClientState(
	context: {{pascalCase}}Context
): {{pascalCase}}ClientState {
	if ( context.client ) {
		return context.client;
	}

	context.client = {
		bootstrapError: '',
		writeExpiry: 0,
		writeNonce: '',
		writeToken: '',
	};

	return context.client;
}

function clearBootstrapError(
	context: {{pascalCase}}Context,
	clientState: {{pascalCase}}ClientState
): void {
	if ( context.error === clientState.bootstrapError ) {
		context.error = '';
	}
	clientState.bootstrapError = '';
}

function setBootstrapError(
	context: {{pascalCase}}Context,
	clientState: {{pascalCase}}ClientState,
	message: string
): void {
	clientState.bootstrapError = message;
	context.error = message;
}

const { actions, state } = store( '{{slugKebabCase}}', {
	state: {
		isHydrated: false,
	} as {{pascalCase}}State,

	actions: {
		async loadState() {
			const context = getContext< {{pascalCase}}Context >();
			if ( context.postId <= 0 || ! context.resourceKey ) {
				return;
			}

			context.isLoading = true;
			context.error = '';

			try {
				const result = await fetchState( {
					postId: context.postId,
					resourceKey: context.resourceKey,
				}, {
					transportTarget: 'frontend',
				} );
				if ( ! result.isValid || ! result.data ) {
					context.error = result.errors[ 0 ]?.expected ?? 'Unable to load counter';
					return;
				}
				context.count = result.data.count;
			} catch ( error ) {
				context.error =
					error instanceof Error ? error.message : 'Unknown loading error';
			} finally {
				context.isLoading = false;
			}
		},
		async loadBootstrap() {
			const context = getContext< {{pascalCase}}Context >();
			const clientState = getClientState( context );
			if ( context.postId <= 0 || ! context.resourceKey ) {
				context.bootstrapReady = true;
				context.canWrite = false;
				clientState.bootstrapError = '';
				clientState.writeExpiry = 0;
				clientState.writeNonce = '';
				clientState.writeToken = '';
				return;
			}

			context.isBootstrapping = true;

			let bootstrapSucceeded = false;
			let lastBootstrapError =
				'Unable to initialize write access';
			const includePublicWriteCredentials = {{isPublicPersistencePolicy}};
			const includeRestNonce = {{isAuthenticatedPersistencePolicy}};

			for ( let attempt = 1; attempt <= BOOTSTRAP_MAX_ATTEMPTS; attempt += 1 ) {
				try {
					const result = await fetchBootstrap( {
						postId: context.postId,
						resourceKey: context.resourceKey,
					}, {
						transportTarget: 'frontend',
					} );
					if ( ! result.isValid || ! result.data ) {
						lastBootstrapError =
							result.errors[ 0 ]?.expected ??
							'Unable to initialize write access';
						if ( attempt < BOOTSTRAP_MAX_ATTEMPTS ) {
							await waitForBootstrapRetry(
								BOOTSTRAP_RETRY_DELAYS_MS[ attempt - 1 ] ?? 750
							);
							continue;
						}
						break;
					}

					clientState.writeExpiry =
						includePublicWriteCredentials &&
						'publicWriteExpiresAt' in result.data &&
						typeof result.data.publicWriteExpiresAt === 'number' &&
						result.data.publicWriteExpiresAt > 0
							? result.data.publicWriteExpiresAt
							: 0;
					clientState.writeToken =
						includePublicWriteCredentials &&
						'publicWriteToken' in result.data &&
						typeof result.data.publicWriteToken === 'string' &&
						result.data.publicWriteToken.length > 0
							? result.data.publicWriteToken
							: '';
					clientState.writeNonce =
						includeRestNonce &&
						'restNonce' in result.data &&
						typeof result.data.restNonce === 'string' &&
						result.data.restNonce.length > 0
							? result.data.restNonce
							: '';
					context.bootstrapReady = true;
					context.canWrite =
						result.data.canWrite === true &&
						(
							context.persistencePolicy === 'authenticated'
								? clientState.writeNonce.length > 0
								: clientState.writeToken.length > 0 &&
									! hasExpiredPublicWriteToken( clientState.writeExpiry )
						);
					clearBootstrapError( context, clientState );
					bootstrapSucceeded = true;
					break;
				} catch ( error ) {
					lastBootstrapError =
						error instanceof Error ? error.message : 'Unknown bootstrap error';
					if ( attempt < BOOTSTRAP_MAX_ATTEMPTS ) {
						await waitForBootstrapRetry(
							BOOTSTRAP_RETRY_DELAYS_MS[ attempt - 1 ] ?? 750
						);
						continue;
					}
					break;
				}
			}

			if ( ! bootstrapSucceeded ) {
				context.bootstrapReady = false;
				context.canWrite = false;
				clientState.writeExpiry = 0;
				clientState.writeNonce = '';
				clientState.writeToken = '';
				setBootstrapError( context, clientState, lastBootstrapError );
			}
			context.isBootstrapping = false;
		},
		async increment() {
			const context = getContext< {{pascalCase}}Context >();
			const clientState = getClientState( context );
			if ( context.postId <= 0 || ! context.resourceKey ) {
				return;
			}
			if ( ! context.bootstrapReady ) {
				await actions.loadBootstrap();
			}
			if ( ! context.bootstrapReady ) {
				context.error = 'Write access is still initializing.';
				return;
			}
			if (
				context.persistencePolicy === 'public' &&
				hasExpiredPublicWriteToken( clientState.writeExpiry )
			) {
				await actions.loadBootstrap();
			}
			if (
				context.persistencePolicy === 'public' &&
				hasExpiredPublicWriteToken( clientState.writeExpiry )
			) {
				context.canWrite = false;
				context.error = getWriteBlockedMessage( context );
				return;
			}
			if ( ! context.canWrite ) {
				context.error = getWriteBlockedMessage( context );
				return;
			}

			context.isSaving = true;
			context.error = '';

			try {
				const request = {
					delta: 1,
					postId: context.postId,
					resourceKey: context.resourceKey,
				} as {{pascalCase}}WriteStateRequest;
				if ( {{isPublicPersistencePolicy}} ) {
					request.publicWriteRequestId =
						generatePublicWriteRequestId() as {{pascalCase}}WriteStateRequest[ 'publicWriteRequestId' ];
					if ( clientState.writeToken.length > 0 ) {
						request.publicWriteToken =
							clientState.writeToken as {{pascalCase}}WriteStateRequest[ 'publicWriteToken' ];
					}
				}
				const result = await writeState( request, {
					restNonce:
						clientState.writeNonce.length > 0
							? clientState.writeNonce
							: undefined,
					transportTarget: 'frontend',
				} );
				if ( ! result.isValid || ! result.data ) {
					context.error = result.errors[ 0 ]?.expected ?? 'Unable to update counter';
					return;
				}
				context.count = result.data.count;
				context.storage = result.data.storage;
			} catch ( error ) {
				context.error =
					error instanceof Error ? error.message : 'Unknown update error';
			} finally {
				context.isSaving = false;
			}
		},
	},

	callbacks: {
		init() {
			const context = getContext< {{pascalCase}}Context >();
			context.client = {
				bootstrapError: '',
				writeExpiry: 0,
				writeNonce: '',
				writeToken: '',
			};
			context.bootstrapReady = false;
			context.canWrite = false;
			context.count = 0;
			context.error = '';
			context.isBootstrapping = false;
			context.isLoading = false;
			context.isSaving = false;
		},
		mounted() {
			state.isHydrated = true;
			if ( typeof document !== 'undefined' ) {
				document.documentElement.dataset[ '{{slugCamelCase}}Hydrated' ] = 'true';
			}
			void Promise.allSettled( [
				actions.loadState(),
				actions.loadBootstrap(),
			] );
		},
	},
} );
`;

export const COMPOUND_PARENT_EDIT_TEMPLATE = `import type { BlockEditProps } from '@wp-typia/block-types/blocks/registration';
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	InnerBlocks,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { Notice, PanelBody, ToggleControl } from '@wordpress/components';

import {
	ALLOWED_CHILD_BLOCKS,
	DEFAULT_CHILD_TEMPLATE,
} from './children';
import { useTypiaValidation } from './hooks';
import type { {{pascalCase}}Attributes } from './types';
import {
	createAttributeUpdater,
	validate{{pascalCase}}Attributes,
} from './validators';

type EditProps = BlockEditProps< {{pascalCase}}Attributes >;

export default function Edit( {
	attributes,
	setAttributes,
}: EditProps ) {
	const { errorMessages, isValid } = useTypiaValidation(
		attributes,
		validate{{pascalCase}}Attributes
	);
	const updateAttribute = createAttributeUpdater( attributes, setAttributes );
	const blockProps = useBlockProps( {
		className: '{{cssClassName}}',
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Compound Settings', '{{textDomain}}' ) }>
					<ToggleControl
						label={ __( 'Show dividers between items', '{{textDomain}}' ) }
						checked={ attributes.showDividers ?? true }
						onChange={ ( value ) => updateAttribute( 'showDividers', value ) }
					/>
				</PanelBody>
				{ ! isValid && (
					<PanelBody title={ __( 'Validation Errors', '{{textDomain}}' ) } initialOpen>
						{ errorMessages.map( ( error, index ) => (
							<Notice key={ index } status="error" isDismissible={ false }>
								{ error }
							</Notice>
						) ) }
					</PanelBody>
				) }
			</InspectorControls>
			<div { ...blockProps }>
				<RichText
					tagName="h3"
					className="{{cssClassName}}__heading"
					value={ attributes.heading }
					onChange={ ( heading ) => updateAttribute( 'heading', heading ) }
					placeholder={ __( {{titleJson}}, '{{textDomain}}' ) }
				/>
				<RichText
					tagName="p"
					className="{{cssClassName}}__intro"
					value={ attributes.intro ?? '' }
					onChange={ ( intro ) => updateAttribute( 'intro', intro ) }
					placeholder={ __(
						'Add and reorder internal items inside this compound block.',
						'{{textDomain}}'
					) }
				/>
				{ ! isValid && (
					<Notice status="error" isDismissible={ false }>
						<ul>
							{ errorMessages.map( ( error, index ) => <li key={ index }>{ error }</li> ) }
						</ul>
					</Notice>
				) }
				<div className="{{cssClassName}}__items">
					<InnerBlocks
						allowedBlocks={ ALLOWED_CHILD_BLOCKS }
						renderAppender={ InnerBlocks.ButtonBlockAppender }
						template={ DEFAULT_CHILD_TEMPLATE }
						templateLock={ false }
					/>
				</div>
			</div>
		</>
	);
}
`;

export const COMPOUND_PARENT_SAVE_TEMPLATE = `import { InnerBlocks, RichText, useBlockProps } from '@wordpress/block-editor';

import type { {{pascalCase}}Attributes } from './types';

export default function Save( {
	attributes,
}: {
	attributes: {{pascalCase}}Attributes;
} ) {
	return (
		<div
			{ ...useBlockProps.save( {
				className: '{{cssClassName}}',
				'data-show-dividers': ( attributes.showDividers ?? true ) ? 'true' : 'false',
			} ) }
		>
			<RichText.Content
				tagName="h3"
				className="{{cssClassName}}__heading"
				value={ attributes.heading }
			/>
			<RichText.Content
				tagName="p"
				className="{{cssClassName}}__intro"
				value={ attributes.intro ?? '' }
			/>
			<div className="{{cssClassName}}__items">
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
`;

export const COMPOUND_PARENT_INDEX_TEMPLATE = `import {
\tregisterScaffoldBlockType,
\ttype BlockConfiguration,
} from '@wp-typia/block-types/blocks/registration';
import {
	buildScaffoldBlockRegistration,
	parseScaffoldBlockMetadata,
} from '@wp-typia/block-runtime/blocks';

import Edit from './edit';
import Save from './save';
import metadata from './block-metadata';
import './style.scss';

import type { {{pascalCase}}Attributes } from './types';

const registration = buildScaffoldBlockRegistration(
	parseScaffoldBlockMetadata<BlockConfiguration< {{pascalCase}}Attributes >>( metadata ),
	{
		edit: Edit,
		save: Save,
	}
);

registerScaffoldBlockType(registration.name, registration.settings);
`;

export const COMPOUND_LOCAL_HOOKS_TEMPLATE = `export {
	formatValidationError,
	formatValidationErrors,
	useTypiaValidation,
} from '../../hooks';

export type {
	TypiaValidationError,
	ValidationResult,
	ValidationState,
} from '../../hooks';
`;

export const COMPOUND_PARENT_VALIDATORS_TEMPLATE = `import typia from 'typia';
import currentManifest from './manifest-defaults-document';
import type {
	{{pascalCase}}Attributes,
	{{pascalCase}}ValidationResult,
} from './types';
import { createTemplateValidatorToolkit } from '../../validator-toolkit';

const scaffoldValidators = createTemplateValidatorToolkit< {{pascalCase}}Attributes >( {
	assert: typia.createAssert< {{pascalCase}}Attributes >(),
	clone: typia.misc.createClone< {{pascalCase}}Attributes >() as (
		value: {{pascalCase}}Attributes,
	) => {{pascalCase}}Attributes,
	is: typia.createIs< {{pascalCase}}Attributes >(),
	manifest: currentManifest,
	prune: typia.misc.createPrune< {{pascalCase}}Attributes >(),
	random: typia.createRandom< {{pascalCase}}Attributes >() as (
		...args: unknown[]
	) => {{pascalCase}}Attributes,
	validate: typia.createValidate< {{pascalCase}}Attributes >(),
} );

export const validate{{pascalCase}}Attributes =
	scaffoldValidators.validateAttributes as (
		attributes: unknown
	) => {{pascalCase}}ValidationResult;

export const validators = scaffoldValidators.validators;

export const sanitize{{pascalCase}}Attributes =
	scaffoldValidators.sanitizeAttributes as (
		attributes: Partial< {{pascalCase}}Attributes >
	) => {{pascalCase}}Attributes;

export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;
`;

export const COMPOUND_CHILDREN_TEMPLATE = `import type { BlockTemplate } from '@wp-typia/block-types/blocks/registration';

export const DEFAULT_CHILD_BLOCK_NAME = '{{namespace}}/{{slugKebabCase}}-item';

export const ALLOWED_CHILD_BLOCKS = [
	DEFAULT_CHILD_BLOCK_NAME,
	// add-child: insert new allowed child block names here
];

export const DEFAULT_CHILD_TEMPLATE: BlockTemplate = [
	[
		DEFAULT_CHILD_BLOCK_NAME,
		{
			body: 'Add supporting details for the first internal item.',
			title: 'First Item',
		},
	],
	[
		DEFAULT_CHILD_BLOCK_NAME,
		{
			body: 'Add supporting details for the second internal item.',
			title: 'Second Item',
		},
	],
];
`;

export const COMPOUND_CHILD_EDIT_TEMPLATE = `import type { BlockEditProps } from '@wp-typia/block-types/blocks/registration';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { useTypiaValidation } from './hooks';
import type { {{pascalCase}}ItemAttributes } from './types';
import {
	createAttributeUpdater,
	validate{{pascalCase}}ItemAttributes,
} from './validators';

type EditProps = BlockEditProps< {{pascalCase}}ItemAttributes >;

export default function Edit( {
	attributes,
	setAttributes,
}: EditProps ) {
	const updateAttribute = createAttributeUpdater( attributes, setAttributes );
	const { errorMessages, isValid } = useTypiaValidation(
		attributes,
		validate{{pascalCase}}ItemAttributes
	);

	return (
		<div { ...useBlockProps( { className: '{{compoundChildCssClassName}}' } ) }>
			<RichText
				tagName="h4"
				className="{{compoundChildCssClassName}}__title"
				value={ attributes.title ?? '' }
				onChange={ ( title ) => updateAttribute( 'title', title ) }
				placeholder={ __( {{compoundChildTitleJson}}, '{{textDomain}}' ) }
			/>
			<RichText
				tagName="p"
				className="{{compoundChildCssClassName}}__body"
				value={ attributes.body ?? '' }
				onChange={ ( body ) => updateAttribute( 'body', body ) }
				placeholder={ __( 'Add supporting details for this internal item.', '{{textDomain}}' ) }
			/>
			{ ! isValid && (
				<Notice status="error" isDismissible={ false }>
					<ul>
						{ errorMessages.map( ( error, index ) => <li key={ index }>{ error }</li> ) }
					</ul>
				</Notice>
			) }
		</div>
	);
}
`;

export const COMPOUND_CHILD_SAVE_TEMPLATE = `import { RichText, useBlockProps } from '@wordpress/block-editor';

import type { {{pascalCase}}ItemAttributes } from './types';

export default function Save( {
	attributes,
}: {
	attributes: {{pascalCase}}ItemAttributes;
} ) {
	return (
		<div { ...useBlockProps.save( { className: '{{compoundChildCssClassName}}' } ) }>
			<RichText.Content
				tagName="h4"
				className="{{compoundChildCssClassName}}__title"
				value={ attributes.title }
			/>
			<RichText.Content
				tagName="p"
				className="{{compoundChildCssClassName}}__body"
				value={ attributes.body }
			/>
		</div>
	);
}
`;

export const COMPOUND_CHILD_INDEX_TEMPLATE = `import {
\tregisterScaffoldBlockType,
\ttype BlockConfiguration,
} from '@wp-typia/block-types/blocks/registration';
import {
	buildScaffoldBlockRegistration,
	parseScaffoldBlockMetadata,
} from '@wp-typia/block-runtime/blocks';

import Edit from './edit';
import Save from './save';
import metadata from './block-metadata';
import '../{{slugKebabCase}}/style.scss';

import type { {{pascalCase}}ItemAttributes } from './types';

const registration = buildScaffoldBlockRegistration(
	parseScaffoldBlockMetadata<BlockConfiguration< {{pascalCase}}ItemAttributes >>( metadata ),
	{
		edit: Edit,
		save: Save,
	}
);

registerScaffoldBlockType(registration.name, registration.settings);
`;

export const COMPOUND_CHILD_VALIDATORS_TEMPLATE = `import typia from 'typia';
import currentManifest from './manifest-defaults-document';
import type {
	{{pascalCase}}ItemAttributes,
	{{pascalCase}}ItemValidationResult,
} from './types';
import { createTemplateValidatorToolkit } from '../../validator-toolkit';

const scaffoldValidators = createTemplateValidatorToolkit< {{pascalCase}}ItemAttributes >( {
	assert: typia.createAssert< {{pascalCase}}ItemAttributes >(),
	clone: typia.misc.createClone< {{pascalCase}}ItemAttributes >() as (
		value: {{pascalCase}}ItemAttributes,
	) => {{pascalCase}}ItemAttributes,
	is: typia.createIs< {{pascalCase}}ItemAttributes >(),
	manifest: currentManifest,
	prune: typia.misc.createPrune< {{pascalCase}}ItemAttributes >(),
	random: typia.createRandom< {{pascalCase}}ItemAttributes >() as (
		...args: unknown[]
	) => {{pascalCase}}ItemAttributes,
	validate: typia.createValidate< {{pascalCase}}ItemAttributes >(),
} );

export const validate{{pascalCase}}ItemAttributes =
	scaffoldValidators.validateAttributes as (
		attributes: unknown
	) => {{pascalCase}}ItemValidationResult;

export const validators = scaffoldValidators.validators;

export const sanitize{{pascalCase}}ItemAttributes =
	scaffoldValidators.sanitizeAttributes as (
		attributes: Partial< {{pascalCase}}ItemAttributes >
	) => {{pascalCase}}ItemAttributes;

export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;
`;

export const COMPOUND_PERSISTENCE_PARENT_EDIT_TEMPLATE = `import type { BlockEditProps } from '@wp-typia/block-types/blocks/registration';
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	InnerBlocks,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	TextControl,
	ToggleControl,
} from '@wordpress/components';

import {
	ALLOWED_CHILD_BLOCKS,
	DEFAULT_CHILD_TEMPLATE,
} from './children';
import { useTypiaValidation } from './hooks';
import type { {{pascalCase}}Attributes } from './types';
import {
	createAttributeUpdater,
	validate{{pascalCase}}Attributes,
} from './validators';

type EditProps = BlockEditProps< {{pascalCase}}Attributes >;

export default function Edit( {
	attributes,
	setAttributes,
}: EditProps ) {
	const { errorMessages, isValid } = useTypiaValidation(
		attributes,
		validate{{pascalCase}}Attributes
	);
	const updateAttribute = createAttributeUpdater( attributes, setAttributes );
	const blockProps = useBlockProps( {
		className: '{{cssClassName}}',
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Compound Settings', '{{textDomain}}' ) }>
					<ToggleControl
						label={ __( 'Show dividers between items', '{{textDomain}}' ) }
						checked={ attributes.showDividers ?? true }
						onChange={ ( value ) => updateAttribute( 'showDividers', value ) }
					/>
					<ToggleControl
						label={ __( 'Show persisted count', '{{textDomain}}' ) }
						checked={ attributes.showCount ?? true }
						onChange={ ( value ) => updateAttribute( 'showCount', value ) }
					/>
					<TextControl
						label={ __( 'Button label', '{{textDomain}}' ) }
						value={ attributes.buttonLabel ?? 'Persist Count' }
						onChange={ ( buttonLabel ) => updateAttribute( 'buttonLabel', buttonLabel ) }
					/>
					<TextControl
						label={ __( 'Resource key', '{{textDomain}}' ) }
						value={ attributes.resourceKey ?? '' }
						onChange={ ( resourceKey ) => updateAttribute( 'resourceKey', resourceKey ) }
						help={ __( 'Stable key used by the persisted counter endpoint.', '{{textDomain}}' ) }
					/>
					<Notice status="info" isDismissible={ false }>
						{ __( 'Storage mode: {{dataStorageMode}}', '{{textDomain}}' ) }
					</Notice>
					<Notice status="info" isDismissible={ false }>
						{ __( 'Persistence policy: {{persistencePolicy}}', '{{textDomain}}' ) }
					</Notice>
				</PanelBody>
				{ ! isValid && (
					<PanelBody title={ __( 'Validation Errors', '{{textDomain}}' ) } initialOpen>
						{ errorMessages.map( ( error, index ) => (
							<Notice key={ index } status="error" isDismissible={ false }>
								{ error }
							</Notice>
						) ) }
					</PanelBody>
				) }
			</InspectorControls>
			<div { ...blockProps }>
				<RichText
					tagName="h3"
					className="{{cssClassName}}__heading"
					value={ attributes.heading }
					onChange={ ( heading ) => updateAttribute( 'heading', heading ) }
					placeholder={ __( {{titleJson}}, '{{textDomain}}' ) }
				/>
				<RichText
					tagName="p"
					className="{{cssClassName}}__intro"
					value={ attributes.intro ?? '' }
					onChange={ ( intro ) => updateAttribute( 'intro', intro ) }
					placeholder={ __(
						'Add and reorder internal items inside this compound block.',
						'{{textDomain}}'
					) }
				/>
				{ ! isValid && (
					<Notice status="error" isDismissible={ false }>
						<ul>
							{ errorMessages.map( ( error, index ) => <li key={ index }>{ error }</li> ) }
						</ul>
					</Notice>
				) }
				<p className="{{cssClassName}}__meta">
					{ __( 'Resource key:', '{{textDomain}}' ) } { attributes.resourceKey || '—' }
				</p>
				<div className="{{cssClassName}}__items">
					<InnerBlocks
						allowedBlocks={ ALLOWED_CHILD_BLOCKS }
						renderAppender={ InnerBlocks.ButtonBlockAppender }
						template={ DEFAULT_CHILD_TEMPLATE }
						templateLock={ false }
					/>
				</div>
			</div>
		</>
	);
}
`;

export const COMPOUND_PERSISTENCE_PARENT_SAVE_TEMPLATE = `export default function Save() {
	return null;
}
`;

export const COMPOUND_PERSISTENCE_PARENT_VALIDATORS_TEMPLATE = `import typia from 'typia';
import currentManifest from './manifest-defaults-document';
import type {
	{{pascalCase}}Attributes,
	{{pascalCase}}ValidationResult,
} from './types';
import { generateResourceKey } from '@wp-typia/block-runtime/identifiers';
import { createTemplateValidatorToolkit } from '../../validator-toolkit';

const scaffoldValidators = createTemplateValidatorToolkit< {{pascalCase}}Attributes >( {
	assert: typia.createAssert< {{pascalCase}}Attributes >(),
	clone: typia.misc.createClone< {{pascalCase}}Attributes >() as (
		value: {{pascalCase}}Attributes,
	) => {{pascalCase}}Attributes,
	is: typia.createIs< {{pascalCase}}Attributes >(),
	manifest: currentManifest,
	prune: typia.misc.createPrune< {{pascalCase}}Attributes >(),
	random: typia.createRandom< {{pascalCase}}Attributes >() as (
		...args: unknown[]
	) => {{pascalCase}}Attributes,
	finalize: ( normalized ) => ( {
		...normalized,
		resourceKey:
			normalized.resourceKey && normalized.resourceKey.length > 0
				? normalized.resourceKey
				: generateResourceKey( '{{slugKebabCase}}' ),
	} ),
	validate: typia.createValidate< {{pascalCase}}Attributes >(),
} );

export const validators = scaffoldValidators.validators;

export const validate{{pascalCase}}Attributes =
	scaffoldValidators.validateAttributes as (
		attributes: unknown
	) => {{pascalCase}}ValidationResult;

export const sanitize{{pascalCase}}Attributes =
	scaffoldValidators.sanitizeAttributes as (
		attributes: Partial< {{pascalCase}}Attributes >
	) => {{pascalCase}}Attributes;

export const createAttributeUpdater = scaffoldValidators.createAttributeUpdater;
`;

export const COMPOUND_PERSISTENCE_PARENT_INTERACTIVITY_TEMPLATE = `import { getContext, store } from '@wordpress/interactivity';
import { generatePublicWriteRequestId } from '@wp-typia/block-runtime/identifiers';

import { fetchBootstrap, fetchState, writeState } from './api';
import type {
	{{pascalCase}}ClientState,
	{{pascalCase}}Context,
	{{pascalCase}}State,
} from './types';

function hasExpiredPublicWriteToken(
	expiresAt?: number
): boolean {
	return (
		typeof expiresAt === 'number' &&
		expiresAt > 0 &&
		Date.now() >= expiresAt * 1000
	);
}

function getWriteBlockedMessage(
	context: {{pascalCase}}Context
): string {
	return context.persistencePolicy === 'authenticated'
		? 'Sign in to persist this counter.'
		: 'Public writes are temporarily unavailable.';
}

const BOOTSTRAP_MAX_ATTEMPTS = 3;
const BOOTSTRAP_RETRY_DELAYS_MS = [ 250, 500 ];

async function waitForBootstrapRetry( delayMs: number ): Promise< void > {
	await new Promise( ( resolve ) => {
		setTimeout( resolve, delayMs );
	} );
}

function getClientState(
	context: {{pascalCase}}Context
): {{pascalCase}}ClientState {
	if ( context.client ) {
		return context.client;
	}

	context.client = {
		bootstrapError: '',
		writeExpiry: 0,
		writeNonce: '',
		writeToken: '',
	};

	return context.client;
}

function clearBootstrapError(
	context: {{pascalCase}}Context,
	clientState: {{pascalCase}}ClientState
): void {
	if ( context.error === clientState.bootstrapError ) {
		context.error = '';
	}
	clientState.bootstrapError = '';
}

function setBootstrapError(
	context: {{pascalCase}}Context,
	clientState: {{pascalCase}}ClientState,
	message: string
): void {
	clientState.bootstrapError = message;
	context.error = message;
}

const { actions, state } = store( '{{slugKebabCase}}', {
	state: {
		isHydrated: false,
	} as {{pascalCase}}State,

	actions: {
		async loadState() {
			const context = getContext< {{pascalCase}}Context >();
			if ( context.postId <= 0 || ! context.resourceKey ) {
				return;
			}

			context.isLoading = true;
			context.error = '';

			try {
				const result = await fetchState( {
					postId: context.postId,
					resourceKey: context.resourceKey,
				}, {
					transportTarget: 'frontend',
				} );
				if ( ! result.isValid || ! result.data ) {
					context.error = result.errors[ 0 ]?.expected ?? 'Unable to load counter';
					return;
				}
				context.count = result.data.count;
			} catch ( error ) {
				context.error =
					error instanceof Error ? error.message : 'Unknown loading error';
			} finally {
				context.isLoading = false;
			}
		},
		async loadBootstrap() {
			const context = getContext< {{pascalCase}}Context >();
			const clientState = getClientState( context );
			if ( context.postId <= 0 || ! context.resourceKey ) {
				context.bootstrapReady = true;
				context.canWrite = false;
				clientState.bootstrapError = '';
				clientState.writeExpiry = 0;
				clientState.writeNonce = '';
				clientState.writeToken = '';
				return;
			}

			context.isBootstrapping = true;

			let bootstrapSucceeded = false;
			let lastBootstrapError =
				'Unable to initialize write access';
			const includePublicWriteCredentials = {{isPublicPersistencePolicy}};
			const includeRestNonce = {{isAuthenticatedPersistencePolicy}};

			for ( let attempt = 1; attempt <= BOOTSTRAP_MAX_ATTEMPTS; attempt += 1 ) {
				try {
					const result = await fetchBootstrap( {
						postId: context.postId,
						resourceKey: context.resourceKey,
					}, {
						transportTarget: 'frontend',
					} );
					if ( ! result.isValid || ! result.data ) {
						lastBootstrapError =
							result.errors[ 0 ]?.expected ??
							'Unable to initialize write access';
						if ( attempt < BOOTSTRAP_MAX_ATTEMPTS ) {
							await waitForBootstrapRetry(
								BOOTSTRAP_RETRY_DELAYS_MS[ attempt - 1 ] ?? 750
							);
							continue;
						}
						break;
					}

					clientState.writeExpiry =
						includePublicWriteCredentials &&
						'publicWriteExpiresAt' in result.data &&
						typeof result.data.publicWriteExpiresAt === 'number' &&
						result.data.publicWriteExpiresAt > 0
							? result.data.publicWriteExpiresAt
							: 0;
					clientState.writeToken =
						includePublicWriteCredentials &&
						'publicWriteToken' in result.data &&
						typeof result.data.publicWriteToken === 'string' &&
						result.data.publicWriteToken.length > 0
							? result.data.publicWriteToken
							: '';
					clientState.writeNonce =
						includeRestNonce &&
						'restNonce' in result.data &&
						typeof result.data.restNonce === 'string' &&
						result.data.restNonce.length > 0
							? result.data.restNonce
							: '';
					context.bootstrapReady = true;
					context.canWrite =
						result.data.canWrite === true &&
						(
							context.persistencePolicy === 'authenticated'
								? clientState.writeNonce.length > 0
								: clientState.writeToken.length > 0 &&
									! hasExpiredPublicWriteToken( clientState.writeExpiry )
						);
					clearBootstrapError( context, clientState );
					bootstrapSucceeded = true;
					break;
				} catch ( error ) {
					lastBootstrapError =
						error instanceof Error ? error.message : 'Unknown bootstrap error';
					if ( attempt < BOOTSTRAP_MAX_ATTEMPTS ) {
						await waitForBootstrapRetry(
							BOOTSTRAP_RETRY_DELAYS_MS[ attempt - 1 ] ?? 750
						);
						continue;
					}
					break;
				}
			}

			if ( ! bootstrapSucceeded ) {
				context.bootstrapReady = false;
				context.canWrite = false;
				clientState.writeExpiry = 0;
				clientState.writeNonce = '';
				clientState.writeToken = '';
				setBootstrapError( context, clientState, lastBootstrapError );
			}
			context.isBootstrapping = false;
		},
		async increment() {
			const context = getContext< {{pascalCase}}Context >();
			const clientState = getClientState( context );
			if ( context.postId <= 0 || ! context.resourceKey ) {
				return;
			}
			if ( ! context.bootstrapReady ) {
				await actions.loadBootstrap();
			}
			if ( ! context.bootstrapReady ) {
				context.error = 'Write access is still initializing.';
				return;
			}
			if (
				context.persistencePolicy === 'public' &&
				hasExpiredPublicWriteToken( clientState.writeExpiry )
			) {
				await actions.loadBootstrap();
			}
			if (
				context.persistencePolicy === 'public' &&
				hasExpiredPublicWriteToken( clientState.writeExpiry )
			) {
				context.canWrite = false;
				context.error = getWriteBlockedMessage( context );
				return;
			}
			if ( ! context.canWrite ) {
				context.error = getWriteBlockedMessage( context );
				return;
			}

			context.isSaving = true;
			context.error = '';

			try {
				const result = await writeState( {
					delta: 1,
					postId: context.postId,
					publicWriteRequestId:
						context.persistencePolicy === 'public'
							? generatePublicWriteRequestId()
							: undefined,
					publicWriteToken:
						context.persistencePolicy === 'public' &&
						clientState.writeToken.length > 0
							? clientState.writeToken
							: undefined,
					resourceKey: context.resourceKey,
				}, {
					restNonce:
						clientState.writeNonce.length > 0
							? clientState.writeNonce
							: undefined,
					transportTarget: 'frontend',
				} );
				if ( ! result.isValid || ! result.data ) {
					context.error = result.errors[ 0 ]?.expected ?? 'Unable to update counter';
					return;
				}
				context.count = result.data.count;
				context.storage = result.data.storage;
			} catch ( error ) {
				context.error =
					error instanceof Error ? error.message : 'Unknown update error';
			} finally {
				context.isSaving = false;
			}
		},
	},

	callbacks: {
		init() {
			const context = getContext< {{pascalCase}}Context >();
			context.client = {
				bootstrapError: '',
				writeExpiry: 0,
				writeNonce: '',
				writeToken: '',
			};
			context.bootstrapReady = false;
			context.canWrite = false;
			context.count = 0;
			context.error = '';
			context.isBootstrapping = false;
			context.isLoading = false;
			context.isSaving = false;
		},
		mounted() {
			state.isHydrated = true;
			if ( typeof document !== 'undefined' ) {
				document.documentElement.dataset[ '{{slugCamelCase}}Hydrated' ] = 'true';
			}
			void Promise.allSettled( [
				actions.loadState(),
				actions.loadBootstrap(),
			] );
		},
	},
} );
`;
