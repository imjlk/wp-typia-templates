export const QUERY_LOOP_INDEX_TEMPLATE = `import { registerBlockVariation } from '@wordpress/blocks';
import type { BlockVariation } from '@wp-typia/block-types/blocks/registration';
import { __ } from '@wordpress/i18n';

type QueryLoopVariationAttributes = {
  namespace?: string;
  query?: {
    inherit?: boolean;
    order?: 'asc' | 'desc';
    orderBy?: string;
    perPage?: number;
    postType?: string;
  };
};

type QueryLoopVariation = BlockVariation<QueryLoopVariationAttributes> & {
  allowedControls: string[];
};

const VARIATION_NAME = {{queryVariationNamespaceJson}};

const queryLoopVariation = {
  name: VARIATION_NAME,
  title: __({{titleJson}}, '{{textDomain}}'),
  description: __({{descriptionJson}}, '{{textDomain}}'),
  scope: ['inserter'],
  isActive: ['namespace'],
  attributes: {
    namespace: VARIATION_NAME,
    query: {
      inherit: false,
      order: 'desc',
      orderBy: 'date',
      perPage: 6,
      postType: {{queryPostTypeJson}},
    },
  },
  allowedControls: {{queryAllowedControlsJson}},
  innerBlocks: [
    [
      'core/post-template',
      {},
      [
        ['core/post-featured-image'],
        ['core/post-title', { isLink: true }],
        ['core/post-excerpt'],
      ],
    ],
    ['core/query-pagination'],
    ['core/query-no-results'],
  ],
} satisfies QueryLoopVariation;

registerBlockVariation('core/query', queryLoopVariation);
`;
