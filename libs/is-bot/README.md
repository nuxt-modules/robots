# Bot Detection Library

A framework-agnostic bot detection library with advanced behavioral analysis capabilities.

## Features

- 🤖 **Advanced Bot Detection**: Multi-layered analysis including user agents, behavioral patterns, and timing analysis
- 🔧 **Framework Agnostic**: Works with any web framework through driver pattern
- 🚀 **H3/Nuxt Ready**: Built-in support for H3 events and Nuxt applications
- 📊 **Behavioral Analysis**: Modular system with simple, intermediate, and advanced detection behaviors
- 💾 **Flexible Storage**: Supports multiple storage backends through adapter pattern
- 🎯 **High Performance**: Optimized with batch operations and intelligent caching
- 🛡️ **Security Focused**: IP allowlists/blocklists, rate limiting, and threat detection

## Installation

```bash
npm install @nuxtjs/robots-bot-detection
```

## Quick Start

### Basic Usage

```typescript
import { BotDetectionEngine, MemoryAdapter, H3SessionIdentifier } from '@nuxtjs/robots-bot-detection'

// Create storage adapter
const storage = new MemoryAdapter()

// Create session identifier
const sessionIdentifier = new H3SessionIdentifier()

// Create engine
const engine = new BotDetectionEngine({
  storage,
  sessionIdentifier,
  config: {
    thresholds: {
      likelyBot: 70,
      definitelyBot: 90
    }
  }
})

// Analyze a request
const request = {
  path: '/api/data',
  method: 'GET',
  headers: {
    'user-agent': 'Mozilla/5.0 ...'
  },
  ip: '192.168.1.1',
  timestamp: Date.now()
}

const result = await engine.analyze(request)
console.log(`Bot score: ${result.score}`)
console.log(`Is bot: ${result.isBot}`)
```

### H3/Nuxt Integration

```typescript
import { BotDetectionEngine, UnstorageBehaviorAdapter, H3SessionIdentifier } from '@nuxtjs/robots-bot-detection'
import { useStorage } from 'unstorage'

const storage = useStorage('redis://localhost:6379')
const adapter = new UnstorageBehaviorAdapter(storage)
const sessionIdentifier = new H3SessionIdentifier('your-session-secret')

const engine = new BotDetectionEngine({
  storage: adapter,
  sessionIdentifier
})

// In your H3 handler
export default defineEventHandler(async (event) => {
  const result = await engine.analyze(request, event)
  
  if (result.isBot) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests'
    })
  }
  
  // Continue with normal processing
})
```

## API Reference

### BotDetectionEngine

The main engine class for bot detection.

#### Constructor Options

```typescript
interface BotDetectionEngineOptions {
  storage: BehaviorStorage
  sessionIdentifier: SessionIdentifier
  responseStatusProvider?: ResponseStatusProvider
  config?: BotDetectionConfig
}
```

#### Methods

- `analyze(request: BotDetectionRequest, event?: H3Event): Promise<BotDetectionResponse>`
- `updateConfig(config: Partial<BotDetectionConfig>): void`
- `cleanup(): Promise<void>`

### Storage Adapters

#### MemoryAdapter
In-memory storage for development and testing.

#### UnstorageBehaviorAdapter
Production-ready storage adapter using unstorage.

### Behavior Configuration

Configure which detection behaviors to enable:

```typescript
const config = {
  behaviors: {
    simple: {
      pathAnalysis: { enabled: true, weight: 1.0 },
      basicTiming: { enabled: true, weight: 0.8 },
      basicRateLimit: { enabled: true, weight: 1.2 }
    },
    intermediate: {
      burstDetection: { enabled: true, weight: 1.0 },
      headerConsistency: { enabled: true, weight: 0.9 }
    },
    advanced: {
      advancedTiming: { enabled: false, weight: 1.5 },
      browserFingerprint: { enabled: false, weight: 1.3 }
    }
  }
}
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run dev
```

## License

MIT License - see LICENSE file for details.