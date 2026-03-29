import type { TextAlignment } from "@wp-typia/block-types/block-editor/alignment";
import { tags } from "typia";

/**
 * My Typia Block attributes with Typia validation
 */
export interface MyTypiaBlockAttributes {
	/**
	 * Unique identifier
	 */
	id?: string & tags.Format<"uuid">;
	
	/**
	 * Block version for migrations
	 */
	version?: number & tags.Type<"uint32"> & tags.Default<1>;
	
	/**
	 * Custom CSS class
	 */
	className?: string & tags.MaxLength<100>;
	
	/**
	 * Main content
	 */
	content: string & tags.MinLength<0> & tags.MaxLength<1000> & tags.Default<"">;
	
	/**
	 * Text alignment
	 */
	alignment?: TextAlignment & tags.Default<"left">;
	
	/**
	 * Is the block visible
	 */
	isVisible?: boolean & tags.Default<true>;
}

/**
 * My Typia Block interactivity state
 */
export interface MyTypiaBlockState {
	isActive: boolean;
	isLoading: boolean;
	error?: string;
}
