# Typia 활용 예시 모음

WordPress 블록 개발에서 Typia를 활용하는 실제 예시들을 정리했습니다.

## 📚 목차

1. [기본 타입 정의](#기본-타입-정의)
2. [자동 block.json 생성](#자동-blockjson-생성)  
3. [런타임 검증](#런타임-검증)
4. [마이그레이션 시스템](#마이그레이션-시스템)
5. [고급 활용 패턴](#고급-활용-패턴)

## 기본 타입 정의

### 1. 단순한 블록 속성

```typescript
import { tags } from "typia";

export interface SimpleBlockAttributes {
    /**
     * 블록 제목
     */
    title: string & tags.Default<"기본 제목">;
    
    /**
     * 표시 여부
     */
    isVisible: boolean & tags.Default<true>;
    
    /**
     * 정렬 방식
     */
    alignment: ("left" | "center" | "right") & tags.Default<"left">;
}
```

### 2. 검증 규칙이 포함된 속성

```typescript
export interface ValidatedBlockAttributes {
    /**
     * 사용자 이메일 (이메일 형식 검증)
     */
    email: string & tags.Format<"email"> & tags.Default<"">;
    
    /**
     * 나이 (1-100 범위)
     */
    age: number & tags.Minimum<1> & tags.Maximum<100> & tags.Default<25>;
    
    /**
     * 사용자명 (3-20자, 영숫자만)
     */
    username: string & 
        tags.MinLength<3> & 
        tags.MaxLength<20> & 
        tags.Pattern<"^[a-zA-Z0-9]+$">;
    
    /**
     * UUID 형식의 고유 ID
     */
    id: string & tags.Format<"uuid">;
    
    /**
     * 컬러 코드 (#RRGGBB 형식)
     */
    backgroundColor: string & 
        tags.Pattern<"^#[0-9A-Fa-f]{6}$"> & 
        tags.Default<"#ffffff">;
}
```

### 3. 중첩 객체와 배열

```typescript
export interface ComplexBlockAttributes {
    /**
     * 설정 객체
     */
    settings: {
        theme: ("light" | "dark") & tags.Default<"light">;
        fontSize: number & tags.Minimum<10> & tags.Maximum<72> & tags.Default<16>;
        animations: boolean & tags.Default<false>;
    } & tags.Default<{}>;
    
    /**
     * 항목 목록 (최대 10개)
     */
    items: Array<{
        id: string & tags.Format<"uuid">;
        title: string & tags.MinLength<1> & tags.MaxLength<100>;
        description?: string & tags.MaxLength<500>;
        priority: number & tags.Minimum<1> & tags.Maximum<5> & tags.Default<3>;
    }> & tags.MaxItems<10> & tags.Default<[]>;
    
    /**
     * 태그 배열 (각 태그는 2-20자)
     */
    tags: Array<string & tags.MinLength<2> & tags.MaxLength<20>> & 
        tags.MinItems<1> & 
        tags.MaxItems<5> & 
        tags.Default<[]>;
}
```

## 자동 block.json 생성

### sync-types-to-block-json.ts 핵심 로직

```typescript
function parseTypesFromContent(content: string): Record<string, any> {
    const attributes: Record<string, any> = {};
    
    // MyTypiaBlockAttributes 인터페이스 찾기
    const interfaceMatch = content.match(/interface\s+MyTypiaBlockAttributes[^{]*{([^}]*)}/s);
    
    if (interfaceMatch) {
        const interfaceBody = interfaceMatch[1];
        
        // 각 속성 파싱
        const propertyRegex = /(\w+)(\?)?:\s*([^;]+);/g;
        let match;
        
        while ((match = propertyRegex.exec(interfaceBody)) !== null) {
            const [, propName, optional, propType] = match;
            
            // WordPress 속성 형식으로 변환
            const attribute: any = {
                type: mapTypeScriptTypeToWP(propType.trim())
            };
            
            // tags.Default<value> 추출
            const defaultMatch = propType.match(/tags\.Default<([^>]+)>/);
            if (defaultMatch) {
                const defaultValue = parseDefaultValue(defaultMatch[1]);
                attribute.default = defaultValue;
            }
            
            attributes[propName] = attribute;
        }
    }
    
    return attributes;
}

function mapTypeScriptTypeToWP(tsType: string): string {
    // Typia tags 제거 후 기본 타입 추출
    const cleanType = tsType.replace(/\s*&\s*tags\.[^&]+/g, '').trim();
    
    if (cleanType.startsWith('string')) return 'string';
    if (cleanType.startsWith('number')) return 'number';
    if (cleanType.startsWith('boolean')) return 'boolean';
    if (cleanType.includes('[]') || cleanType.startsWith('Array')) return 'array';
    if (cleanType.startsWith('{')) return 'object';
    if (cleanType.includes('|')) return 'string'; // Union → string
    
    return 'string'; // fallback
}
```

### 실제 변환 결과

**입력 (TypeScript):**
```typescript
export interface BlogPostAttributes {
    title: string & tags.MinLength<1> & tags.MaxLength<100> & tags.Default<"새 포스트">;
    content: string & tags.MinLength<0> & tags.MaxLength<5000> & tags.Default<"">;
    publishDate: string & tags.Format<"date"> & tags.Default<"">;
    isPublished: boolean & tags.Default<false>;
    categories: Array<string> & tags.MaxItems<5> & tags.Default<[]>;
    metadata: {
        viewCount: number & tags.Minimum<0> & tags.Default<0>;
        likes: number & tags.Minimum<0> & tags.Default<0>;
    } & tags.Default<{}>;
}
```

**출력 (block.json):**
```json
{
    "attributes": {
        "title": {
            "type": "string",
            "default": "새 포스트"
        },
        "content": {
            "type": "string", 
            "default": ""
        },
        "publishDate": {
            "type": "string",
            "default": ""
        },
        "isPublished": {
            "type": "boolean",
            "default": false
        },
        "categories": {
            "type": "array",
            "default": []
        },
        "metadata": {
            "type": "object",
            "default": {}
        }
    }
}
```

## 런타임 검증

### 블록 에디터에서의 검증

```typescript
import { createValidators } from './validators';
import { useTypiaValidation } from './hooks';

const validators = createValidators<MyBlockAttributes>();

export default function Edit({ attributes, setAttributes }) {
    const { isValid, errors } = useTypiaValidation(attributes, validators.validate);
    
    const updateAttribute = <K extends keyof MyBlockAttributes>(
        key: K,
        value: MyBlockAttributes[K]
    ) => {
        const newAttrs = { ...attributes, [key]: value };
        const validation = validators.validate(newAttrs);
        
        if (validation.success) {
            setAttributes({ [key]: value });
        } else {
            console.error(`Validation failed for ${String(key)}:`, validation.errors);
            // 사용자에게 오류 표시
            wp.data.dispatch('core/notices').createErrorNotice(
                `Invalid ${String(key)}: ${validation.errors[0]?.message}`,
                { type: 'snackbar' }
            );
        }
    };

    return (
        <div {...useBlockProps()}>
            {!isValid && (
                <div className="validation-errors">
                    <strong>Validation Errors:</strong>
                    <ul>
                        {errors.map((error, i) => (
                            <li key={i}>{error.path}: {error.message}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            <input
                type="text"
                value={attributes.title || ''}
                onChange={(e) => updateAttribute('title', e.target.value)}
            />
        </div>
    );
}
```

### 프론트엔드에서의 검증

```typescript
// view.js - Interactivity API 스토어
import { store } from '@wordpress/interactivity';
import { createValidators } from './validators';

const validators = createValidators<MyBlockAttributes>();

const { state, actions } = store('my-plugin/my-block', {
    state: {
        isValid: true,
        errors: []
    },
    
    actions: {
        updateData(newData) {
            const validation = validators.validate(newData);
            
            if (validation.success) {
                // 데이터 업데이트
                Object.assign(state, newData);
                state.isValid = true;
                state.errors = [];
            } else {
                // 검증 실패
                state.isValid = false;
                state.errors = validation.errors;
                
                console.error('Client-side validation failed:', validation.errors);
            }
        },
        
        async submitForm() {
            if (!state.isValid) {
                alert('Please fix validation errors before submitting');
                return;
            }
            
            // 서버로 전송
            const response = await fetch('/wp-json/my-plugin/v1/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            });
            
            if (response.ok) {
                alert('Data submitted successfully!');
            }
        }
    }
});
```

## 마이그레이션 시스템

### 버전별 타입 정의

```typescript
// V1 - 초기 버전
export interface MyBlockAttributesV1 {
    title: string & tags.Default<"">;
    content: string & tags.Default<"">;
}

// V2 - 설정 추가
export interface MyBlockAttributesV2 {
    title: string & tags.MinLength<1> & tags.MaxLength<100> & tags.Default<"">;
    content: string & tags.MinLength<0> & tags.MaxLength<2000> & tags.Default<"">;
    settings: {
        fontSize: number & tags.Minimum<10> & tags.Maximum<72> & tags.Default<16>;
        theme: ("light" | "dark") & tags.Default<"light">;
    } & tags.Default<{}>;
}

// V3 - UUID 및 메타데이터 추가
export interface MyBlockAttributesV3 {
    id: string & tags.Format<"uuid">;
    version: number & tags.Type<"uint32"> & tags.Default<3>;
    title: string & tags.MinLength<1> & tags.MaxLength<100> & tags.Default<"">;
    content: string & tags.MinLength<0> & tags.MaxLength<5000> & tags.Default<"">; // 길이 확장
    settings: {
        fontSize: number & tags.Minimum<10> & tags.Maximum<72> & tags.Default<16>;
        theme: ("light" | "dark" | "auto") & tags.Default<"auto">; // 새 옵션
        animations: boolean & tags.Default<true>; // 새 필드
    } & tags.Default<{}>;
    metadata: {
        createdAt: string & tags.Format<"date-time"> & tags.Default<"">;
        updatedAt: string & tags.Format<"date-time"> & tags.Default<"">;
    } & tags.Default<{}>;
}

export type MyBlockAttributes = MyBlockAttributesV3; // 현재 버전
```

### 자동 마이그레이션 함수

```typescript
import typia from "typia";

// V1 → V2 마이그레이션
export function migrateV1ToV2(v1Attrs: MyBlockAttributesV1): MyBlockAttributesV2 {
    const migrated: MyBlockAttributesV2 = {
        title: v1Attrs.title || "",
        content: v1Attrs.content || "",
        settings: {
            fontSize: 16,
            theme: "light"
        }
    };
    
    // 마이그레이션 결과 검증
    const validation = typia.validate<MyBlockAttributesV2>(migrated);
    if (!validation.success) {
        throw new Error('V1→V2 migration validation failed');
    }
    
    return migrated;
}

// V2 → V3 마이그레이션  
export function migrateV2ToV3(v2Attrs: MyBlockAttributesV2): MyBlockAttributesV3 {
    const now = new Date().toISOString();
    
    const migrated: MyBlockAttributesV3 = {
        id: crypto.randomUUID(),
        version: 3,
        title: v2Attrs.title,
        content: v2Attrs.content,
        settings: {
            ...v2Attrs.settings,
            theme: v2Attrs.settings.theme === "light" ? "auto" : v2Attrs.settings.theme,
            animations: true // 새 기본값
        },
        metadata: {
            createdAt: now,
            updatedAt: now
        }
    };
    
    const validation = typia.validate<MyBlockAttributesV3>(migrated);
    if (!validation.success) {
        throw new Error('V2→V3 migration validation failed');
    }
    
    return migrated;
}

// 자동 체인 마이그레이션
export function autoMigrate(attributes: any): MyBlockAttributes {
    const version = detectVersion(attributes);
    
    switch (version) {
        case "1.0.0":
            const v2 = migrateV1ToV2(attributes);
            return migrateV2ToV3(v2);
        case "2.0.0":
            return migrateV2ToV3(attributes);
        case "3.0.0":
            return attributes;
        default:
            throw new Error('Unknown version');
    }
}
```

### WordPress deprecated 통합

```typescript
// deprecated.ts
export const deprecated = [
    // V2 deprecated
    {
        attributes: {
            title: { type: 'string', default: '' },
            content: { type: 'string', default: '' },
            settings: { type: 'object', default: {} }
        },
        migrate: migrateV2ToV3,
        isEligible: (attrs: any) => 
            'settings' in attrs && !('id' in attrs) && !('version' in attrs)
    },
    
    // V1 deprecated  
    {
        attributes: {
            title: { type: 'string', default: '' },
            content: { type: 'string', default: '' }
        },
        migrate: (attrs: any) => {
            const v2 = migrateV1ToV2(attrs);
            return migrateV2ToV3(v2);
        },
        isEligible: (attrs: any) => 
            'title' in attrs && 'content' in attrs && !('settings' in attrs)
    }
];
```

## 고급 활용 패턴

### 1. 조건부 타입과 Discriminated Union

```typescript
export interface ConditionalBlockAttributes {
    /**
     * 블록 타입
     */
    blockType: ("text" | "image" | "video") & tags.Default<"text">;
    
    /**
     * 타입별 설정
     */
    config: (
        | {
            blockType: "text";
            fontSize: number & tags.Minimum<10> & tags.Maximum<72>;
            color: string & tags.Pattern<"^#[0-9A-Fa-f]{6}$">;
        }
        | {
            blockType: "image";
            src: string & tags.Format<"uri">;
            alt: string & tags.MaxLength<200>;
            width?: number & tags.Minimum<1>;
            height?: number & tags.Minimum<1>;
        }
        | {
            blockType: "video";
            videoUrl: string & tags.Format<"uri">;
            autoplay: boolean & tags.Default<false>;
            controls: boolean & tags.Default<true>;
        }
    ) & tags.Default<{}>;
}
```

### 2. 다국어 지원

```typescript
export interface MultiLanguageBlockAttributes {
    /**
     * 현재 언어
     */
    currentLanguage: ("ko" | "en" | "ja" | "zh") & tags.Default<"ko">;
    
    /**
     * 다국어 콘텐츠
     */
    content: {
        ko: string & tags.MaxLength<1000> & tags.Default<"">;
        en: string & tags.MaxLength<1000> & tags.Default<"">;
        ja?: string & tags.MaxLength<1000>;
        zh?: string & tags.MaxLength<1000>;
    } & tags.Default<{}>;
    
    /**
     * 번역 상태
     */
    translationStatus: Record<string, ("completed" | "in_progress" | "pending")> & 
        tags.Default<{}>;
}
```

### 3. 권한 기반 속성

```typescript
export interface RoleBasedBlockAttributes {
    /**
     * 공개 설정 (모든 사용자)
     */
    public: {
        title: string & tags.MaxLength<100> & tags.Default<"">;
        description: string & tags.MaxLength<500> & tags.Default<"">;
    } & tags.Default<{}>;
    
    /**
     * 에디터 전용 설정
     */
    editor: {
        draft: boolean & tags.Default<false>;
        notes: string & tags.MaxLength<1000> & tags.Default<"">;
        lastEditBy: string & tags.Default<"">;
    } & tags.Default<{}>;
    
    /**
     * 관리자 전용 설정
     */
    admin: {
        analytics: boolean & tags.Default<true>;
        seoSettings: {
            metaTitle?: string & tags.MaxLength<60>;
            metaDescription?: string & tags.MaxLength<160>;
            canonical?: string & tags.Format<"uri">;
        } & tags.Default<{}>;
    } & tags.Default<{}>;
}
```

### 4. 실시간 검증과 자동 수정

```typescript
export class SmartValidator {
    static createAutoFixingValidator<T>(validator: (data: any) => typia.IValidation<T>) {
        return {
            validate: validator,
            
            validateAndFix(data: any): { result: T; fixed: boolean; changes: string[] } {
                const validation = validator(data);
                
                if (validation.success) {
                    return { result: validation.data, fixed: false, changes: [] };
                }
                
                // 자동 수정 시도
                const fixed = { ...data };
                const changes: string[] = [];
                
                for (const error of validation.errors) {
                    const path = error.path;
                    
                    if (error.expected === 'string' && typeof fixed[path] !== 'string') {
                        fixed[path] = String(fixed[path] || '');
                        changes.push(`${path}: converted to string`);
                    }
                    
                    if (error.expected === 'number' && typeof fixed[path] !== 'number') {
                        const num = Number(fixed[path]);
                        if (!isNaN(num)) {
                            fixed[path] = num;
                            changes.push(`${path}: converted to number`);
                        }
                    }
                    
                    // URL 형식 자동 수정
                    if (error.message.includes('uri') && typeof fixed[path] === 'string') {
                        if (!fixed[path].startsWith('http')) {
                            fixed[path] = 'https://' + fixed[path];
                            changes.push(`${path}: added https:// prefix`);
                        }
                    }
                    
                    // 길이 초과 자동 자르기
                    if (error.message.includes('MaxLength') && typeof fixed[path] === 'string') {
                        const match = error.message.match(/MaxLength<(\d+)>/);
                        if (match) {
                            const maxLength = parseInt(match[1]);
                            if (fixed[path].length > maxLength) {
                                fixed[path] = fixed[path].slice(0, maxLength);
                                changes.push(`${path}: trimmed to ${maxLength} characters`);
                            }
                        }
                    }
                }
                
                // 재검증
                const revalidation = validator(fixed);
                
                return {
                    result: revalidation.success ? revalidation.data : data,
                    fixed: revalidation.success && changes.length > 0,
                    changes
                };
            }
        };
    }
}

// 사용 예시
const smartValidator = SmartValidator.createAutoFixingValidator(
    typia.createValidate<MyBlockAttributes>()
);

const { result, fixed, changes } = smartValidator.validateAndFix({
    title: 123, // → "123" 자동 변환
    url: "example.com", // → "https://example.com" 자동 변환
    description: "very long description...".repeat(100) // → 자동 자르기
});

if (fixed) {
    console.log('Auto-fixed the following issues:', changes);
    console.log('Fixed data:', result);
}
```

이 예시들을 참고하여 각 템플릿에서 Typia의 강력한 기능들을 최대한 활용할 수 있습니다!