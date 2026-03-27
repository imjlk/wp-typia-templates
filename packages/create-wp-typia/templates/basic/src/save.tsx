/**
 * Save/Frontend component for {{title}} Block
 */

import { useBlockProps } from '@wordpress/block-editor';
import { {{pascalCase}}Attributes } from './types';

interface SaveProps {
  attributes: {{pascalCase}}Attributes;
}

export default function Save({ attributes }: SaveProps) {
  const blockProps = useBlockProps.save();

  // 블록이 숨겨져 있으면 아무것도 렌더링하지 않음
  if (attributes.isVisible === false) {
    return null;
  }

  return (
    <div {...blockProps}>
      <div className="wp-block-{{slug}}__content">
        {attributes.content}
      </div>
    </div>
  );
}