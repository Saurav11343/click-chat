# ClickChat documentation

This directory contains the detailed technical documentation for ClickChat. The root [README](../README.md) is the repository entry point; these pages document requirements, architecture, data, interfaces, security, operations, and future work.

## Documentation map

| Document | Purpose |
| --- | --- |
| [Project overview](01-project-overview.md) | Problem, objectives, scope, actors, features, and limitations |
| [System architecture](02-system-architecture.md) | Components, responsibilities, request paths, and deployment design |
| [Data model](03-data-model.md) | MongoDB collections, fields, relationships, validation, and indexes |
| [API reference](04-api-reference.md) | REST endpoints, authentication, validation, requests, and responses |
| [Real-time events](05-realtime-events.md) | Socket.IO authentication, rooms, event contracts, presence, and invitation flows |
| [Frontend design](06-frontend-design.md) | Routes, components, Zustand stores, and client-side data flow |
| [Security](07-security.md) | Authentication, email verification, authorization, uploads, and current gaps |
| [Setup and deployment](08-setup-and-deployment.md) | Local configuration, environment variables, commands, and cloud deployment |
| [Testing and roadmap](09-testing-and-roadmap.md) | Verification strategy, current limitations, and prioritized future work |
| [Diagram catalog](10-diagram-catalog.md) | DFD, UML, user, architecture, data, sequence, state, activity, deployment, and event diagrams |
| [Translation and cost controls](11-translation-and-cost-controls.md) | Translation flow, cache, atomic quota accounting, failure behavior, and billing safeguards |

## Suggested academic report mapping

| Report chapter | Documentation sources |
| --- | --- |
| Introduction and objectives | Project overview |
| Requirements analysis | Project overview and security |
| System design | Architecture, data model, and frontend design |
| Implementation | API reference, real-time events, frontend design, and security |
| Testing and evaluation | Testing and roadmap |
| Deployment | Setup and deployment |
| Limitations and future work | Testing and roadmap |

## Current repository scope

These documents describe the maintained web frontend, backend, and Capacitor Android wrapper in the current branch. Android build instructions and requirements are documented in [Setup and deployment](08-setup-and-deployment.md#android-apk).

## Documentation rule

When a feature changes, update the relevant detailed page first, then update the short feature list or roadmap in the root README. Document only behavior present in the current branch; describe prepared schema fields or services as partial support rather than completed features.
