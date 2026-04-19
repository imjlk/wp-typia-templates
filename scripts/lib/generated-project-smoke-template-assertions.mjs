import fs from "node:fs";
import path from "node:path";

export function assertBasicTemplateScaffold(projectDir) {
  const blockJsonPath = path.join(projectDir, "src", "block.json");
  const savePath = path.join(projectDir, "src", "save.tsx");
  const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, "utf8"));
  const saveSource = fs.readFileSync(savePath, "utf8");

  if (blockJson.editorStyle !== "file:./index.css") {
    throw new Error("Expected basic scaffold block.json to include editorStyle: file:./index.css");
  }
  if ("version" in (blockJson.attributes ?? {})) {
    throw new Error("Expected basic scaffold attributes to use schemaVersion instead of version");
  }
  if (!("schemaVersion" in (blockJson.attributes ?? {}))) {
    throw new Error("Expected basic scaffold attributes to include schemaVersion");
  }
  if (saveSource.includes("return null;")) {
    throw new Error("Expected basic scaffold save.tsx to serialize stable markup instead of returning null");
  }
}

export function assertPersistenceTemplateArtifacts(projectDir, projectName) {
  const candidateDirs = [
    path.join(projectDir, "build", projectName),
    path.join(projectDir, "build"),
  ];

  for (const artifact of [
    path.join("api-schemas", "bootstrap-query.schema.json"),
    path.join("api-schemas", "bootstrap-response.schema.json"),
    "typia.schema.json",
    "typia.openapi.json",
    path.join("api-schemas", "state-query.schema.json"),
    path.join("api-schemas", "state-response.schema.json"),
    path.join("api-schemas", "write-state-request.schema.json"),
  ]) {
    const found = candidateDirs.some((dir) => fs.existsSync(path.join(dir, artifact)));
    if (!found) {
      throw new Error(`Expected ${artifact} in one of: ${candidateDirs.join(", ")}`);
    }
  }
}

