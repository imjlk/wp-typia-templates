import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

/**
 * 🚀 WordPress 플러그인 ZIP 파일 생성 스크립트
 *
 * 플러그인을 배포용 ZIP 파일로 패키징합니다.
 */

async function createPluginZip() {
	try {
		const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
		const pluginName = packageJson.name;
		const version = packageJson.version;
		const zipName = `${pluginName}-v${version}.zip`;

		console.log(`📦 플러그인 ZIP 파일 생성 중: ${zipName}`);

		// 임시 디렉토리 생성
		const tempDir = path.join(process.cwd(), 'temp-plugin');
		const pluginDir = path.join(tempDir, pluginName);

		// 기존 temp 디렉토리 삭제
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}

		// temp 디렉토리 생성
		fs.mkdirSync(tempDir, { recursive: true });
		fs.mkdirSync(pluginDir, { recursive: true });

		// 포함할 파일/폴더 목록
		const includeItems = [
			'build/',
			'*.php',
			'readme.txt',
			'README.md',
			'CHANGELOG.md',
			'LICENSE',
			'composer.json',
			'package.json'
		];

		// 제외할 파일/폴더 목록
		const excludePatterns = [
			'node_modules/',
			'src/',
			'scripts/',
			'*.log',
			'.git*',
			'.env*',
			'temp-plugin/',
			'*.zip',
			'webpack.config.js',
			'tsconfig.json',
			'*.ts'
		];

		console.log('📁 파일 복사 중...');

		// 현재 디렉토리의 모든 파일을 확인하고 복사
		const copyFiles = (sourceDir: string, targetDir: string, basePath = '') => {
			const items = fs.readdirSync(sourceDir, { withFileTypes: true });

			for (const item of items) {
				const sourcePath = path.join(sourceDir, item.name);
				const relativePath = path.join(basePath, item.name);
				const targetPath = path.join(targetDir, item.name);

				// 제외 패턴 확인
				const shouldExclude = excludePatterns.some(pattern => {
					if (pattern.endsWith('/')) {
						return relativePath.startsWith(pattern) || relativePath + '/' === pattern;
					}
					return relativePath === pattern || relativePath.includes(pattern);
				});

				if (shouldExclude) {
					continue;
				}

				if (item.isDirectory()) {
					// 디렉토리인 경우 재귀 복사
					if (!fs.existsSync(targetPath)) {
						fs.mkdirSync(targetPath, { recursive: true });
					}
					copyFiles(sourcePath, targetPath, relativePath);
				} else {
					// 파일인 경우 복사
					fs.copyFileSync(sourcePath, targetPath);
				}
			}
		};

		// 파일 복사 실행
		copyFiles(process.cwd(), pluginDir);

		// ZIP 파일 생성
		console.log('🗜️ ZIP 파일 압축 중...');

		const zipPath = path.join(process.cwd(), zipName);

		// 기존 ZIP 파일 삭제
		if (fs.existsSync(zipPath)) {
			fs.unlinkSync(zipPath);
		}

		// zip 명령어로 압축 (macOS/Linux)
		try {
			execSync(`cd ${tempDir} && zip -r "${zipPath}" "${pluginName}"`, { stdio: 'inherit' });
		} catch (error) {
			// zip 명령어가 없는 경우 대체 방법 시도
			console.warn('⚠️ zip 명령어를 찾을 수 없습니다. 대체 방법을 시도합니다...');

			// Node.js 내장 기능으로 압축 (간단한 구현)
			const archiver = require('archiver');
			const output = fs.createWriteStream(zipPath);
			const archive = archiver('zip', { zlib: { level: 9 } });

			archive.pipe(output);
			archive.directory(pluginDir, pluginName);
			await archive.finalize();
		}

		// 임시 디렉토리 정리
		fs.rmSync(tempDir, { recursive: true, force: true });

		// 결과 출력
		const stats = fs.statSync(zipPath);
		const fileSizeInBytes = stats.size;
		const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

		console.log('✅ ZIP 파일이 성공적으로 생성되었습니다!');
		console.log(`📁 파일명: ${zipName}`);
		console.log(`📊 파일 크기: ${fileSizeInMB} MB`);
		console.log(`📍 경로: ${zipPath}`);

		// 포함된 주요 파일들 나열
		console.log('\n📋 포함된 주요 파일들:');
		console.log('  • PHP 플러그인 파일');
		console.log('  • build/ (빌드된 JavaScript, CSS, block.json)');
		console.log('  • blocks-manifest.php');
		console.log('  • README.md');

	} catch (error) {
		console.error('❌ ZIP 파일 생성 실패:', error);
		process.exit(1);
	}
}

// archiver 패키지가 없는 경우를 위한 polyfill
try {
	require('archiver');
} catch {
	console.log('📦 archiver 패키지 설치 중...');
	execSync('npm install archiver --save-dev', { stdio: 'inherit' });
}

// 스크립트 실행
createPluginZip().catch(console.error);