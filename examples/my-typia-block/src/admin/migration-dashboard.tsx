import { useState } from "@wordpress/element";
import { Button, Card, CardBody, Notice, Spinner } from "@wordpress/components";
import { __ } from "@wordpress/i18n";

import {
	type BatchMigrationResult,
	type BlockScanResult,
	batchMigrateScanResults,
	generateMigrationReport,
	scanSiteForMigrations,
} from "../migration-detector";

interface MigrationStats {
	needsMigration: number;
	total: number;
	unknown: number;
	versions: Record<string, number>;
}

function collectStats(results: BlockScanResult[]): MigrationStats {
	return results.reduce<MigrationStats>(
		(accumulator, result) => {
			accumulator.total += 1;
			if (result.analysis.needsMigration) {
				accumulator.needsMigration += 1;
			}
			if (result.analysis.currentVersion === "unknown") {
				accumulator.unknown += 1;
			}
			accumulator.versions[result.analysis.currentVersion] =
				(accumulator.versions[result.analysis.currentVersion] ?? 0) + 1;
			return accumulator;
		},
		{
			needsMigration: 0,
			total: 0,
			unknown: 0,
			versions: {},
		},
	);
}

function downloadFile(contents: string, fileName: string, type: string) {
	const blob = new Blob([contents], { type });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(url);
}

function formatUnionSummary(result: BlockScanResult["preview"]): string {
	if (result.unionBranches.length === 0) {
		return __("No union branch changes", "my_typia_block");
	}

	return result.unionBranches
		.map((branch) => `${branch.field}: ${branch.legacyBranch ?? "unknown"} → ${branch.nextBranch ?? "unknown"} (${branch.status})`)
		.join(", ");
}

function renderJsonPreview(value: unknown) {
	return (
		<pre
			style={{
				background: "#f6f7f7",
				borderRadius: "4px",
				margin: "8px 0 0",
				overflowX: "auto",
				padding: "8px",
			}}
		>
			{JSON.stringify(value, null, 2)}
		</pre>
	);
}

