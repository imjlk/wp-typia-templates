import { createValidators, createAttributeUpdater } from '../../templates/full/src/validators';
import typia from 'typia';

// Test interface matching the project structure
interface TestBlockAttributes {
  id?: string;
  version?: number;
  className?: string;
  content: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  isVisible?: boolean;
}

describe('Validators', () => {
  const validators = createValidators<TestBlockAttributes>();

  describe('validate', () => {
    test('should validate correct attributes', () => {
      const validAttrs: TestBlockAttributes = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        version: 1,
        className: 'custom-class',
        content: 'Hello World',
        alignment: 'center',
        isVisible: true,
      };

      const result = validators.validate(validAttrs);
      expect(result.success).toBe(true);
    });

    test('should reject invalid UUID', () => {
      const invalidAttrs: TestBlockAttributes = {
        content: 'Test',
        id: 'not-a-uuid',
      };

      const result = validators.validate(invalidAttrs);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject invalid alignment', () => {
      const invalidAttrs: TestBlockAttributes = {
        content: 'Test',
        alignment: 'invalid' as any,
      };

      const result = validators.validate(invalidAttrs);
      expect(result.success).toBe(false);
    });
  });

  describe('is', () => {
    test('should return true for valid attributes', () => {
      const validAttrs: TestBlockAttributes = {
        content: 'Hello World',
      };

      expect(validators.is(validAttrs)).toBe(true);
    });

    test('should return false for invalid attributes', () => {
      const invalidAttrs = { content: 123 as any };
      expect(validators.is(invalidAttrs)).toBe(false);
    });
  });

  describe('random', () => {
    test('should generate valid random attributes', () => {
      const randomAttrs = validators.random();
      
      // Should have required fields
      expect(randomAttrs).toHaveProperty('content');
      expect(typeof randomAttrs.content).toBe('string');
      
      // Should pass validation
      const result = validators.validate(randomAttrs);
      expect(result.success).toBe(true);
    });
  });

  describe('clone', () => {
    test('should create a deep copy of attributes', () => {
      const original: TestBlockAttributes = {
        content: 'Test',
        version: 1,
      };

      const cloned = validators.clone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });
  });

  describe('prune', () => {
    test('should remove undefined values', () => {
      const withUndefined: TestBlockAttributes = {
        content: 'Test',
        className: undefined,
        version: undefined,
      };

      const pruned = validators.prune(withUndefined);
      
      expect(pruned).toEqual({ content: 'Test' });
      expect('className' in pruned).toBe(false);
    });
  });

  describe('createAttributeUpdater', () => {
    test('should update valid attributes', () => {
      const attributes: TestBlockAttributes = { content: 'Initial' };
      const setAttributes = jest.fn();
      const updater = createAttributeUpdater(attributes, setAttributes, validators.validate);

      const result = updater('content', 'Updated');
      
      expect(result).toBe(true);
      expect(setAttributes).toHaveBeenCalledWith({ content: 'Updated' });
    });

    test('should reject invalid updates', () => {
      const attributes: TestBlockAttributes = { content: 'Initial' };
      const setAttributes = jest.fn();
      const updater = createAttributeUpdater(attributes, setAttributes, validators.validate);

      const result = updater('alignment', 'invalid' as any);
      
      expect(result).toBe(false);
      expect(setAttributes).not.toHaveBeenCalled();
    });
  });
});