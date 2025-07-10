/**
 * Predefined robot directive values map
 * Note: For max-* directives, we store them as functions to handle dynamic values
 */
export const ROBOT_DIRECTIVE_VALUES = {
  // Standard directives
  enabled: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  disabled: 'noindex, nofollow',
  index: 'index',
  noindex: 'noindex',
  follow: 'follow',
  nofollow: 'nofollow',
  none: 'none',
  all: 'all',
  // Non-standard directives (not part of official robots spec)
  noai: 'noai',
  noimageai: 'noimageai',
} as const

/**
 * Helper function to format max-image-preview directive
 */
export function formatMaxImagePreview(value: 'none' | 'standard' | 'large'): string {
  return `max-image-preview:${value}`
}

/**
 * Helper function to format max-snippet directive
 */
export function formatMaxSnippet(value: number): string {
  return `max-snippet:${value}`
}

/**
 * Helper function to format max-video-preview directive
 */
export function formatMaxVideoPreview(value: number): string {
  return `max-video-preview:${value}`
}
