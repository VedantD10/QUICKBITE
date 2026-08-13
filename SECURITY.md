# Security Policy & Vulnerability Disclosure

## Supported Versions

| Version | Supported | Notes |
| :--- | :---: | :--- |
| `v2.4.x` | ✅ | Current Production Release on Vercel |
| `< 2.4` | ❌ | Legacy development builds |

## Security Architecture Highlights

QuickBite implements multiple layers of security across the application stack:

1. **JWT HMAC-SHA256 Token Authentication**: Bearer tokens expire in 24 hours.
2. **Password Hashing**: Passwords stored using 10 salt rounds of `bcryptjs`.
3. **Role-Based Access Control (RBAC)**: Fine-grained access control enforced via `requireRole` middleware.
4. **Environment Isolation**: Production secrets and database URIs isolated in environment variables.

## Reporting a Vulnerability

If you discover a security vulnerability within QuickBite, please report it via GitHub Issues or contact the maintainer directly at:

- **Maintainer**: Vedant Deshmukh
- **Repository**: [https://github.com/VedantD10/QUICKBITE](https://github.com/VedantD10/QUICKBITE)

Please do not disclose security vulnerabilities publicly until an official patch has been released.
