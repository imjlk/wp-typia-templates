const fs = require("fs");
const path = require("path");
const defaultConfig = require("@wordpress/scripts/config/webpack.config");

class TypiaManifestAssetPlugin {
	apply(compiler) {
		compiler.hooks.thisCompilation.tap("TypiaManifestAssetPlugin", (compilation) => {
			compilation.hooks.processAssets.tap(
				{
					name: "TypiaManifestAssetPlugin",
					stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
				},
				() => {
					for (const entry of getManifestEntries()) {
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

function getManifestEntries() {
	const entries = [];
	const rootManifestPath = path.resolve(process.cwd(), "typia.manifest.json");

	if (fs.existsSync(rootManifestPath)) {
		entries.push({
			inputPath: rootManifestPath,
			outputPath: "typia.manifest.json",
		});
	}

	const srcDir = path.resolve(process.cwd(), "src");
	if (!fs.existsSync(srcDir)) {
		return entries;
	}

	for (const inputPath of findManifestFiles(srcDir)) {
		entries.push({
			inputPath,
			outputPath: path.relative(srcDir, inputPath),
		});
	}

	return entries;
}

function findManifestFiles(directory) {
	const manifestFiles = [];

	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			manifestFiles.push(...findManifestFiles(entryPath));
			continue;
		}
		if (entry.isFile() && entry.name === "typia.manifest.json") {
			manifestFiles.push(entryPath);
		}
	}

	return manifestFiles;
}

module.exports = async () => {
	const { default: UnpluginTypia } = await import("@typia/unplugin/webpack");

	return {
		...defaultConfig,
		plugins: [
			UnpluginTypia(),
			...(defaultConfig.plugins || []),
			new TypiaManifestAssetPlugin(),
		],
	};
};
