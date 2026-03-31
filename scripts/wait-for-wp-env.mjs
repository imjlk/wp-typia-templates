#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const baseUrl = process.argv[2] ?? 'http://localhost:8889';
const timeoutMs = Number.parseInt(process.argv[3] ?? '180000', 10);
const wpEnvConfig = process.argv[4] ?? '.wp-env.test.json';
const intervalMs = 2000;

if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
	throw new Error(
		`Invalid timeoutMs: ${process.argv[3] ?? '180000'}. Expected a positive integer.`,
	);
}

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

function runWpCli(configPath, args) {
	const command = process.platform === 'win32' ? 'wp-env.cmd' : 'wp-env';
	return execFileSync(command, ['run', 'cli', `--config=${configPath}`, 'wp', ...args], {
		encoding: 'utf8',
		stdio: 'pipe',
		shell: process.platform === 'win32',
	});
}

function ensureWordPressInstalled(configPath) {
	try {
		runWpCli(configPath, ['core', 'is-installed']);
		return false;
	} catch {
		runWpCli(configPath, [
			'core',
			'install',
			`--url=${baseUrl}`,
			'--title=wp-typia-boilerplate',
			'--admin_user=admin',
			'--admin_password=password',
			'--admin_email=admin@example.com',
			'--skip-email',
		]);
		return true;
	}
}

async function main() {
	let lastStatus = 'not-started';
	let installAttempted = false;

	while (Date.now() < deadline) {
		try {
			const response = await fetch(loginUrl, {
				redirect: 'follow',
				headers: {
					'cache-control': 'no-cache',
				},
			});
			const body = await response.text();

			if (response.ok && looksReady(body)) {
				console.log(`✅ wp-env ready at ${loginUrl}`);
				return;
			}

			if (looksLikeInstall(body)) {
				lastStatus = 'install-screen';
				if (!installAttempted) {
					installAttempted = true;
					const installed = ensureWordPressInstalled(wpEnvConfig);
					lastStatus = installed ? 'auto-installed' : 'install-screen';
				}
			} else {
				lastStatus = `http-${response.status}`;
			}
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
