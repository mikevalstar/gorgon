# @gorgonjs/gorgon — Skill Spec

A lightweight (~4kb) TypeScript caching library for async functions with automatic concurrency protection. Works in Node.js and browsers. Deduplicates simultaneous requests for the same cache key.

## Domains

| Domain | Description | Skills |
| --- | --- | --- |
| caching | Setting up, reading, writing, invalidating, and configuring cached async data with full type safety | core |
| react | Using Gorgon within React components via hooks | react |

## Skill Inventory

| Skill | Type | Domain | What it covers | Failure modes |
| --- | --- | --- | --- | --- |
| core | core | caching | get/put/clear/overwrite, policies, hooks, providers, file-provider, clearlink | 6 |
| react | framework | react | useGorgon hook, clearGorgon, loading/error/refetch, DIY hook | 3 |

## Failure Mode Inventory

### Core Caching (6 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | --- | --- | --- | --- |
| 1 | Not clearing cache after mutating data | CRITICAL | maintainer interview | — |
| 2 | Cache keys not specific enough | CRITICAL | maintainer interview | react |
| 3 | Caching forever without expiry | HIGH | maintainer interview | — |
| 4 | Aligned cache expiry causing thundering herd | MEDIUM | maintainer interview | — |
| 5 | Using language primitives instead of Gorgon | HIGH | documentation analysis | — |
| 6 | Wrapping in custom deduplication logic | MEDIUM | documentation — concurrency | — |

### React Integration (3 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| --- | --- | --- | --- | --- |
| 1 | Not cleaning up on unmount in DIY hooks | HIGH | documentation — react | — |
| 2 | Using Gorgon.clear without triggering re-render | HIGH | documentation — react | core |
| 3 | Not including all params in cache key | CRITICAL | documentation — react | core |

## Tensions

| Tension | Skills | Agent implication |
| --- | --- | --- |
| Cache duration vs data freshness | core ↔ react | Agent may set very long TTLs without invalidation, or very short TTLs defeating the purpose |
| Key specificity vs cache hit rate | core ↔ react | Agent may over-serialize keys (making cache useless) or under-serialize (causing wrong results) |

## Cross-References

| From | To | Reason |
| --- | --- | --- |
| core | react | React hook behavior depends on understanding core key naming, policies, and clearing |
| react | core | React developers need core Gorgon.clear wildcards for effective refetch |

## Recommended Skill File Structure

- **Core skills:** core (framework-agnostic, covers all of @gorgonjs/gorgon plus file-provider and clearlink)
- **Framework skills:** react (requires core)

## Composition Opportunities

| Library | Integration points | Composition skill needed? |
| --- | --- | --- |
| React | useGorgon hook, component lifecycle | Yes — react skill |
| Express/Koa/Fastify | Server-side caching of API responses | No — covered in core examples |
