import { syncBlockMetadata } from "./lib/typia-metadata-core";

async function main() {
	const result = await syncBlockMetadata({
		blockJsonFile: "src/my-typia-block/block.json",
		manifestFile: "src/my-typia-block/typia.manifest.json",
		sourceTypeName: "MyTypiaBlockAttributes",
		typesFile: "src/types.ts",
	});

	console.log("✅ block.json and typia.manifest.json were generated from TypeScript types!");
	console.log("📝 Generated attributes:", result.attributeNames);

	if (result.lossyProjectionWarnings.length > 0) {
		console.warn("⚠️ Some Typia constraints were preserved only in typia.manifest.json:");
		for (const warning of result.lossyProjectionWarnings) {
			console.warn(`   - ${warning}`);
		}
	}
}

main().catch((error) => {
	console.error("❌ Type sync failed:", error);
	process.exit(1);
});
