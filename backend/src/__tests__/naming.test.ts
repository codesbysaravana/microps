import { generateTargetGroupName, generateServiceName, generateTaskFamilyName } from '../utils/naming';

describe('naming utilities', () => {
  describe('generateTargetGroupName', () => {
    it('should generate deterministic names for same inputs', () => {
      const name1 = generateTargetGroupName(123, 'my-app');
      const name2 = generateTargetGroupName(123, 'my-app');
      expect(name1).toBe(name2);
    });

    it('should generate different names for different project names', () => {
      const name1 = generateTargetGroupName(123, 'my-app');
      const name2 = generateTargetGroupName(123, 'my-other-app');
      expect(name1).not.toBe(name2);
    });

    it('should generate different names for different user IDs', () => {
      const name1 = generateTargetGroupName(123, 'my-app');
      const name2 = generateTargetGroupName(456, 'my-app');
      expect(name1).not.toBe(name2);
    });

    it('should handle long project names without exceeding 32 char limit', () => {
      const longName = 'this-is-a-very-long-project-name-that-would-normally-cause-collisions';
      const name = generateTargetGroupName(123, longName);
      expect(name.length).toBeLessThanOrEqual(32);
    });

    it('should generate valid AWS target group names (alphanumeric + hyphens)', () => {
      const name = generateTargetGroupName(123, 'my-app');
      expect(name).toMatch(/^[a-zA-Z0-9-]+$/);
    });

    it('should include userId in the name for debuggability', () => {
      const name = generateTargetGroupName(123, 'my-app');
      expect(name).toContain('123');
    });

    it('should handle special characters in project names', () => {
      const name = generateTargetGroupName(123, 'my_app@2024!');
      expect(name).toMatch(/^[a-zA-Z0-9-]+$/);
      expect(name.length).toBeLessThanOrEqual(32);
    });

    it('should prevent collision for similar prefixes', () => {
      // This was the original bug: substring(0,14) would cause collisions
      const name1 = generateTargetGroupName(123, 'my-app-version-1-production');
      const name2 = generateTargetGroupName(123, 'my-app-version-2-production');
      expect(name1).not.toBe(name2);
    });
  });

  describe('generateServiceName', () => {
    it('should generate deterministic service names', () => {
      const name1 = generateServiceName(123, 'my-app');
      const name2 = generateServiceName(123, 'my-app');
      expect(name1).toBe(name2);
    });

    it('should use svc- prefix', () => {
      const name = generateServiceName(123, 'my-app');
      expect(name).toMatch(/^svc-u/);
    });
  });

  describe('generateTaskFamilyName', () => {
    it('should generate deterministic task family names', () => {
      const name1 = generateTaskFamilyName(123, 'my-app');
      const name2 = generateTaskFamilyName(123, 'my-app');
      expect(name1).toBe(name2);
    });

    it('should use task- prefix', () => {
      const name = generateTaskFamilyName(123, 'my-app');
      expect(name).toMatch(/^task-u/);
    });
  });
});
