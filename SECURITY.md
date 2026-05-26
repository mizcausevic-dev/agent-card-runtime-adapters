# Security Policy

`agent-card-runtime-adapters` is an offline transformer. It reads a Kinetic Gain
Agent Card JSON you supply and emits runtime configs or a markdown briefing. It
performs no network calls and does not invoke any LLM or agent runtime.

The emitted configs **inherit whatever is in the source card** — review the card
itself before deploying its derived configs, especially the system prompt and
metadata.

## Supported versions

Only the latest tagged release is supported.

## Reporting a vulnerability

Please use GitHub Security Advisories for private disclosure:

- [Open a security advisory](https://github.com/mizcausevic-dev/agent-card-runtime-adapters/security/advisories/new)

Do not file public issues for security reports.
