import { tags } from "typia";

/**
 * 블록 속성 인터페이스
 * Typia 태그를 사용하여 유효성 검증 규칙 정의
 */
export interface {{pascalCase}}Attributes {
  /**
   * 메인 콘텐츠
   */
  content: string & 
    tags.MinLength<1> & 
    tags.MaxLength<1000> & 
    tags.Default<"">;

  /**
   * 정렬 방식
   */
  alignment?: ('left' | 'center' | 'right' | 'justify') & 
    tags.Default<"left">;

  /**
   * 표시 여부
   */
  isVisible?: boolean & 
    tags.Default<true>;

  /**
   * 커스텀 CSS 클래스
   */
  className?: string & 
    tags.MaxLength<100> & 
    tags.Default<"">;

  /**
   * 고유 ID (자동 생성)
   */
  id?: string & 
    tags.Format<"uuid">;

  /**
   * 블록 버전 (마이그레이션용)
   */
  version?: number & 
    tags.Type<"uint32"> & 
    tags.Default<1>;
}