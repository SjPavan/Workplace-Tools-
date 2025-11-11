# Release Checklist

Comprehensive checklist for releasing new versions of Workplace Tools.

## Pre-Release (1-2 weeks before)

### Planning

- [ ] Identify features/fixes for this release
- [ ] Set target release date
- [ ] Create release branch from main
- [ ] Announce release to team
- [ ] Plan release notes

### Testing & QA

- [ ] All tests passing locally
  ```bash
  npm test
  npm run build
  ```
- [ ] Run full test suite on CI/CD
- [ ] Manual testing of major features
- [ ] Browser compatibility testing:
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)
- [ ] Mobile testing (iOS and Android)
- [ ] Performance testing
- [ ] Security audit/scan
- [ ] Accessibility testing

### Documentation

- [ ] Update README if needed
- [ ] Update CHANGELOG.md
- [ ] Update API documentation
- [ ] Review and update user guides
- [ ] Check all documentation links
- [ ] Update deployment docs if needed
- [ ] Create migration guide (if breaking changes)

### Dependencies

- [ ] Run `npm audit` to check for vulnerabilities
  ```bash
  npm audit
  npm audit fix
  ```
- [ ] Review major dependency updates
- [ ] Test with updated dependencies
- [ ] Check for deprecation warnings

---

## Release Day Preparation

### Code Preparation

- [ ] Ensure all commits are on release branch
- [ ] All PRs merged and reviewed
- [ ] No uncommitted changes
- [ ] Latest changes pulled from origin

### Version Bump

- [ ] Determine new version number (semantic versioning)
  - MAJOR.MINOR.PATCH format
  - Update package.json version
  
  ```bash
  # Update version in web/package.json
  # Example: "version": "1.1.0"
  ```

- [ ] Update version in docs/package.json if separate
- [ ] Verify version change
  ```bash
  grep "\"version\"" web/package.json
  ```

### Git Preparation

- [ ] Create release notes
- [ ] Update CHANGELOG.md with:
  - [ ] Version number and date
  - [ ] All changes since last release
  - [ ] Breaking changes if any
  - [ ] Migration steps if needed

- [ ] Stage files for commit
  ```bash
  git add web/package.json CHANGELOG.md
  ```

- [ ] Create release commit
  ```bash
  git commit -m "Release v1.1.0

  - Feature 1
  - Feature 2
  - Bug fix 3
  
  See CHANGELOG.md for details"
  ```

- [ ] Create git tag
  ```bash
  git tag -a v1.1.0 -m "Release v1.1.0"
  ```

---

## Release Execution

### Build & Test

- [ ] Build production bundle
  ```bash
  cd web && npm run build
  ```

- [ ] No build errors
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Verify output size acceptable
- [ ] Test production build locally
  ```bash
  npm run start
  ```

### Deployment

#### Staging Deployment

- [ ] Deploy to staging environment
- [ ] Verify all features work on staging
- [ ] Test API endpoints
- [ ] Check database migrations (if any)
- [ ] Verify environment variables
- [ ] Run smoke tests on staging

#### Production Deployment

- [ ] Create backup of production database
- [ ] Deploy to production
  - [ ] Push commits to main branch
  ```bash
  git push origin main
  ```
  - [ ] Push tags to GitHub
  ```bash
  git push origin v1.1.0
  ```

- [ ] Verify deployment completed
- [ ] Check deployment status
- [ ] Monitor error logs
- [ ] Verify health check endpoint
  ```bash
  curl https://your-app.vercel.app/api/health
  ```

### Post-Deployment Verification

- [ ] Health check passing
- [ ] No errors in logs
- [ ] All pages loading
- [ ] Authentication working
- [ ] Database queries working
- [ ] Third-party integrations active
- [ ] Email notifications sending
- [ ] Analytics tracking

---

## Release Announcement

### Documentation Updates

- [ ] GitHub Releases page created with:
  - [ ] Version number
  - [ ] Release date
  - [ ] Changelog
  - [ ] Download links
  - [ ] Installation instructions

- [ ] Update docs website:
  - [ ] Version bump in docusaurus.config.js
  - [ ] New docs deployed

### Communication

- [ ] Email notification to users
- [ ] Post on social media (if applicable)
- [ ] Update status page
- [ ] Announce in team channels
- [ ] Thank contributors in release notes

### Packages

- [ ] Publish to npm (if applicable)
  ```bash
  npm publish
  ```

- [ ] Create Docker image (if applicable)
  ```bash
  docker build -t workplace-tools:v1.1.0 .
  docker push workplace-tools:v1.1.0
  ```

- [ ] Update APK/builds

---

## Post-Release (1-3 days after)

### Monitoring

- [ ] Monitor error logs continuously
- [ ] Track user reports
- [ ] Monitor performance metrics
- [ ] Check for any issues reported

### Hotfix Preparation

- [ ] Be ready for critical hotfixes
- [ ] Have rollback plan ready
- [ ] Team on standby

