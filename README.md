# DealLogic Issue Explorer

DealLogic is a prototype M&A issue-analysis workspace. It combines a structured Deal Map with rule-based deal logic, recommended actions, and a deal-specific Deal Hub.

## Getting started

The **Getting started** button opens an on-demand tour of the live workspace. A welcome card leads to spotlighted steps for deals, Deal Map, Deal Hub, Action Library, Company Radar and Settings, followed by a completion card. Users can skip at any point. The tour does not change saved deal data and never opens automatically.

## Current features

- Five issue-specific diligence flows: change-of-control clauses, option holders, missing IP assignments, debt facilities and threatened litigation.
- Deal-specific answers, transaction-side settings, recommended actions and a Deal Hub with summary, task board, table and deal settings.
- An Action Library, Company Radar and optional account sync.

## Local development

The application is a buildless static site. Its deployable files are in `dist/`.

```sh
npm run build
npm run check
python3 -m http.server 4173 --directory dist
```

## Data storage

Without an account, deal data stays in this browser. Verified email/password accounts can save progress to Cloud Firestore and retrieve it on another device. Browser data can be imported from the Account panel in Settings. Browser and account data use separate local keys; signing out removes the account's local cache.

Browser persistence is accessed through `dist/app-storage.js`. `dist/account.js` mirrors account changes to Firestore. A failed cloud write remains marked for retry in the browser, and the page shows a saving status until it succeeds.

## Set up Firebase accounts

1. In [Firebase Console](https://console.firebase.google.com/), create a new project on the **Spark** plan. Google Analytics is optional.
2. In **Project overview → Add app**, register a **Web** app. Copy `apiKey`, `authDomain`, `projectId` and `appId` from its `firebaseConfig` object. These are public web configuration values, not a service account key.
3. In **Security → Authentication → Sign-in method**, enable **Email/Password**. The Email link option is not needed. Review the **Email address verification** template under **Authentication → Templates**.
4. In **Build → Firestore Database**, create a **Standard edition** database in **production mode**. Choose the region deliberately because it cannot be changed later; `europe-west2` (London) is available for UK-focused data.
5. In Firestore's **Rules** tab, paste the contents of `firestore.rules` and publish. These rules grant each verified user access only to their own saved state. Do not leave test-mode rules in place.
6. The registered Deal Logic web app's public configuration is in `firebase.web.json`. Deploy this branch and `npm run build` writes the values into `dist/firebase-config.js`. The four `FIREBASE_*` environment variables can override those values for another Firebase project. If a different project is used, set all four overrides together.
7. Open Settings → **Save your deal progress**, create an account, open the verification email, return to the app and select **I've verified my email**. Then choose **Import browser progress** if you have existing work in this browser. You can also sign in, request a password reset and sign out there.

Account progress is private to one Firebase user; deal sharing and invitations are not implemented. The Firestore free tier has no managed backups, so arrange exports or upgrade before relying on it as the only copy of live transaction records. The first version stores one Firestore document per browser storage key; a very large single deal record may require a future per-deal data model.

### Reset and delete an account

Below Session in Settings, **Reset account** clears every project, Deal Hub action, saved answer, avatar and preference, keeping the email/password account. **Delete account** clears the same data and then permanently removes the Firebase Authentication user. Each action opens a separate confirmation with a permanent-deletion warning and requires the current password before its confirmation button proceeds.

`POST /api/account-lifecycle` verifies the caller's Firebase ID token against Firebase Authentication, requires verified email and a sign-in within the last five minutes, and derives the UID from that verified account. It deletes all documents in `users/{uid}/state` in batches, including records not loaded on the current device. For deletion, it removes the Authentication user only after Firestore is empty. Failed cleanup preserves authentication for retry and does not report success. The endpoint uses the same public Firebase configuration and owner-only Firestore rules as the app; no service-account secret or new Firebase rule is required.

The browser pauses cloud sync, clears account-scoped caches and pending writes, and coordinates other open tabs before reloading defaults or signing out. Unrelated guest progress and other accounts' data stay separate. All application account data currently resides in the state collection; if another account storage location is added, extend the lifecycle endpoint to erase it too.

## Company Radar

Company Radar is a deal-specific dashboard of public Companies House register data. Users can add several entities to a deal, review rule-based attention flags, open the original register pages, filter recent filings, download available PDFs on demand, and add a finding to Deal Hub. Individual attention flags can be marked reviewed; the app clears that mark if the flag's underlying detail changes. After a fresh check, it highlights changed register fields compared with the prior successful check. Company selections, review marks, and comparison snapshots are stored in this browser with the rest of the deal. Register data is fetched when the section is opened or refreshed.

The Vercel `api/` functions provide same-origin search, company summary and document-download routes. Register for a live Companies House API key and set `COMPANIES_HOUSE_API_KEY` in the Vercel project's environment variables for Preview and Production, then redeploy. Never add the key to `dist/` or commit a filled-in `.env` file. Local development can use `vercel dev` with the same environment variable; a plain static file server cannot run these functions.

The document route verifies that the document belongs to the selected company and limits in-app PDFs to 12 MB. The public Companies House link remains available for larger or unavailable files. The API routes are public because the prototype has no user authentication; before high-volume public use, add shared rate limiting or host-level abuse protection and monitor Companies House quota and function bandwidth. The app does not store downloaded documents.

## Runtime structure

- `dist/index.html` contains the Deal Map and tailored diligence flows.
- `dist/deal-hub.js` owns Deal Hub state and interaction.
- `dist/workspace-redesign.js` is presentation-only decoration for navigation, icons and workspace summaries.
- `dist/issues.json` contains only issue data used by the current flows. `npm run build` validates it and prepares the Firebase configuration. Earlier designs and legal drafts remain in Git history.

## Status

Prototype content only. The application is not legal advice and its outputs must be reviewed and tailored for each transaction and jurisdiction.
