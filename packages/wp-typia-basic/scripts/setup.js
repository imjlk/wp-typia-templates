#!/usr/bin/env node

/**
 * WordPress Typia Block 설치 스크립트
 * 사용자 입력을 받아 템플릿 파일을 생성하고 설정합니다.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 질문 템플릿
const questions = [
  {
    name: 'blockName',
    message: '블록 이름 (소문자, 하이픈 사용):',
    default: 'my-typia-block',
    validate: (input) => /^[a-z][a-z0-9-]*$/.test(input) || '소문자, 숫자, 하이픈만 사용 가능합니다'
  },
  {
    name: 'title',
    message: '블록 제목:',
    default: (answers) => {
      return answers.blockName.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  },
  {
    name: 'namespace',
    message: '네임스페이스:',
    default: 'create-block'
  },
  {
    name: 'description',
    message: '블록 설명:',
    default: 'Typia 기반 타입 안전 블록'
  },
  {
    name: 'author',
    message: '작성자:',
    default: () => {
      try {
        return execSync('git config user.name', { encoding: 'utf8' }).trim();
      } catch {
        return 'Your Name';
      }
    }
  },
  {
    name: 'textDomain',
    message: '텍스트 도메인:',
    default: (answers) => answers.blockName.replace(/-/g, '_')
  }
];

// 간단한 inquirer 구현
async function askQuestion(q) {
  console.log(`\n${q.message}${q.default ? ` (${q.default})` : ''}:`);
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question('> ', answer => {
      rl.close();
      
      const result = answer.trim() || q.default;
      
      if (q.validate && !q.validate(result)) {
        console.log('❌ ' + q.validate(result));
        return askQuestion(q).then(resolve);
      }
      
      resolve(result);
    });
  });
}

// 변수 치환
function replaceVariables(content, variables) {
  return content.replace(/{{([^}]+)}}/g, (match, key) => {
    const mapping = {
      'slug': variables.blockName,
      'title': variables.title,
      'pascalCase': variables.blockName.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(''),
      'namespace': variables.namespace,
      'description': variables.description,
      'author': variables.author,
      'textDomain': variables.textDomain,
      'keyword': variables.blockName.replace('-', ' ')
    };
    return mapping[key] || match;
  });
}

// 파일 복사 및 템플릿 처리
function processTemplate(src, dest, variables) {
  const content = fs.readFileSync(src, 'utf8');
  const processed = replaceVariables(content, variables);
  fs.writeFileSync(dest, processed);
}

// 메인 함수
async function setup() {
  console.log('🚀 WordPress Typia Block 설정을 시작합니다...\n');
  
  // 질문
  const answers = {};
  for (const q of questions) {
    answers[q.name] = await askQuestion(q);
  }
  
  console.log('\n📁 파일 생성 중...\n');
  
  // 템플릿 파일 복사
  const templateDir = path.join(__dirname, '..', 'template');
  const files = [
    'src/types.ts',
    'src/validators.ts',
    'src/hooks.ts',
    'src/index.tsx',
    'src/edit.tsx',
    'src/save.tsx',
    'src/block.json',
    'src/style.scss',
    'scripts/sync-types-to-block-json.ts',
    'scripts/lib/typia-metadata-core.ts',
    'tsconfig.json',
    'webpack.config.js'
  ];
  
  // 필수 디렉토리 생성
  const dirs = ['src', 'scripts', 'scripts/lib'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // 파일 처리
  files.forEach(file => {
    const src = path.join(templateDir, file);
    const dest = file;
    
    if (fs.existsSync(src)) {
      processTemplate(src, dest, answers);
      console.log(`✅ ${dest}`);
    }
  });
  
  // package.json 처리
  const packageJsonPath = path.join(templateDir, 'package.json.mustache');
  if (fs.existsSync(packageJsonPath)) {
    const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
    const processed = replaceVariables(packageContent, answers);
    fs.writeFileSync('package.json', processed);
    console.log('✅ package.json');
  }
  
  // .gitignore 추가
  const gitignore = `
# Dependencies
node_modules/

# Build
build/
dist/

# Editor
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# WordPress
*.log
.wp-env/
`;
  
  fs.writeFileSync('.gitignore', gitignore);
  console.log('✅ .gitignore');
  
  // README.md 생성
  const readme = `# ${answers.title}

${answers.description}

## 설치

\`\`\`bash
npm install
\`\`\`

## 개발

\`\`\`bash
# 개발 서버 시작
npm start

# 빌드
npm run build

# 타입 동기화
npm run sync-types
\`\`\`

## 사용법

1. 블록 에디터에서 "${answers.title}" 블록 추가
2. 설정 패널에서 옵션 조정
3. 저장하고 프론트엔드에서 확인

## 특징

- Typia 기반 타입 안전성
- 자동 런타임 유효성 검증
- TypeScript 지원
- WordPress 블록 에디터 통합

## 라이선스

GPL-2.0-or-later
`;
  
  fs.writeFileSync('README.md', readme);
  console.log('✅ README.md');
  
  console.log('\n🎉 설치가 완료되었습니다!');
  console.log('\n📋 다음 단계:');
  console.log('1. cd ' + answers.blockName);
  console.log('2. npm install');
  console.log('3. npm start');
  console.log('\n📚 자세한 사용법은 README.md를 참조하세요.');
}

// 실행
setup().catch(console.error);
