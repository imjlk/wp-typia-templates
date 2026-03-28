const fs = require("fs");
const path = require("path");
const defaultConfig = require("@wordpress/scripts/config/webpack.config");

const TYPIA_ARTIFACT_FILENAMES = new Set(["typia.manifest.json", "typia-validator.php"]);

class TypiaArtifactAssetPlugin {
	apply(compiler) {
		compiler.hooks.thisCompilation.tap("TypiaArtifactAssetPlugin", (compilation) => {
			compilation.hooks.processAssets.tap(
				{
					name: "TypiaArtifactAssetPlugin",
					stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
				},
				() => {
					for (const entry of getArtifactEntries()) {
						if (compilation.getAsset(entry.outputPath)) {
							continue;
						}

						compilation.emitAsset(
							entry.outputPath,
							new compiler.webpack.sources.RawSource(fs.readFileSync(entry.inputPath)),
						);
					}
				},
			);
		});
	}
}

function getArtifactEntries() {
	const entries = [];

	for (const filename of TYPIA_ARTIFACT_FILENAMES) {
		const rootArtifactPath = path.resolve(process.cwd(), filename);
		if (fs.existsSync(rootArtifactPath)) {
			entries.push({
				inputPath: rootArtifactPath,
				outputPath: filename,
			});
		}
	}

	const srcDir = path.resolve(process.cwd(), "src");
	if (!fs.existsSync(srcDir)) {
		return entries;
	}

	for (const inputPath of findArtifactFiles(srcDir)) {
		entries.push({
			inputPath,
			outputPath: path.relative(srcDir, inputPath),
		});
	}

	return entries;
}

function findArtifactFiles(directory) {
	const artifactFiles = [];

	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			artifactFiles.push(...findArtifactFiles(entryPath));
			continue;
		}
		if (entry.isFile() && TYPIA_ARTIFACT_FILENAMES.has(entry.name)) {
			artifactFiles.push(entryPath);
		}
	}

	return artifactFiles;
}

module.exports = async () => {
	const { default: UnpluginTypia } = await import("@typia/unplugin/webpack");

	return {
		...defaultConfig,
		plugins: [
			UnpluginTypia(),
			...(defaultConfig.plugins || []),
			new TypiaArtifactAssetPlugin(),
		],
	};
};
