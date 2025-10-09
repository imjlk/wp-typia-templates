import { detectBlockMigration, generateMigrationReport } from '../../templates/advanced/src/migration-detector';

// Mock version types
interface V1Attributes {
  content: string;
  alignment?: 'left' | 'center' | 'right';
}

interface V2Attributes extends V1Attributes {
  alignment?: 'left' | 'center' | 'right' | 'justify';
  isVisible?: boolean;
  className?: string;
}

interface V3Attributes extends V2Attributes {
  id?: string;
  version?: number;
  theme?: 'light' | 'dark' | 'auto';
}

describe('Migration Detection Tests', () => {
  describe('detectBlockMigration', () => {
    test('should detect V1 blocks requiring migration', () => {
      const v1Attrs: V1Attributes = {
        content: 'Hello World',
        alignment: 'center'
      };

      const analysis = detectBlockMigration(v1Attrs, 'test/block');

      expect(analysis.needsMigration).toBe(true);
      expect(analysis.currentVersion).toBe('1.0.0');
      expect(analysis.targetVersion).toBe('3.0.0');
      expect(analysis.affectedFields.added).toContain('isVisible');
      expect(analysis.affectedFields.added).toContain('className');
    });

    test('should detect V2 blocks requiring partial migration', () => {
      const v2Attrs: V2Attributes = {
        content: 'Hello World',
        alignment: 'justify',
        isVisible: true,
        className: 'custom-class'
      };

      const analysis = detectBlockMigration(v2Attrs, 'test/block');

      expect(analysis.needsMigration).toBe(true);
      expect(analysis.currentVersion).toBe('2.0.0');
      expect(analysis.affectedFields.added).toContain('id');
      expect(analysis.affectedFields.added).toContain('version');
      expect(analysis.affectedFields.added).toContain('theme');
    });

    test('should identify V3 blocks as up-to-date', () => {
      const v3Attrs: V3Attributes = {
        content: 'Hello World',
        alignment: 'left',
        isVisible: true,
        className: 'custom-class',
        id: '550e8400-e29b-41d4-a716-446655440000',
        version: 3,
        theme: 'auto'
      };

      const analysis = detectBlockMigration(v3Attrs, 'test/block');

      expect(analysis.needsMigration).toBe(false);
      expect(analysis.currentVersion).toBe('3.0.0');
      expect(analysis.confidence).toBeCloseTo(1.0);
    });

    test('should handle malformed data with warnings', () => {
      const malformedAttrs = {
        content: null,
        alignment: 'invalid',
        unknownField: 'value'
      };

      const analysis = detectBlockMigration(malformedAttrs, 'test/block');

      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.confidence).toBeLessThan(1);
    });

    test('should provide detailed migration reasons', () => {
      const v1Attrs: V1Attributes = { content: 'Test' };

      const analysis = detectBlockMigration(v1Attrs, 'test/block');

      expect(analysis.reasons.length).toBeGreaterThan(0);
      expect(analysis.reasons.some(r => r.includes('v1.0.0'))).toBe(true);
      expect(analysis.reasons.some(r => r.includes('v3.0.0'))).toBe(true);
    });
  });

  describe('generateMigrationReport', () => {
    test('should generate comprehensive migration report', () => {
      const scanResults = [
        {
          blockName: 'test/my-block',
          postId: 1,
          postTitle: 'Test Post 1',
          analysis: {
            needsMigration: true,
            currentVersion: '1.0.0',
            targetVersion: '3.0.0',
            confidence: 0.9,
            reasons: ['Missing required fields'],
            warnings: [],
            affectedFields: {
              added: ['id', 'version', 'theme'],
              modified: ['content'],
              deprecated: []
            }
          },
          attributes: {}
        },
        {
          blockName: 'test/my-block',
          postId: 2,
          postTitle: 'Test Post 2',
          analysis: {
            needsMigration: false,
            currentVersion: '3.0.0',
            targetVersion: '3.0.0',
            confidence: 1.0,
            reasons: [],
            warnings: ['Data quality warning'],
            affectedFields: {
              added: [],
              modified: [],
              deprecated: []
            }
          },
          attributes: {}
        }
      ];

      const report = generateMigrationReport(scanResults);

      expect(report).toContain('Migration Report');
      expect(report).toContain('Total blocks scanned: 2');
      expect(report).toContain('Blocks needing migration: 1');
      expect(report).toContain('Blocks with warnings: 1');
      expect(report).toContain('Version 1.0.0');
    });
  });
});