### User Communication

- [ ] Respond to user feedback
- [ ] Provide support if needed
- [ ] Document any issues found

---

## Rollback Plan

If critical issue found:

### Immediate Actions

- [ ] Notify team immediately
- [ ] Assess severity
- [ ] Create incident ticket
- [ ] Decide: hotfix or rollback

### Rollback Procedure

- [ ] Get latest stable tag
  ```bash
  git log --oneline --all | head -20
  ```

- [ ] Checkout previous version
  ```bash
  git checkout v1.0.0
  ```

- [ ] Verify and redeploy
- [ ] Update status page
- [ ] Notify users
- [ ] Root cause analysis
- [ ] Plan hotfix or next release

---

## Documentation for Release

### GitHub Release Notes Template

```markdown
# Release v1.1.0

**Release Date**: November 15, 2024

## What's New

### Features
- Feature 1 description
- Feature 2 description

### Improvements
- Performance improvement 1
- UX improvement 1

### Fixes
- Bug fix 1
- Bug fix 2

## Breaking Changes

None.

## Migration Guide

No migration needed.

## Installation

[Installation instructions here]

## Support

- Documentation: https://docs.workplace-tools.example.com
- Issues: https://github.com/workplace-tools/repository/issues
- Discussions: https://github.com/workplace-tools/repository/discussions

## Contributors

Thanks to everyone who contributed to this release!
- Contributor 1
- Contributor 2
```

### Email Template

```
Subject: Workplace Tools v1.1.0 Released

Dear Users,

We're excited to announce the release of Workplace Tools v1.1.0!

## What's New

[Summary of major features and improvements]

## Installation

Visit our documentation for installation instructions:
https://docs.workplace-tools.example.com/getting-started/installation

## Upgrade Notes

[Any special upgrade instructions if needed]

## Support

Need help? Check our documentation or contact support@workplace-tools.example.com

Happy productivity!
The Workplace Tools Team
```

---

## Version Bumping Guidelines

### PATCH Release (Bug fixes)
- Example: 1.0.0 → 1.0.1
- Use for: Security patches, critical bug fixes
- Backward compatible: Yes

### MINOR Release (New features)
- Example: 1.0.0 → 1.1.0
- Use for: New features, improvements
- Backward compatible: Yes

### MAJOR Release (Breaking changes)
- Example: 1.0.0 → 2.0.0
- Use for: API changes, major restructuring
- Backward compatible: No (migration guide required)

---

## Signing Releases

### GPG Signing (Optional but Recommended)

```bash
# Create signed tag
git tag -s v1.1.0 -m "Release v1.1.0"

# Verify signature
git tag -v v1.1.0

# Push signed tag
git push origin v1.1.0
```

---

## Automated Checks

### Pre-Release Automation

The following should run automatically via CI/CD:

- [ ] Tests pass
- [ ] Build succeeds
- [ ] Linting passes
- [ ] Type checking passes
- [ ] No security vulnerabilities
- [ ] Coverage reports generated

---

## Final Sign-Off

- [ ] Release lead approval
- [ ] QA sign-off
- [ ] Product owner approval
- [ ] Team acknowledgment

---

## Post-Release Analytics (1 week after)

- [ ] Monitor crash rates
- [ ] Track user adoption
- [ ] Review performance metrics
- [ ] Analyze user feedback
- [ ] Document lessons learned

---

## Common Issues & Solutions

### Build Fails

**Issue**: `npm run build` fails
- [ ] Ensure all dependencies installed
- [ ] Check Node version (20+)
- [ ] Clear cache: `npm cache clean --force`
- [ ] Reinstall: `rm -rf node_modules && npm install`

### Tests Fail

**Issue**: Tests fail during CI/CD
- [ ] Run tests locally: `npm test`
- [ ] Fix failing tests
- [ ] Push fixes
- [ ] Wait for CI/CD

### Deployment Hangs

**Issue**: Deployment takes too long
- [ ] Check deployment logs
- [ ] Restart deployment
- [ ] Roll back if necessary
- [ ] Investigate root cause

### Database Migration Issues

**Issue**: Database migration fails
- [ ] Backup database
- [ ] Verify migration scripts
- [ ] Run migration manually if needed
- [ ] Rollback if necessary

---

## Success Criteria

Release is successful when:

✅ All tests passing
✅ No critical bugs found
✅ Deployment completed
✅ Health checks passing
✅ Users can access application
✅ All features working
✅ Performance acceptable
✅ Security audit passed
✅ Documentation updated
✅ Team notified

---

## Contacts & Escalation

| Role | Contact | Backup |
|------|---------|--------|
| Release Lead | [Name] | [Name] |
| QA Lead | [Name] | [Name] |
| DevOps | [Name] | [Name] |
| Product Owner | [Name] | [Name] |

---

**Document Version**: 1.0
**Last Updated**: November 2024
**Next Review**: Every 6 months or after major incident
