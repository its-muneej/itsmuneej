# Ultra Storage persistent connection — verification

23 focused connection-lifecycle checks and 33 interface/storage checks passed using simulated API responses and JSDOM.

Verified automatic restoration with a fresh tab session, all connection fields retained, migration of older tab-only credentials, failed key replacement preserving previous details, expired-key rejection, temporary network failure and successful retry, explicit disconnect forgetting credentials, stale tab credentials not undoing disconnect, cleared browser data requiring a manual connection, and reporting browser-storage failures.

Interrupted-save recovery remains in each tab’s session storage. A pending save still prevents disconnect. A confirmed write clears its recovery journal, and the remembered access key never enters uploaded business data. Existing API headers, write payloads and document formats are unchanged.

The interface checks retain Ultra Storage labels, the full-version page, existing POS screens, unchanged connection field names, the missing key-creation/guide links, disconnected-save prompts and successful saves. No login page or encryption was added.

All changed JavaScript passed syntax checks. The complete ZIP was verified and contains no business records or real credentials. The tests simulate browser restart by starting with a fresh tab store and the same persistent browser store. Physical browser-restart/device tests and live account writes were not performed.
