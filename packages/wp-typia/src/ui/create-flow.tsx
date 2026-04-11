import { SchemaForm } from "@bunli/tui";
import { z } from "zod";

import { executeCreateCommand } from "../runtime-bridge";
import { useAlternateBufferLifecycle } from "./alternate-buffer-lifecycle";

const createFlowSchema = z.object({
	"data-storage": z.string().optional(),
	namespace: z.string().optional(),
	"no-install": z.boolean().default(false),
	"package-manager": z.string().optional(),
	"persistence-policy": z.string().optional(),
	"php-prefix": z.string().optional(),
	"project-dir": z.string().min(1),
	template: z.string().optional(),
	"text-domain": z.string().optional(),
	variant: z.string().optional(),
	"with-migration-ui": z.boolean().default(false),
	"with-test-preset": z.boolean().default(false),
	"with-wp-env": z.boolean().default(false),
	yes: z.boolean().default(false),
});

type CreateFlowValues = z.infer<typeof createFlowSchema>;

type CreateFlowProps = {
	cwd: string;
	initialValues: Partial<CreateFlowValues>;
};

export function CreateFlow({ cwd, initialValues }: CreateFlowProps) {
	const { handleCancel, handleSubmit } = useAlternateBufferLifecycle("wp-typia create failed");
	const defaultPrompt = {
		close() {},
		select<T extends string>(_message: string, options: Array<{ value: T }>, defaultValue = 1) {
			const fallback = options[Math.max(0, defaultValue - 1)] ?? options[0];
			return Promise.resolve(fallback.value);
		},
		text(_message: string, defaultValue: string) {
			return Promise.resolve(defaultValue);
		},
	};

	return (
		<SchemaForm
			fields={[
					{ kind: "text", label: "Project directory", name: "project-dir", required: true },
					{
						kind: "select",
						label: "Template",
						name: "template",
						options: [
							{ name: "basic", description: "Basic block scaffold", value: "basic" },
							{
								name: "interactivity",
								description: "Interactivity API block scaffold",
								value: "interactivity",
							},
							{
								name: "persistence",
								description: "Persistence-enabled block scaffold",
								value: "persistence",
							},
							{
								name: "compound",
								description: "Compound parent + child scaffold",
								value: "compound",
							},
							{
								name: "workspace",
								description: "Official empty workspace template",
								value: "workspace",
							},
						],
					},
					{
						kind: "select",
						label: "Package manager",
						name: "package-manager",
						options: [
							{ name: "npm", description: "Use npm", value: "npm" },
							{ name: "pnpm", description: "Use pnpm", value: "pnpm" },
							{ name: "yarn", description: "Use yarn", value: "yarn" },
							{ name: "bun", description: "Use bun", value: "bun" },
						],
					},
					{ kind: "text", label: "Namespace", name: "namespace" },
					{ kind: "text", label: "Text domain", name: "text-domain" },
					{ kind: "text", label: "PHP prefix", name: "php-prefix" },
					{
						kind: "select",
						label: "Data storage",
						name: "data-storage",
						options: [
							{
								name: "custom-table",
								description: "Dedicated custom table storage",
								value: "custom-table",
							},
							{
								name: "post-meta",
								description: "Persist through post meta",
								value: "post-meta",
							},
						],
						visibleWhen: (values) =>
							values.template === "persistence" || values.template === "compound",
					},
					{
						kind: "select",
						label: "Persistence policy",
						name: "persistence-policy",
						options: [
							{
								name: "authenticated",
								description: "Authenticated write policy",
								value: "authenticated",
							},
							{ name: "public", description: "Public token policy", value: "public" },
						],
						visibleWhen: (values) =>
							values.template === "persistence" || values.template === "compound",
					},
					{ kind: "checkbox", label: "Skip dependency install", name: "no-install" },
					{ kind: "checkbox", label: "Use defaults without prompts", name: "yes" },
					{ kind: "checkbox", label: "Add wp-env preset", name: "with-wp-env" },
					{
						kind: "checkbox",
						label: "Add test preset",
						name: "with-test-preset",
					},
					{
						kind: "checkbox",
						label: "Add migration UI",
						name: "with-migration-ui",
					},
				]}
			initialValues={initialValues}
			onCancel={handleCancel}
			onSubmit={async (values) =>
				handleSubmit(async () => {
						await executeCreateCommand({
							cwd,
							flags: values,
							interactive: true,
							projectDir: values["project-dir"],
							prompt: defaultPrompt,
						});
				})
			}
			schema={createFlowSchema}
			title="Create a wp-typia project"
		/>
	);
}
