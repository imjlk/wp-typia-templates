import * as fs from "fs";
import * as path from "path";

/**
 * 🚀 blocks-manifest.php 자동 생성 스크립트
 *
 * WordPress 6.7+ 블록 메타데이터 컬렉션 기능을 위한 manifest 파일을 생성합니다.
 */

async function generateBlocksManifest() {
	try {
		const buildDir = path.join(process.cwd(), 'build');
		const manifestPath = path.join(buildDir, 'blocks-manifest.php');

		// build 디렉토리 확인
		if (!fs.existsSync(buildDir)) {
			console.error('❌ build 디렉토리가 존재하지 않습니다.');
			return;
		}

		// build 디렉토리 내의 모든 블록 찾기
		const blocks: Record<string, any> = {};

		const buildContents = fs.readdirSync(buildDir, { withFileTypes: true });

		for (const item of buildContents) {
			if (item.isDirectory()) {
				const blockJsonPath = path.join(buildDir, item.name, 'block.json');

				if (fs.existsSync(blockJsonPath)) {
					try {
						const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, 'utf-8'));

						blocks[item.name] = {
							path: `__DIR__ . '/${item.name}/block.json'`,
							name: blockJson.name,
							version: blockJson.version,
							title: blockJson.title,
							category: blockJson.category,
							textdomain: blockJson.textdomain,
						};
					} catch (error) {
						console.warn(`⚠️ ${item.name}/block.json 파싱 실패:`, error);
					}
				}
			}
		}

		if (Object.keys(blocks).length === 0) {
			console.warn('⚠️ 등록할 블록이 없습니다.');
			return;
		}

		// PHP 배열 형식으로 변환
		const phpArray = Object.entries(blocks).map(([key, value]) => {
			return `\t'${key}' => array(
\t\t'path' => ${value.path},
\t\t'name' => '${value.name}',
\t\t'version' => '${value.version}',
\t\t'title' => '${value.title}',
\t\t'category' => '${value.category}',
\t\t'textdomain' => '${value.textdomain}',
\t),`;
		}).join('\n');

		// manifest 파일 내용 생성
		const manifestContent = `<?php
/**
 * Block metadata manifest
 *
 * This file is auto-generated. Do not edit directly.
 * Generated at: ${new Date().toISOString()}
 */

return array(
${phpArray}
);`;

		// manifest 파일 작성
		fs.writeFileSync(manifestPath, manifestContent);

		console.log('✅ blocks-manifest.php가 생성되었습니다!');
		console.log('📝 등록된 블록:', Object.keys(blocks));

	} catch (error) {
		console.error('❌ manifest 생성 실패:', error);
		process.exit(1);
	}
}

// 스크립트 실행
generateBlocksManifest().catch(console.error);