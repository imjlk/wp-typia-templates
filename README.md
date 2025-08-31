# WordPress Typia Block Boilerplate

TypeScript 타입 정의에서 WordPress block.json을 자동 생성하는 Typia 기반 블록 보일러플레이트입니다.

## 🚀 핵심 기능

- **Typia 자동 타입 변환**: TypeScript 인터페이스에서 WordPress block.json attributes 자동 생성
- **런타임 타입 검증**: Typia를 통한 강력한 타입 안전성  
- **WordPress Interactivity API**: 최신 WordPress 프론트엔드 상호작용 시스템
- **개발자 친화적**: 타입 안전한 개발 환경

## 📁 프로젝트 구조

```
wp-typia-boilerplate/
├── templates/               # 다양한 템플릿 베리에이션
│   ├── basic/              # 기본 Typia 기능만
│   ├── full/               # 유틸리티 + 훅 + ErrorBoundary
│   ├── interactivity/      # WordPress Interactivity API 중심
│   └── advanced/           # 🆕 마이그레이션 자동화 + 모든 기능
├── test-template/          # 테스트용 실제 블록
│   └── my-typia-block/
└── README.md
```

## 🔄 작동 원리

1. **TypeScript 타입 정의**:
```typescript
export interface MyTypiaBlockAttributes {
    content: string & tags.MinLength<0> & tags.MaxLength<1000> & tags.Default<"">;
    alignment?: ("left" | "center" | "right" | "justify") & tags.Default<"left">;
    isVisible?: boolean & tags.Default<true>;
}
```

2. **자동 block.json 생성**:
```bash
npm run sync-types  # 타입에서 block.json attributes 자동 생성
```

3. **생성된 block.json**:
```json
{
    "attributes": {
        "content": {
            "type": "string",
            "default": ""
        },
        "alignment": {
            "type": "string", 
            "default": "left"
        },
        "isVisible": {
            "type": "boolean",
            "default": true
        }
    }
}
```

## ✅ 검증된 기능

- ✅ Typia tags → WordPress attributes 변환
- ✅ `tags.Default<value>` → `"default": value` 매핑  
- ✅ TypeScript 타입 → WordPress 타입 자동 매핑
- ✅ 빌드 시스템 통합 (`prebuild` hook)
- ✅ Webpack 컴파일 호환성

## 🎯 템플릿 베리에이션

### 1. **Basic** - 핵심 Typia 기능
- ✅ TypeScript 타입에서 block.json 자동 생성
- ✅ Typia 런타임 검증
- ✅ 최소한의 기능으로 빠른 시작

**사용 예정:**
```bash
npx @wordpress/create-block my-block --template="@your-org/wp-typia-basic"
```

### 2. **Full** - 완전한 개발 환경
- ✅ Basic의 모든 기능
- ✅ 유틸리티 함수들 (UUID, classNames, debounce, throttle)
- ✅ 커스텀 훅들 (useDebounce, useLocalStorage)
- ✅ ErrorBoundary 컴포넌트
- ✅ 개선된 에디터 경험

**사용 예정:**
```bash
npx @wordpress/create-block my-block --template="@your-org/wp-typia-full"
```

### 3. **Interactivity** - WordPress Interactivity API 중심
- ✅ Basic의 모든 기능
- ✅ 고급 Interactivity API 스토어
- ✅ 카운터, 입력 처리, 비동기 작업
- ✅ 에러 핸들링 및 히스토리 추적
- ✅ 콜백 및 워처 기능

**사용 예정:**
```bash
npx @wordpress/create-block my-block --template="@your-org/wp-typia-interactivity"
```

### 4. **Advanced** 🆕 - 마이그레이션 자동화 + 엔터프라이즈
- ✅ Full 템플릿의 모든 기능
- 🚀 **자동 마이그레이션 생성** - 타입 변경에서 마이그레이션 스크립트 자동 생성
- 🔄 **버전 관리 시스템** - `V1`, `V2`, `V3` 타입으로 히스토리 관리
- 🛠 **WordPress deprecated 통합** - 완전 자동 블록 업그레이드
- 📊 **마이그레이션 리포트** - 변경 사항 추적 및 로깅
- 🧪 **마이그레이션 테스트 도구** - `npm run test-migrations`

**핵심 명령어:**
```bash
npm run generate-migrations  # 타입에서 마이그레이션 자동 생성
npm run test-migrations      # 마이그레이션 테스트
npm run migration-stats      # 마이그레이션 통계
```

**사용 예정:**
```bash
npx @wordpress/create-block my-block --template="@your-org/wp-typia-advanced"
```

## 🛠 사용법

### 현재 테스트 방법
```bash
cd test-template/my-typia-block
npm run sync-types  # ✅ 성공적으로 6개 속성 생성
npm run build       # ✅ 웹팩 컴파일 성공
```

## 📦 주요 의존성

- `typia`: TypeScript 런타임 타입 검증
- `tsx`: TypeScript 실행 엔진
- `@wordpress/scripts`: WordPress 빌드 도구
- `@wordpress/interactivity`: WordPress Interactivity API

## 🎯 실제 동작 확인

`test-template/my-typia-block`에서 실제 작동하는 예시를 확인할 수 있습니다:

```bash
cd test-template/my-typia-block
npm run sync-types  # ✅ 성공적으로 6개 속성 생성
npm run build       # ✅ 웹팩 컴파일 성공
```

생성된 attributes: `id`, `version`, `className`, `content`, `alignment`, `isVisible`