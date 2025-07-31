# Bot Detection Behaviors

This directory contains modular bot detection behaviors that can be enabled/disabled independently. Each behavior is categorized by complexity and reliability.

## 🟢 Simple Behaviors (Recommended for Production)

### Path Analysis (`path-analysis.ts`)
- **What it does**: Checks for access to sensitive paths like `/wp-admin`, `/.env`, `/admin`
- **Reliability**: Very High
- **Complexity**: Low
- **False Positives**: Very Low
- **Recommendation**: ✅ Always enable

### Basic Timing (`timing-analysis.ts` - `analyzeBasicTiming`)
- **What it does**: Detects robotic timing patterns (too consistent intervals)
- **Reliability**: High
- **Complexity**: Low
- **False Positives**: Low
- **Recommendation**: ✅ Enable for most sites

### Basic Rate Limiting (`rate-limiting.ts` - `analyzeBasicRateLimit`)
- **What it does**: Simple request rate checking with fixed thresholds
- **Reliability**: High
- **Complexity**: Low
- **False Positives**: Low
- **Recommendation**: ✅ Enable with appropriate thresholds

### Basic User Agent (`user-agent-analysis.ts` - `analyzeBasicUserAgent`)
- **What it does**: Checks for missing/suspicious user agents and bot signatures
- **Reliability**: High
- **Complexity**: Low
- **False Positives**: Very Low
- **Recommendation**: ✅ Always enable

### Simple Patterns (`intent-analysis.ts` - `analyzeSimplePatterns`)
- **What it does**: Detects obvious scanning patterns and sequential ID enumeration
- **Reliability**: High
- **Complexity**: Low
- **False Positives**: Low
- **Recommendation**: ✅ Enable for most sites

### Basic Positive Signals (`positive-signals.ts` - `analyzeBasicPositiveSignals`)
- **What it does**: Rewards search engine referrers, reasonable timing, auth sessions
- **Reliability**: High
- **Complexity**: Low
- **False Positives**: Very Low
- **Recommendation**: ✅ Always enable

## 🟡 Intermediate Behaviors (Use with Caution)

### Burst Detection (`rate-limiting.ts` - `analyzeBurstPattern`)
- **What it does**: Detects sudden spikes in request activity
- **Reliability**: Medium
- **Complexity**: Medium
- **False Positives**: Medium (can trigger during legitimate browsing spikes)
- **Recommendation**: ⚠️ Test thoroughly before production

### Header Consistency (`user-agent-analysis.ts` - `analyzeHeaderConsistency`)
- **What it does**: Checks for missing/inconsistent browser headers
- **Reliability**: Medium
- **Complexity**: Medium
- **False Positives**: Medium (some legitimate tools have minimal headers)
- **Recommendation**: ⚠️ Consider for high-security environments

### Contextual Rate Limiting (`rate-limiting.ts` - `analyzeContextualRateLimit`)
- **What it does**: Adaptive rate limits based on user context and intent
- **Reliability**: Medium
- **Complexity**: High
- **False Positives**: Medium
- **Recommendation**: ⚠️ Requires careful tuning

## 🔴 Advanced Behaviors (Experimental - High Risk)

### Advanced Timing (`timing-analysis.ts` - `analyzeAdvancedTiming`)
- **What it does**: Complex timing pattern analysis including periodic and mathematical progressions
- **Reliability**: Low-Medium
- **Complexity**: Very High
- **False Positives**: High (complex timing can have false patterns)
- **Recommendation**: ❌ Not recommended for production

### Advanced Intent (`intent-analysis.ts` - `analyzeAdvancedIntent`)
- **What it does**: Complex behavioral analysis for navigation patterns and diversity
- **Reliability**: Low-Medium
- **Complexity**: Very High
- **False Positives**: High
- **Recommendation**: ❌ Experimental only

### Browser Fingerprinting (`user-agent-analysis.ts` - `analyzeBrowserFingerprint`)
- **What it does**: Complex browser entropy and header order analysis
- **Reliability**: Low
- **Complexity**: Very High
- **False Positives**: Very High
- **Recommendation**: ❌ Not suitable for production

### Advanced Positive Signals (`positive-signals.ts` - `analyzeAdvancedPositiveSignals`)
- **What it does**: Complex credibility building and behavioral learning
- **Reliability**: Medium
- **Complexity**: High
- **False Positives**: Medium
- **Recommendation**: ⚠️ Requires significant testing

### Behavioral Credibility (`positive-signals.ts` - `analyzeBehavioralCredibility`)
- **What it does**: ML-like behavioral scoring with multiple factors
- **Reliability**: Low-Medium
- **Complexity**: Very High
- **False Positives**: High
- **Recommendation**: ❌ Research/experimental only

## Configuration Example

```typescript
import { setBehaviorConfig } from './modular-analyzer'

// Conservative production config
setBehaviorConfig({
  simple: {
    pathAnalysis: { enabled: true, weight: 1.0 },
    basicTiming: { enabled: true, weight: 0.8 },
    basicRateLimit: { enabled: true, weight: 1.0 },
    basicUserAgent: { enabled: true, weight: 1.0 },
    simplePatterns: { enabled: true, weight: 1.0 },
    basicPositiveSignals: { enabled: true, weight: 1.0 }
  },
  intermediate: {
    burstDetection: { enabled: false, weight: 0.8 },
    headerConsistency: { enabled: false, weight: 0.7 },
    contextualRateLimit: { enabled: false, weight: 0.9 }
  },
  advanced: {
    // All disabled for production
    advancedTiming: { enabled: false, weight: 0.6 },
    advancedIntent: { enabled: false, weight: 0.5 },
    browserFingerprint: { enabled: false, weight: 0.4 },
    advancedPositiveSignals: { enabled: false, weight: 0.6 },
    behavioralCredibility: { enabled: false, weight: 0.3 }
  }
})
```

## Recommendations by Site Type

### **E-commerce / High Traffic**
- Enable: All simple behaviors
- Consider: Basic burst detection (with higher thresholds)
- Avoid: All advanced behaviors

### **Content Sites / Blogs**
- Enable: All simple behaviors except aggressive rate limiting
- Consider: Header consistency for comment spam
- Avoid: Complex timing analysis

### **APIs / Developer Tools**
- Enable: Path analysis, user agent, simple patterns
- Consider: Contextual rate limiting
- Avoid: Timing analysis (legitimate tools vary)

### **High Security / Admin Panels**
- Enable: All simple + intermediate behaviors
- Consider: Advanced positive signals for known users
- Monitor: All behaviors in non-blocking mode first

## Testing Strategy

1. **Start Simple**: Enable only green behaviors initially
2. **Monitor**: Use debug mode to see behavior outputs
3. **Gradual Addition**: Add one intermediate behavior at a time
4. **A/B Test**: Compare detection rates and false positives
5. **Never in Production**: Don't enable red behaviors in production

## Performance Notes

- Simple behaviors: Minimal performance impact
- Intermediate behaviors: Slight performance impact
- Advanced behaviors: Significant performance impact and maintenance overhead
