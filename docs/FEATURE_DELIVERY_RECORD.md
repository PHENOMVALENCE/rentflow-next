# Feature Delivery Record

This file distinguishes **delivered/demoable**, **production-backed**, and **planned** capabilities.

| Capability | Demoable UI | Domain rules | Persistent DB | External integration | Status |
|---|---:|---:|---:|---:|---|
| Public home/listings/detail | Yes | Yes | No | N/A | Delivered preview |
| Admin application shell | Yes | N/A | No | N/A | Delivered preview |
| Portfolio dashboard | Yes | Partial | No | N/A | Delivered preview |
| Properties/units | Yes | Partial | No | N/A | Delivered preview |
| Tenants | Yes | Partial | No | N/A | Delivered preview |
| Lease lifecycle | Yes | Yes | No | N/A | Domain + preview |
| Payments | Yes | Yes | No | No | Domain + preview |
| Supervisor assignment | Yes | Partial | No | N/A | Delivered preview |
| Maintenance | Yes | Partial | No | N/A | Delivered preview |
| Notices/reports/settings | Yes | Partial | No | N/A | Delivered preview |
| Health endpoint | Yes | N/A | N/A | N/A | Production-backed |
| Lease cron endpoint | Yes | Yes | No | N/A | Scaffolded |
| Authentication/RBAC | Shell only | Specified | No | No | Pending infrastructure |
| Snippe payment execution | UI only | Specified | No | No | Pending credentials |
| SMS/WhatsApp | No | Specified | No | No | Pending credentials |
| Private document storage | No | Specified | No | No | Pending storage |

Do not describe a row as production-complete until its persistent/integration columns satisfy the required behavior.