import type {
	ManualRestContractAuthId,
	ManualRestContractHttpMethodId,
	RestResourceMethodId,
} from "./cli-add-shared.js";
import type { WorkspaceProject } from "./workspace-project.js";

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
