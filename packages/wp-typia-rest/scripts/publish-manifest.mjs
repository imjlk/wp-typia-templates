#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { runPublishManifestCli } from "../../../scripts/lib/publish-manifest-workspace-protocol.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

process.exitCode = runPublishManifestCli({
	packageRoot,
});
