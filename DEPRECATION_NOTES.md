# Deprecation Warnings

## ⚠️ These Warnings Are Safe to Ignore

The following npm deprecation warnings appear during `npm install` but are **expected and safe to ignore**. They come from transitive dependencies and don't affect functionality.

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

1. **Current State**: ✅ The warnings are cosmetic and don't affect functionality
2. **Overrides**: ✅ We've added package.json overrides for `glob` and `rimraf` to use newer versions
3. **Future**: Upgrade to Next.js 15+ when stable to get ESLint 9 support (will eliminate ESLint warnings)

## Suppressing Warnings (Optional)

If you want to suppress these warnings during install, you can:

```bash
# Suppress all warnings
npm install --no-warnings

# Or set in .npmrc
echo "loglevel=error" >> .npmrc
```

**Note**: We don't recommend suppressing warnings as they can be useful for other issues. These specific warnings are known and expected.

## Verification

The app builds and runs correctly despite these warnings. They are informational only and don't indicate any problems with your setup.
