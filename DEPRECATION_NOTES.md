# Deprecation Warnings

## Expected Warnings

The following npm deprecation warnings are expected and safe to ignore:

### ESLint 8 Dependencies
- `@humanwhocodes/config-array@0.13.0` - Used by ESLint 8 (Next.js 14 dependency)
- `@humanwhocodes/object-schema@2.0.3` - Used by ESLint 8 (Next.js 14 dependency)
- `eslint@8.57.1` - Next.js 14 uses ESLint 8, which is deprecated but still functional

**Note:** These warnings will be resolved when Next.js updates to ESLint 9 or when you upgrade to Next.js 15+.

### Other Dependencies
- `inflight@1.0.6` - Transitive dependency, will be updated by package maintainers
- `rimraf@3.0.2` - Transitive dependency, we've added overrides to use v5
- `glob@7.2.3` - Transitive dependency, we've added overrides to use v10

## Solutions

1. **Current State**: The warnings are cosmetic and don't affect functionality
2. **Future**: Upgrade to Next.js 15+ when stable to get ESLint 9 support
3. **Overrides**: We've added package.json overrides for `glob` and `rimraf` to use newer versions

## Verification

Run `npm install` - you should see fewer warnings now. The remaining warnings are from ESLint 8 which is a Next.js 14 dependency.
