[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/cli-templates

# Module: packages/wp-typia-project-tools/src/runtime/cli-templates

## Table of contents

### References

- [getTemplateById](packages_wp_typia_project_tools_src_runtime_cli_templates.md#gettemplatebyid)
- [getTemplateSelectOptions](packages_wp_typia_project_tools_src_runtime_cli_templates.md#gettemplateselectoptions)
- [listTemplates](packages_wp_typia_project_tools_src_runtime_cli_templates.md#listtemplates)
- [isBuiltInTemplateId](packages_wp_typia_project_tools_src_runtime_cli_templates.md#isbuiltintemplateid)

### Functions

- [formatTemplateSummary](packages_wp_typia_project_tools_src_runtime_cli_templates.md#formattemplatesummary)
- [formatTemplateFeatures](packages_wp_typia_project_tools_src_runtime_cli_templates.md#formattemplatefeatures)
- [formatTemplateDetails](packages_wp_typia_project_tools_src_runtime_cli_templates.md#formattemplatedetails)

## References

### getTemplateById

Re-exports [getTemplateById](packages_wp_typia_project_tools_src_runtime_template_registry.md#gettemplatebyid)

___

### getTemplateSelectOptions

Re-exports [getTemplateSelectOptions](packages_wp_typia_project_tools_src_runtime_template_registry.md#gettemplateselectoptions)

___

### listTemplates

Re-exports [listTemplates](packages_wp_typia_project_tools_src_runtime_template_registry.md#listtemplates)

___

### isBuiltInTemplateId

Re-exports [isBuiltInTemplateId](packages_wp_typia_project_tools_src_runtime_template_registry.md#isbuiltintemplateid)

## Functions

### formatTemplateSummary

▸ **formatTemplateSummary**(`template`): `string`

Format one line of template list output for a built-in template.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `template` | [`TemplateDefinition`](../interfaces/packages_wp_typia_project_tools_src_runtime_template_registry.TemplateDefinition.md) | Template metadata including `id` and `description`. |

#### Returns

`string`

One-line summary text for `templates list`.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-templates.ts:16](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-templates.ts#L16)

___

### formatTemplateFeatures

▸ **formatTemplateFeatures**(`template`): `string`

Format the feature hint line shown under a template summary.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `template` | [`TemplateDefinition`](../interfaces/packages_wp_typia_project_tools_src_runtime_template_registry.TemplateDefinition.md) | Template metadata including the `features` list. |

#### Returns

`string`

Indented feature text for CLI list output.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-templates.ts:26](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-templates.ts#L26)

___

### formatTemplateDetails

▸ **formatTemplateDetails**(`template`): `string`

Format the detailed template description for `templates inspect`.

This expands special layer combinations for the `persistence` and `compound`
templates and returns a multi-line block including category, overlay path,
resolved layers, and feature labels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `template` | [`TemplateDefinition`](../interfaces/packages_wp_typia_project_tools_src_runtime_template_registry.TemplateDefinition.md) | Template metadata including `id`, `defaultCategory`, `templateDir`, and `features`. |

#### Returns

`string`

Multi-line template details text for CLI output.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/cli-templates.ts:41](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/cli-templates.ts#L41)
