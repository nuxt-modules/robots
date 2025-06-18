import { defineNuxtPlugin, onNuxtReady, useRequestEvent } from 'nuxt/app'
import { isBotFromHeaders } from '../../util'
import { useBotDetection } from '../composables/useBotDetection'

export default defineNuxtPlugin({
  setup() {
    const { updateContext, storage } = useBotDetection()

    if (import.meta.server) {
      // Server-side detection using request headers
      const event = useRequestEvent()
      const headers = event?.node.req.headers || {}

      // Perform server-side bot detection
      const detection = isBotFromHeaders(headers)

      if (detection.isBot && detection.data) {
        updateContext({
          isBot: true,
          userAgent: headers['user-agent'] as string,
          headers: {
            accept: headers.accept as string,
            acceptLanguage: headers['accept-language'] as string,
            acceptEncoding: headers['accept-encoding'] as string,
          },
          detectionMethod: 'server',
          confidence: detection.data.trusted ? 95 : 75,
          botType: detection.data.botType,
          botName: detection.data.botName,
          trusted: detection.data.trusted,
        })
      }
      else {
        // Set as likely human on server-side
        updateContext({
          isBot: false,
          userAgent: headers['user-agent'] as string,
          headers: {
            accept: headers.accept as string,
            acceptLanguage: headers['accept-language'] as string,
            acceptEncoding: headers['accept-encoding'] as string,
          },
          detectionMethod: 'server',
          confidence: 60, // Lower confidence for "not bot" detection
        })
      }
    }

    if (import.meta.client) {
      // Client-side enhanced detection
      onNuxtReady(async () => {
        // Only run client-side detection if we haven't run it recently
        const now = Date.now()
        const lastDetection = storage.value.lastDetectionTime
        const oneHour = 60 * 60 * 1000

        if (storage.value.hasRun && (now - lastDetection) < oneHour) {
          // Use cached result if available and recent
          if (storage.value.clientDetectionResult) {
            updateContext(storage.value.clientDetectionResult)
          }
          return
        }

        try {
          // Perform client-side detection using browser characteristics
          const clientDetection = await performClientSideBotDetection()

          // Store the result
          storage.value = {
            hasRun: true,
            lastDetectionTime: now,
            clientDetectionResult: clientDetection,
          }

          // Update the context with client-side results
          updateContext(clientDetection)
        }
        catch (error) {
          console.debug('[Bot Detection] Client-side detection failed:', error)
        }
      })
    }
  },
})

/**
 * Performs client-side bot detection using browser characteristics
 */
async function performClientSideBotDetection() {
  const userAgent = navigator.userAgent

  // Start with server-side style detection
  const basicDetection = isBotFromHeaders({
    'user-agent': userAgent,
    'accept': document.querySelector('html')?.getAttribute('data-accept') || '',
    'accept-language': navigator.language,
    'accept-encoding': 'gzip, deflate, br',
  })

  if (basicDetection.isBot) {
    return {
      isBot: true,
      userAgent,
      detectionMethod: 'client' as const,
      confidence: basicDetection.data?.trusted ? 90 : 70,
      botType: basicDetection.data?.botType,
      botName: basicDetection.data?.botName,
      trusted: basicDetection.data?.trusted,
    }
  }

  // Enhanced client-side checks for bot characteristics
  let botScore = 0
  const checks: string[] = []

  // Check for missing browser APIs that real browsers should have
  if (typeof window.chrome === 'undefined' && userAgent.includes('Chrome')) {
    botScore += 15
    checks.push('missing-chrome-api')
  }

  if (typeof navigator.permissions === 'undefined') {
    botScore += 10
    checks.push('missing-permissions-api')
  }

  if (typeof navigator.serviceWorker === 'undefined') {
    botScore += 5
    checks.push('missing-serviceworker')
  }

  // Check for WebDriver (automation tools)
  if (navigator.webdriver) {
    botScore += 50
    checks.push('webdriver-present')
  }

  if ((window as any).callPhantom || (window as any)._phantom) {
    botScore += 50
    checks.push('phantom-detected')
  }

  // Check for headless browser indicators
  if (navigator.plugins?.length === 0) {
    botScore += 10
    checks.push('no-plugins')
  }

  if (screen.width === 0 || screen.height === 0) {
    botScore += 20
    checks.push('invalid-screen')
  }

  // Check for automation tools in user agent
  const automationPatterns = ['headless', 'selenium', 'phantomjs', 'slimerjs']
  const lowerUA = userAgent.toLowerCase()
  for (const pattern of automationPatterns) {
    if (lowerUA.includes(pattern)) {
      botScore += 30
      checks.push(`automation-${pattern}`)
    }
  }

  // Check for inconsistencies in navigator object
  const languages = navigator.languages || []
  if (languages.length === 0 && navigator.language) {
    botScore += 5
    checks.push('language-inconsistency')
  }

  // Determine if this is likely a bot based on score
  const isBot = botScore >= 25

  return {
    isBot,
    userAgent,
    detectionMethod: 'client' as const,
    confidence: isBot ? Math.min(95, 50 + botScore) : Math.max(20, 80 - botScore),
    botType: isBot ? 'automation' : undefined,
    botName: isBot ? 'client-detected' : undefined,
    trusted: false,
    lastDetected: Date.now(),
  }
}
