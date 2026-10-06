# AI PROJECT OPERATING RULES & CONTEXT SYSTEM

This repository uses a structured AI Project Context System located in `.ai/`.

**NEVER start a task by reading the entire repository.**

---

## 🚀 Operating Rules for AI Agents

For every development task:

1. **Read `AGENTS.md`** (this file).
2. **Read `.ai/PROJECT.md`** for high-level understanding.
3. **Read `.ai/CODEMAP.md`** to locate the exact files mapped to the requested feature.
4. **Determine which subsystem** the request affects.
5. **Read ONLY the relevant specialized context documents** from the table below.
6. **Locate the implementation files** using `CODEMAP.md`.
7. **Read the actual source files** before modifying them.
8. **Make the smallest safe change** that fulfills the user request.
9. **Do not explore unrelated folders** unless strictly necessary.
10. **Preserve existing architecture and business rules.**
11. **Source code is always the final source of truth.**
12. Markdown context files are navigation and understanding aids, not replacements for verifying relevant code.

---

## 🧭 Context Routing Table

Read only the minimum documentation necessary for your specific task:

| Task Type | Context Files to Read |
| :--- | :--- |
| **UI / Frontend Task** | `PROJECT.md`, `CODEMAP.md`, `UI-SYSTEM.md` |
| **Database / Schema Task** | `PROJECT.md`, `CODEMAP.md`, `DATABASE.md`, `BUSINESS-RULES.md` |
| **API / Cron / Backend Task** | `PROJECT.md`, `CODEMAP.md`, `API.md`, `AUTH-SECURITY.md` |
| **Authentication & Security Task** | `PROJECT.md`, `CODEMAP.md`, `AUTH-SECURITY.md` |
| **Routing / Navigation Task** | `PROJECT.md`, `CODEMAP.md`, `ROUTES.md` |
| **Business Logic / Calculations** | `PROJECT.md`, `CODEMAP.md`, `BUSINESS-RULES.md` |
| **Architecture / Refactoring Task** | `PROJECT.md`, `ARCHITECTURE.md`, `CODEMAP.md`, `DECISIONS.md` |

---

## ⚡ Token Efficiency & Change Discipline

* **Do NOT automatically read every `.ai/*.md` file.** Load only the specific documents required for the task.
* **Do not refactor unrelated code** or rename unrelated files.
* **Do not change architecture unnecessarily** or upgrade packages unless requested.
* **Do not rewrite complete components** when a targeted change is sufficient.

---

## 🔄 Staleness Protection Rule

Whenever a change significantly affects architecture, routes, database models, APIs, permissions, business rules, or major module structure:

**Update the corresponding `.ai/` documentation in the SAME task.**

Do NOT update documentation for tiny cosmetic or insignificant changes.
