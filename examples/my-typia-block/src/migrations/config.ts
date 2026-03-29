export const migrationConfig = {
	blockName: "create-block/my-typia-block",
	currentVersion: "1.0.0",
	supportedVersions: ["1.0.0"],
	snapshotDir: "src/migrations/versions",
} as const;

export default migrationConfig;
