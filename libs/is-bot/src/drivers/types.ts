// Driver interface types for bot detection
export interface BotDetectionDriver<TRequest = any, TResponse = any> {
  /**
   * Extract bot detection request data from the framework's request object
   */
  extractRequest(request: TRequest): BotDetectionRequestData

  /**
   * Extract session ID from the framework's request
   */
  extractSessionId(request: TRequest): Promise<string> | string

  /**
   * Extract response status from the framework's response (if available)
   */
  extractResponseStatus?(request: TRequest, response?: TResponse): number | undefined

  /**
   * Check if IP is from a trusted source (e.g., load balancer)
   */
  isTrustedIP?(ip: string): boolean

  /**
   * Get additional context from the framework
   */
  getAdditionalContext?(request: TRequest): Record<string, any>
}

export interface BotDetectionRequestData {
  path: string
  method: string
  headers: Record<string, string | string[] | undefined>
  ip: string
  timestamp: number
  userAgent?: string
  referer?: string
  acceptLanguage?: string
  acceptEncoding?: string
}

export interface BotDetectionDriverOptions {
  sessionConfig?: {
    password?: string
    cookieName?: string
  }
  ipExtraction?: {
    trustProxy?: boolean
    proxyHeaders?: string[]
  }
  debug?: boolean
}