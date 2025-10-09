// WordPress Global Types
declare global {
  interface Window {
    wp: {
      data: {
        select: (store: string) => {
          'core/block-editor': {
            getBlocks: () => any[];
            getSelectedBlock: () => any;
            getBlock: (clientId: string) => any;
          };
          'core/editor': {
            getEditedPostAttribute: (key: string) => any;
          };
        };
        dispatch: (store: string) => {
          'core/block-editor': {
            updateBlock: (clientId: string, attributes: any) => void;
            selectBlock: (clientId: string) => void;
          };
        };
        withSelect: (mapSelectToProps: any) => any;
        withDispatch: (mapDispatchToProps: any) => any;
      };
      blocks: {
        registerBlockType: (name: string, settings: any) => void;
        getBlockType: (name: string) => any;
      };
      element: {
        createElement: any;
        Component: any;
        Fragment: any;
      };
      components: any;
      i18n: {
        __: (text: string) => string;
        _x: (text: string, context: string) => string;
        _n: (single: string, plural: string, number: number) => string;
      };
      hooks: {
        addFilter: (hookName: string, namespace: string, callback: Function) => void;
        applyFilters: (hookName: string, value: any, ...args: any[]) => any;
      };
    };

    // WordPress editor config
    wpEditorSettings?: any;
  }
}

// Export for use in tests
export {};