# Critical access review — 22 October 2026

- Community pinning requires a verified user's administrator role before any service-role write. Denied actions return 403; unknown actions return 400. Direct REST writes to pin fields are also guarded.
- Paid service placement is administrator-controlled. The VIP RPC checks the caller, and a database trigger also blocks owners from writing paid fields directly. Trusted database expiration jobs retain access.
- Raw search history is admin-only. Anonymous/authenticated clients can record a bounded search through a write-only atomic RPC, without seeing other visitors' queries or setting counts.
- Professional mechanic records remain public only for mechanic accounts; owners and administrators retain access.
- Certificates are private by default. Owners retain access; an explicitly public certificate may appear on a mechanic's public profile. Existing certificate CRUD ownership policies remain in force. Publication controls should be exposed when certificate management UI is added; existing records are not automatically opted in.
- Driving venues are admin-curated business listings and remain public for discovery/SEO. An explicit publication field allows drafts to be hidden; only existing admin write policies can change it.
- Other intentionally public catalogue/reference SELECT policies were preserved. Public read access is not, by itself, an authorization vulnerability. This change does not claim to resolve unrelated warning/informational findings.

Validation: 115 Node tests pass, including real PostgreSQL-compatible RLS/trigger/RPC tests and the Edge pin authorization path; app TypeScript and development production bundle pass. Live anonymous SQL validation retained 561 services, 274 mechanic records and 12 venues while exposing zero raw searches and zero private certificates.
