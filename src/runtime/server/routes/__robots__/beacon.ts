import { defineEventHandler } from 'h3'

/**
 * This route is called using a beacon request from the client when the page was loaded as prerendered HTML. Since it
 * didn't pass through the server we need to initialize the session via this request.
 *
 * This is handled by the botDetection.ts plugin.
 */
export default defineEventHandler(() => 'OK')
