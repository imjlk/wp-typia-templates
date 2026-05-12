import type {
	ManualRestContractAuthId,
	ManualRestContractHttpMethodId,
	RestResourceMethodId,
} from "./cli-add-shared.js";
import type { WorkspaceProject } from "./workspace-project.js";

/**
 * Normalized metadata returned after `wp-typia add rest-resource` completes.
 *
 * @property auth Manual-mode authentication policy when `mode` is `"manual"`.
 * @property bodyTypeName Optional manual-mode request body type export.
 * @property controllerClass Optional generated-mode PHP controller class reference.
 * @property methods Generated-mode REST operation ids, or an empty array for
 * manual contracts.
 * @property mode Whether the scaffold wrote generated REST glue or a type-only
 * manual contract.
 * @property namespace REST namespace in `vendor/v1` format.
 * @property projectDir Absolute workspace project directory.
 * @property restResourceSlug Normalized kebab-case REST resource slug.
 */
export interface RunAddRestResourceCommandResult {
	auth?: ManualRestContractAuthId;
	bodyTypeName?: string;
	controllerClass?: string;
	controllerExtends?: string;
	method?: ManualRestContractHttpMethodId;
	methods: RestResourceMethodId[];
	mode: "generated" | "manual";
	namespace: string;
	permissionCallback?: string;
	pathPattern?: string;
	projectDir: string;
	queryTypeName?: string;
	restResourceSlug: string;
	responseTypeName?: string;
	routePattern?: string;
	secretFieldName?: string;
	secretStateFieldName?: string;
}

/**
 * Raw command options passed from the REST orchestrator into manual-mode
 * contract scaffolding.
 *
 * @property auth Optional raw manual authentication id, validated before use.
 * @property bodyTypeName Optional exported request body type name.
 * @property method Optional raw HTTP method id, validated as a manual REST
 * contract method.
 * @property namespace Resolved REST namespace in `vendor/v1` format.
 * @property pathPattern Optional manual route path pattern relative to the
 * namespace.
 * @property restResourceSlug Normalized kebab-case REST resource slug.
 * @property secretFieldName Optional write-only request secret field.
 * @property workspace Resolved official workspace project.
 */
export interface ManualRestContractScaffoldOptions {
	auth: string | undefined;
	bodyTypeName: string | undefined;
	controllerClass: string | undefined;
	controllerExtends: string | undefined;
	method: string | undefined;
	namespace: string;
	pathPattern: string | undefined;
	permissionCallback: string | undefined;
	queryTypeName: string | undefined;
	responseTypeName: string | undefined;
	restResourceSlug: string;
	routePattern: string | undefined;
	secretFieldName: string | undefined;
	secretStateFieldName: string | undefined;
	workspace: WorkspaceProject;
}

/**
 * Raw command options passed from the REST orchestrator into generated-mode
 * resource scaffolding.
 *
 * @property controllerClass Optional PHP controller class reference.
 * @property controllerExtends Optional PHP base class reference; requires
 * `controllerClass`.
 * @property methods Optional comma-separated REST method list validated into
 * `RestResourceMethodId` values.
 * @property namespace Resolved REST namespace in `vendor/v1` format.
 * @property permissionCallback Optional PHP permission callback reference.
 * @property restResourceSlug Normalized kebab-case REST resource slug.
 * @property workspace Resolved official workspace project.
 */
export interface GeneratedRestResourceScaffoldOptions {
	controllerClass: string | undefined;
	controllerExtends: string | undefined;
	methods: string | undefined;
	namespace: string;
	permissionCallback: string | undefined;
	restResourceSlug: string;
	routePattern: string | undefined;
	workspace: WorkspaceProject;
}