export function MigrationDashboard() {
	const [results, setResults] = useState<BlockScanResult[]>([]);
	const [dryRunResult, setDryRunResult] = useState<BatchMigrationResult | null>(null);
	const [isScanning, setIsScanning] = useState(false);
	const [isMigrating, setIsMigrating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const stats = collectStats(results);

	const runScan = async () => {
		setIsScanning(true);
		setError(null);
		setDryRunResult(null);

		try {
			setResults(await scanSiteForMigrations());
		} catch (scanError) {
			setError(scanError instanceof Error ? scanError.message : String(scanError));
		} finally {
			setIsScanning(false);
		}
	};

	const runDryRun = async () => {
		setError(null);

		try {
			setDryRunResult(await batchMigrateScanResults(results, { dryRun: true }));
		} catch (batchError) {
			setError(batchError instanceof Error ? batchError.message : String(batchError));
		}
	};

	const runBatchMigration = async () => {
		if (!window.confirm(__("Migrate all detected legacy blocks now?", "my_typia_block"))) {
			return;
		}

		setIsMigrating(true);
		setError(null);

		try {
			setDryRunResult(await batchMigrateScanResults(results, { dryRun: false }));
			await runScan();
		} catch (batchError) {
			setError(batchError instanceof Error ? batchError.message : String(batchError));
		} finally {
			setIsMigrating(false);
		}
	};

	const downloadReport = () => {
		downloadFile(
			generateMigrationReport(results),
			"my-typia-block-migration-report.md",
			"text/markdown",
		);
	};

	const downloadJson = () => {
		downloadFile(
			JSON.stringify(
				{
					dryRunResult,
					results,
				},
				null,
				2,
			),
			"my-typia-block-migration-report.json",
			"application/json",
		);
	};

	return (
		<div className="my-typia-block-migration-dashboard">
			<Card>
				<CardBody>
					<div style={{ display: "grid", gap: "12px" }}>
						<div>
							<strong>{__("Migration Manager", "my_typia_block")}</strong>
							<p style={{ margin: "4px 0 0" }}>
								{__(
									"Scan posts for legacy attributes, preview field-level changes, and batch migrate to the current Typia contract.",
									"my_typia_block",
								)}
							</p>
						</div>

						<div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
							<Button variant="secondary" onClick={runScan} disabled={isScanning}>
								{isScanning ? __("Scanning…", "my_typia_block") : __("Scan site", "my_typia_block")}
							</Button>
							<Button variant="secondary" onClick={runDryRun} disabled={results.length === 0 || isScanning || isMigrating}>
								{__("Dry run", "my_typia_block")}
							</Button>
							<Button variant="primary" onClick={runBatchMigration} disabled={stats.needsMigration === 0 || isScanning || isMigrating}>
								{isMigrating ? __("Migrating…", "my_typia_block") : __("Migrate all", "my_typia_block")}
							</Button>
							<Button variant="tertiary" onClick={downloadReport} disabled={results.length === 0}>
								{__("Download markdown", "my_typia_block")}
							</Button>
							<Button variant="tertiary" onClick={downloadJson} disabled={results.length === 0}>
								{__("Download JSON", "my_typia_block")}
							</Button>
						</div>

						{(isScanning || isMigrating) && <Spinner />}

						{error && (
							<Notice status="error" isDismissible={false}>
								{error}
							</Notice>
						)}

						{results.length > 0 && (
							<div style={{ display: "grid", gap: "8px" }}>
								<div>
									<strong>{__("Summary", "my_typia_block")}</strong>
									<ul style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
										<li>{__("Detected blocks", "my_typia_block")}: {stats.total}</li>
										<li>{__("Need migration", "my_typia_block")}: {stats.needsMigration}</li>
										<li>{__("Unknown shape", "my_typia_block")}: {stats.unknown}</li>
									</ul>
								</div>

								<div>
									<strong>{__("Version distribution", "my_typia_block")}</strong>
									<ul style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
										{Object.entries(stats.versions).map(([version, count]) => (
											<li key={version}>
												{version}: {count}
											</li>
										))}
									</ul>
								</div>

								<div>
									<strong>{__("Latest results", "my_typia_block")}</strong>
									<div style={{ display: "grid", gap: "8px", marginTop: "8px" }}>
										{results.map((result) => (
											<details key={`${result.postId}:${result.blockPath.join(".")}`}>
												<summary>
													<strong>{result.postTitle}</strong>
													{" — "}
													{result.analysis.currentVersion} → {result.analysis.targetVersion}
													{" · "}
													{result.preview.changedFields.length}
													{" "}
													{__("changed", "my_typia_block")}
													{result.preview.unresolved.length > 0 ? " · manual review" : ""}
													{result.preview.validationErrors.length > 0 ? " · validation issues" : ""}
												</summary>
												<div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
													<div>
														<strong>{__("Changed fields", "my_typia_block")}</strong>
														<div>
															{result.preview.changedFields.length > 0
																? result.preview.changedFields.join(", ")
																: __("None", "my_typia_block")}
														</div>
													</div>
													<div>
														<strong>{__("Union branches", "my_typia_block")}</strong>
														<div>{formatUnionSummary(result.preview)}</div>
													</div>
													{result.preview.unresolved.length > 0 && (
														<div>
															<strong>{__("Manual review", "my_typia_block")}</strong>
															<div>{result.preview.unresolved.join(", ")}</div>
														</div>
													)}
													{result.preview.validationErrors.length > 0 && (
														<div>
															<strong>{__("Validation", "my_typia_block")}</strong>
															<div>{result.preview.validationErrors.join(", ")}</div>
														</div>
													)}
													<div>
														<strong>{__("Before", "my_typia_block")}</strong>
														{renderJsonPreview(result.preview.before)}
													</div>
													<div>
														<strong>{__("After", "my_typia_block")}</strong>
														{renderJsonPreview(result.preview.after)}
													</div>
												</div>
											</details>
										))}
									</div>
								</div>
							</div>
						)}

						{dryRunResult && (
							<div style={{ display: "grid", gap: "8px" }}>
								<strong>{__("Dry-run preview", "my_typia_block")}</strong>
								<div style={{ display: "grid", gap: "8px", marginTop: "8px" }}>
									{dryRunResult.posts.map((post) => (
										<details key={post.postId}>
											<summary>
												<strong>{post.postTitle}</strong>
												{" — "}
												{post.status}
												{post.reason ? ` (${post.reason})` : ""}
											</summary>
											<div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
												{post.previews.map((preview) => (
													<div key={preview.blockPath.join(".")}>
														<div>
															<strong>{preview.currentVersion} → {preview.targetVersion}</strong>
															{preview.preview.changedFields.length > 0
																? ` · ${preview.preview.changedFields.join(", ")}`
																: ""}
															{preview.reason ? ` · ${preview.reason}` : ""}
														</div>
														<div>{formatUnionSummary(preview.preview)}</div>
														{renderJsonPreview({
															after: preview.preview.after,
															before: preview.preview.before,
															unresolved: preview.preview.unresolved,
															validationErrors: preview.preview.validationErrors,
														})}
													</div>
												))}
											</div>
										</details>
									))}
								</div>
							</div>
						)}
					</div>
				</CardBody>
			</Card>
		</div>
	);
}
