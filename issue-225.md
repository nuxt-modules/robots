# Issue #225: Content Signals Implementation

## Summary

Successfully implemented support for Content Signals (AI Preferences IETF draft) in nuxt-robots module. This allows content creators to express preferences about how their content is used by AI systems through robots.txt files.

## Implementation Details

### Key Features Added

1. **Content-Usage Directive Parsing**: Added support for parsing `Content-Usage:` directives in robots.txt files
2. **Type System Integration**: Extended `GoogleInput` and `RobotsGroupResolved` interfaces to include `contentUsage` field
3. **Validation**: Added comprehensive validation for Content-Usage directives including format checking
4. **Generation**: Extended `generateRobotsTxt` to output Content-Usage directives
5. **Test Coverage**: Added comprehensive tests for parsing, validation, and generation

### Content-Usage Directive Syntax

Based on IETF draft-ietf-aipref-attach, the module now supports:

```
Content-Usage: ai=n                          # Global preference
Content-Usage: /public/ train-ai=y           # Path-specific preference
Content-Usage: /restricted/ ai=n train-ai=n # Multiple preferences
```

### Files Modified

- `src/runtime/types.ts`: Added `contentUsage` field to type definitions
- `src/util.ts`:
  - Added parsing logic for `content-usage` directive
  - Added validation for Content-Usage format
  - Updated `normalizeGroup` and `generateRobotsTxt` functions
- `test/unit/robotsTxtParser.test.ts`: Added Content Signals parsing tests
- `test/unit/robotsTxtValidator.test.ts`: Added Content Signals validation tests
- `test/unit/generateRobotsTxt.test.ts`: Added Content Signals generation tests

### Validation Rules

The implementation includes validation for:
- Empty Content-Usage rules (error)
- Missing preference assignments (must contain `=`)
- Invalid path formatting (paths must start with `/`)
- Proper format for both global and path-specific preferences

## Testing

All tests pass, including:
-  Content-Usage directive parsing
-  Content-Usage validation with comprehensive error messages
-  Content-Usage generation in robots.txt output
-  Updated existing test snapshots to include empty contentUsage arrays

## Impact

This implementation resolves the error mentioned in the original issue:
> "ERROR The ./public/_robots.txt file contains errors: - L1: Unknown directive content-usage"

The `content-usage` directive is now recognized and properly processed in "merge mode" as requested.

## Specification Compliance

The implementation follows the emerging IETF AI Preferences (AIPREF) working group specifications:
- draft-ietf-aipref-attach: Indicating Preferences Regarding Content Usage
- Supports both global and path-specific Content-Usage rules
- Maintains compatibility with existing robots.txt standards

## Example Usage

```javascript
// In nuxt.config.ts
export default defineNuxtConfig({
  robots: {
    groups: [
      {
        userAgent: '*',
        allow: '/',
        contentUsage: [
          'ai=n', // Disable AI usage globally
          '/public/ train-ai=y', // Allow AI training for /public/ path
          '/api/ ai=n train-ai=n' // Disable all AI usage for /api/ path
        ]
      }
    ]
  }
})
```

This generates:
```
User-agent: *
Allow: /
Content-Usage: ai=n
Content-Usage: /public/ train-ai=y
Content-Usage: /api/ ai=n train-ai=n
```
