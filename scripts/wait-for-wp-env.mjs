#!/usr/bin/env node

const baseUrl = process.argv[2] ?? 'http://localhost:8889';
const timeoutMs = Number.parseInt(process.argv[3] ?? '180000', 10);
const intervalMs = 2000;

const deadline = Date.now() + timeoutMs;
const loginUrl = new URL('/wp-login.php', baseUrl).toString();

function looksReady(html) {
	return html.includes('id="loginform"') || html.includes('id="wpadminbar"');
}

function looksLikeInstall(html) {
	return (
		html.includes('install.php') ||
		(html.includes('WordPress') && html.includes('Installation'))
	);
}

async function main() {
	let lastStatus = 'not-started';

	while (Date.now() < deadline) {
		try {
			const response = await fetch(loginUrl, {
				redirect: 'follow',
				headers: {
					'cache-control': 'no-cache',
				},
			});
			const body = await response.text();

			if (response.ok && (looksReady(body) || looksLikeInstall(body))) {
				console.log(`✅ wp-env ready at ${loginUrl}`);
				return;
			}

			lastStatus = looksLikeInstall(body)
				? 'install-screen'
				: `http-${response.status}`;
		} catch (error) {
			lastStatus =
				error instanceof Error ? error.message : 'unknown-network-error';
		}

		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}

	throw new Error(
		`Timed out waiting for wp-env login readiness at ${loginUrl} (last status: ${lastStatus})`,
	);
}

await main();
