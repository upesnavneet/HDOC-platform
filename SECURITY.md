# Security Notes — HDOC Platform

## ⚠️ Credential Rotation (REQUIRED)

A prior version of this repository contained hardcoded credentials in `scripts/add-coordinator.js` and `scripts/set-day.js`. Those files have been deleted, but the credentials remain in the git history until the steps below are completed.

**Immediately:**
1. Rotate the password for the affected Firebase Auth account in Firebase Console → Authentication → Users.
2. Confirm that no other accounts share the same password.

## 🧹 Git History Cleanup

The deleted script files contained plaintext secrets. To fully purge them from git history:

```bash
# Install git-filter-repo (recommended over filter-branch)
pip install git-filter-repo

# Run from the repo root — this rewrites ALL commit history
git filter-repo --path scripts/add-coordinator.js --invert-paths
git filter-repo --path scripts/set-day.js --invert-paths

# Force-push to remote
git push origin --force --all
git push origin --force --tags
```

> **Warning:** This rewrites all commit SHAs. All collaborators must delete their local clone and re-clone the repository afterward.

**Verify cleanup:**
```bash
git log --all -p | grep -i "krish"            # must return zero
git log --all -p | grep -i "kumarnavneet"     # must return zero
```

## 🔑 Admin Management

Admin status is managed via **Firebase Custom Claims**, not Firestore fields.

To grant admin access to a user (requires a service account JSON):

```bash
# One-off local command — do NOT commit the service account file
node -e "
  const admin = require('firebase-admin');
  admin.initializeApp({ credential: admin.credential.cert('./service-account.json') });
  admin.auth().setCustomUserClaims('TARGET_USER_UID', { admin: true })
    .then(() => console.log('Admin claim set successfully.'))
    .catch(console.error);
"
```

Optionally, also set `role: 'admin'` on the user's Firestore document via Firebase Console for UI display purposes. This Firestore field is **not** used for access control.

To find a user's UID: Firebase Console → Authentication → Users → search by email.

## 🛡️ Firestore Security Rules

- **Default deny**: All paths not explicitly listed are denied.
- **Admin checks**: Use `request.auth.token.admin` (Custom Claims), not Firestore document fields.
- **Field restrictions**: Users cannot write `role`, `isActive`, or `overallRank` on their own document.