function findFirstExistingPath(paths) {
  return paths.find((candidatePath) => fs.existsSync(candidatePath));
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function assertPersistenceRestOpenApi(projectDir, projectName, namespace, persistencePolicy) {
  const candidatePath = findFirstExistingPath([
    path.join(projectDir, "build", projectName, "api.openapi.json"),
    path.join(projectDir, "build", "api.openapi.json"),
  ]);

  if (!candidatePath) {
    throw new Error("Expected aggregate REST OpenAPI document for persistence scaffold");
  }

  const openApi = readJsonFile(candidatePath);
  const routePath = `/${namespace}/v1/${projectName}/state`;
  const bootstrapPath = `/${namespace}/v1/${projectName}/bootstrap`;
  const pathItem = openApi.paths?.[routePath];
  const bootstrapPathItem = openApi.paths?.[bootstrapPath];
  const getOperation = pathItem?.get;
  const postOperation = pathItem?.post;
  const bootstrapOperation = bootstrapPathItem?.get;

  if (!getOperation || !postOperation) {
    throw new Error(`Expected GET and POST operations for ${routePath} in ${candidatePath}`);
  }
  if (!bootstrapOperation) {
    throw new Error(`Expected GET operation for ${bootstrapPath} in ${candidatePath}`);
  }

  if (getOperation["x-wp-typia-authPolicy"] !== "public-read") {
    throw new Error(`Expected public-read auth policy on ${routePath} GET`);
  }
  if (bootstrapOperation["x-wp-typia-authPolicy"] !== "public-read") {
    throw new Error(`Expected public-read auth policy on ${bootstrapPath} GET`);
  }

  if (persistencePolicy === "public") {
    if (postOperation["x-wp-typia-authPolicy"] !== "public-signed-token") {
      throw new Error(`Expected public-signed-token auth policy on ${routePath} POST`);
    }
    if (postOperation["x-wp-typia-publicTokenField"] !== "publicWriteToken") {
      throw new Error(`Expected publicWriteToken metadata on ${routePath} POST`);
    }
  } else {
    const securityScheme = openApi.components?.securitySchemes?.wpRestNonce;
    if (!securityScheme) {
      throw new Error("Expected wpRestNonce security scheme in aggregate REST OpenAPI");
    }
    if (postOperation["x-wp-typia-authPolicy"] !== "authenticated-rest-nonce") {
      throw new Error(`Expected authenticated-rest-nonce auth policy on ${routePath} POST`);
    }
  }
}

export function assertCompoundTemplateArtifacts(projectDir, projectName) {
  const parentDir = path.join(projectDir, "build", "blocks", projectName);
  const childDir = path.join(projectDir, "build", "blocks", `${projectName}-item`);

  for (const dir of [parentDir, childDir]) {
    for (const artifact of ["block.json", "typia.manifest.json", "typia-validator.php"]) {
      if (!fs.existsSync(path.join(dir, artifact))) {
        throw new Error(`Expected ${artifact} in ${dir}`);
      }
    }
  }
}

export function assertCompoundPersistenceArtifacts(projectDir, projectName) {
  const parentDir = path.join(projectDir, "build", "blocks", projectName);

  for (const artifact of [
    path.join("api-schemas", "bootstrap-query.schema.json"),
    path.join("api-schemas", "bootstrap-response.schema.json"),
    "typia.schema.json",
    "typia.openapi.json",
    path.join("api-schemas", "state-query.schema.json"),
    path.join("api-schemas", "state-response.schema.json"),
    path.join("api-schemas", "write-state-request.schema.json"),
  ]) {
    if (!fs.existsSync(path.join(parentDir, artifact))) {
      throw new Error(`Expected ${artifact} in ${parentDir}`);
    }
  }
}

export function assertCompoundRestOpenApi(projectDir, projectName, namespace, persistencePolicy) {
  const parentDir = path.join(projectDir, "build", "blocks", projectName);
  const openApiPath = path.join(parentDir, "api.openapi.json");

  if (!fs.existsSync(openApiPath)) {
    throw new Error(`Expected aggregate REST OpenAPI document in ${parentDir}`);
  }

  const openApi = readJsonFile(openApiPath);
  const routePath = `/${namespace}/v1/${projectName}/state`;
  const bootstrapPath = `/${namespace}/v1/${projectName}/bootstrap`;
  const pathItem = openApi.paths?.[routePath];
  const bootstrapPathItem = openApi.paths?.[bootstrapPath];
  const getOperation = pathItem?.get;
  const postOperation = pathItem?.post;
  const bootstrapOperation = bootstrapPathItem?.get;

  if (!getOperation || !postOperation) {
    throw new Error(`Expected GET and POST operations for ${routePath} in ${openApiPath}`);
  }
  if (!bootstrapOperation) {
    throw new Error(`Expected GET operation for ${bootstrapPath} in ${openApiPath}`);
  }

  if (getOperation["x-wp-typia-authPolicy"] !== "public-read") {
    throw new Error(`Expected public-read auth policy on ${routePath} GET`);
  }
  if (bootstrapOperation["x-wp-typia-authPolicy"] !== "public-read") {
    throw new Error(`Expected public-read auth policy on ${bootstrapPath} GET`);
  }

  if (persistencePolicy === "public") {
    if (postOperation["x-wp-typia-authPolicy"] !== "public-signed-token") {
      throw new Error(`Expected public-signed-token auth policy on ${routePath} POST`);
    }
    if (postOperation["x-wp-typia-publicTokenField"] !== "publicWriteToken") {
      throw new Error(`Expected publicWriteToken metadata on ${routePath} POST`);
    }
  } else {
    const securityScheme = openApi.components?.securitySchemes?.wpRestNonce;
    if (!securityScheme) {
      throw new Error(`Expected wpRestNonce security scheme in aggregate REST OpenAPI for ${routePath}`);
    }
    if (postOperation["x-wp-typia-authPolicy"] !== "authenticated-rest-nonce") {
      throw new Error(`Expected authenticated-rest-nonce auth policy on ${routePath} POST`);
    }
  }
}
