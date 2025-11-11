

# ✅ CONTRIBUTOR GUIDELINES

## 1. Overview

Thank you for your interest in contributing!
This project welcomes contributions that improve functionality, performance, documentation, or overall quality.
Please read this guide before starting work.

---

## 2. Contribution Workflow

### ✅ Step-by-Step

#### **1) Fork the Repository**

Create a personal fork through GitHub.
This gives you a private workspace to experiment safely.

#### **2) Clone Your Fork**

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

#### **3) Add Upstream Remote**

This keeps your fork synchronized with the original source.

```bash
git remote add upstream https://github.com/YGNTECHSTARTUP/scm
```

Verify:

```bash
git remote -v
```

Expected:

```
origin    https://github.com/<your-username>/<repo>.git
upstream  https://github.com/YGNTECHSTARTUP/scm
```

#### **4) Stay Updated with Upstream**

Regularly pull updates from upstream `main`:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

Or rebase:

```bash
git rebase upstream/main
```

Keeping up-to-date prevents merge conflicts.

#### **5) Create a Feature Branch**

Never work directly on `main`.

```bash
git checkout -b feature/<short-name>
```

Examples:

```
feature/add-auth
bugfix/login-crash
```

#### **6) Make Your Changes**

Follow coding standards and keep commits small and logical.

#### **7) Commit Properly**

Write meaningful commit messages:

✅ Good

```
Add async caching layer for SCM lookup
Fix race condition in queue handling
```

❌ Bad

```
wip
fix
update
```

Commit:

```bash
git add .
git commit -m "Short meaningful message"
```

#### **8) Push to Your Fork**

```bash
git push origin feature/<short-name>
```

#### **9) Open a Pull Request**

From your fork → `main` branch of upstream:

Title: short + descriptive
Description: what, why, details, screenshots if UI

---

## 3. Code Requirements

### ✅ General Rules

* Write clear, maintainable code
* Ensure backward compatibility
* Follow existing style patterns

### ✅ Rust Guidelines (if applicable)

* Use idiomatic Rust
* Prefer ownership + immutability
* Avoid unnecessary `unsafe`
* Include error handling (`Result<T,E>`)
* Document complex logic

---

## 4. Documentation

### ✅ Required

* Update README if behavior changes
* Add comments for non-trivial logic
* Include examples if appropriate

---

## 5. Testing

Before submitting a PR:

* Add tests for new logic
* Ensure all tests pass
* Benchmark if performance-critical

---

## 6. Communication & Review

### PR Review Expectations

* Reviews may request changes
* Be responsive to feedback
* Rebase when needed for clean history
* Keep discussion on topic

---

## 7. Branching Model (Simple)

| Branch      | Purpose                |
| ----------- | ---------------------- |
| `main`      | Stable production code |
| `feature/*` | Feature development    |
| `bugfix/*`  | Bug fixes              |

---

## 8. When Contributions Will Be Rejected

* Poor code quality
* No tests for new logic
* Unclear purpose
* Unsafe or unstable changes
* Changes unrelated to the project

---

## 9. License

By contributing, you agree your changes follow the project’s license.

---

# Example Flow Diagram

```
       ┌───────────────┐
       │ Upstream Repo │
       └───────▲───────┘
               │
     git fetch │ merge/rebase
               │
       ┌───────┴───────┐
       │  Your Fork    │
       └───────▲───────┘
               │ push
               │
       ┌───────┴────────┐
       │ Local Workspace │
       └─────────────────┘
```

---

## 10. Quick Summary

```
Fork → Clone → Add Upstream → Sync Often → Branch → Work → Commit → Push → PR
```

---


