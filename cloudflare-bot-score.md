The Heuristics engine processes all requests. Cloudflare conducts a number of heuristic checks to identify automated traffic, and requests are matched against a growing database of malicious fingerprints.

The Heuristics engine immediately gives automated requests a score of 1.

Machine learning
The Machine Learning (ML) engine accounts for the majority of all detections, human and bot.

This approach leverages our global network, which proxies billions of requests daily, to identify both automated and human traffic. We constantly train the ML engine to become more accurate and adapt to new threats. Most importantly, this engine learns from traffic across all Cloudflare domains and uses these insights to score traffic while honoring our strict privacy standards ↗.

The ML engine produces scores 2 through 99.

Anomaly detection
The Anomaly Detection (AD) engine is an optional detection engine that uses a form of unsupervised learning. Cloudflare records a baseline of your domain's traffic and uses the baseline to intelligently detect outlier requests. This approach is user agent-agnostic and can be turned on or off by your account team.

Cloudflare does not recommend AD for domains that use Cloudflare for SaaS or expect large amounts of API traffic. The AD engine immediately gives automated requests a score of one.

JavaScript detections
The JavaScript Detections (JSD) engine identifies headless browsers and other malicious fingerprints. This engine performs a lightweight, invisible JavaScript injection on the client side of any request while honoring our strict privacy standards ↗. We do not collect any personally identifiable information during the process. The JSD engine either blocks, challenges, or passes requests to other engines.

JSD is enabled by default but completely optional. To adjust your settings, open the Bot Management Configuration page from Security > Bots.

Cloudflare service
Cloudflare Service is a special bot score source for Enterprise Zero Trust to avoid false positives.

Not computed
A bot score of 0 means Bot Management did not run on the request. Cloudflare does not run Bot Management on internal service requests that Bot Management has no interest in blocking.

Notes on detection
Cloudflare uses the __cf_bm cookie to smooth out the bot score and reduce false positives for actual user sessions.

The Bot Management cookie measures a single user's request pattern and applies it to the machine learning data to generate a reliable bot score for all of that user's requests.

For more details, refer to Cloudflare Cookies.


JavaScript detections are another method that help Cloudflare identify bot requests.

What are JavaScript detections?
These detections are implemented via a lightweight, invisible JavaScript code snippet that follows Cloudflare’s privacy standards ↗. JavaScript is injected only in response to requests for HTML pages or page views, excluding AJAX calls. API and mobile app traffic is unaffected. JavaScript detections have a lifespan of 15 minutes. However, the code is injected again before the session expires. After page load, the script is deferred and utilizes a separate thread (where available) to ensure that performance impact is minimal.

The snippets of JavaScript will contain a source pointing to the challenge platform, with paths that start with /cdn-cgi/challenge-platform/...

Note

The information in JavaScript detections which populates js_detection.passed is stored in the cf_clearance cookie.

Enable JavaScript detections
For Free customers (Bot Fight Mode), JavaScript detections are automatically enabled and cannot be disabled.

For all other customers (Super Bot Fight Mode and Bot Management for Enterprise), JavaScript detections are optional.

To enable JavaScript Detections:

Log in to your Cloudflare dashboard ↗ and select your account and domain.
Go to Security > Bots.
Select Configure Bot Management.
For JavaScript Detections, switch the toggle to On.
For more details on how to set up bot protection, see Get started.

Enforcing execution of JavaScript detections
Once you enable JavaScript detections, you can use the cf.bot_management.js_detection.passed field in WAF custom rules (or the request.cf.botManagement.jsDetection.passed variable in Workers).

When adding this field to WAF custom rules, use it:

On endpoints expecting browser traffic (avoiding native mobile applications or websocket endpoints).
After a user's first request to your application (Cloudflare needs at least one HTML request before injecting JavaScript detection).
With the Managed Challenge action, because there are legitimate reasons a user might not have passed a JavaScript detection challenge (network issues, ad blockers, disabled JavaScript in browser, native mobile apps).
Prerequisites
You must have JavaScript detections enabled on your zone.
You must have updated your Content Security Policy headers for JavaScript detections.
You must not run this field on websocket endpoints.
You must use the field in a custom rules expression that expects only browser traffic.
The action should always be a managed challenge in case a legitimate user has not received the challenge for network or browser reasons.
The path specified in the rule builder should never be the first HTML page a user visits when browsing your site.
cf.bot_management.js_detection.passed is used to indicate that a request has a Bot Management cookie present with a JavaScript detection value indicating it submitted the JavaScript detection test, and received a likely human scoring result.

The cf.bot_management.js_detection.passed field should never be used in a WAF custom rule that matches a visitor's first request to a site. It is necessary to have at least one HTML request before Cloudflare can inject JavaScript detection.

Example with Workers
"botManagement": {
"jsDetection":

{ "passed": false }
,
},

Note

JavaScript detections are stored in the cf_clearance cookie.

The cf_clearance cookie cannot exceed the maximum size of 4096 bytes.

Limitations
If you enabled Bot Management before June 2020
Customers who enabled Enterprise Bot Management before June 2020 do not have JavaScript detections enabled by default (unless specifically requested). These customers can still enable the feature in the Cloudflare dashboard.

If you have a Content Security Policy (CSP)
If you have a Content Security Policy (CSP), you need to take additional steps to implement JavaScript detections:

Ensure that anything under /cdn-cgi/challenge-platform/ is allowed. Your CSP should allow scripts served from your origin domain (script-src self).
If your CSP uses a nonce for script tags, Cloudflare will add these nonces to the scripts it injects by parsing your CSP response header.
If your CSP does not use nonce for script tags and JavaScript Detection is enabled, you may see a console error such as Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self'". Either the 'unsafe-inline' keyword, a hash ('sha256-b123b8a70+4jEj+d6gWI9U6IilUJIrlnRJbRR/uQl2Jc='), or a nonce ('nonce-...') is required to enable inline execution. We highly discourage the use of unsafe-inline and instead recommend the use CSP nonces in script tags which we parse and support in our CDN.
Warning

JavaScript detections are not supported with nonce set via <meta> tags.

If you have ETags
Enabling JavaScript Detections (JSD) will strip ETags from HTML responses where JSD is injected.
