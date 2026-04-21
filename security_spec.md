# Firestore Security Specification - Med Tutor

## Data Invariants
1. A user can only access their own profile and lectures.
2. Only verified users can write data (except if anonymous feedback is enabled, but here we prefer verified auth).
3. Subscription and free uploads counts are protected; only admins can modify them arbitrarily, or users can via strictly defined transition paths.
4. Admins are defined by email in a specific collection or a hardcoded master email.
5. PII like user emails are protected.

## The "Dirty Dozen" Payloads (Denial Tests)
1. **Identity Spoofing**: Attempt to create a user profile with a different UID.
2. **Identity Spoofing (Update)**: Attempt to change the UID of an existing profile.
3. **Privilege Escalation**: Attempt to set `subscription: "paid"` on a free account.
4. **Data Poisoning**: Attempt to inject a 1MB string into the `displayName`.
5. **ID Injection**: Attempt to use a 1KB string with special characters as a `lectureId`.
6. **Relational Break**: Attempt to create a lecture for User A under User B's subcollection path.
7. **Bypassing Invariants**: Attempt to create a lecture with a future `date` (if we had temporal rules).
8. **PII Leak**: Attempt to read another user's profile which contains their private email.
9. **State Locking**: Attempt to modify a feedback once it's submitted (it should be immutable for users).
10. **System Field Injection**: Attempt to inject an `isAdmin` field into a user profile.
11. **Query Scraping**: Attempt to list all feedbacks without being an admin.
12. **Anonymous Write**: Attempt to write without being signed in.

## Test Runner Plan
We would use `@firebase/rules-unit-testing` to verify these, but since we are in the AI Studio environment, we will focus on high-fidelity rule generation and linting.
