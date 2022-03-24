**Hitachi ID Bravura Safe is a modified version of Bitwarden®. It was developed using Bitwarden open source software.  
Hitachi ID Systems, Inc. and Bravura Safe are not affiliated with or endorsed by Bitwarden or Bitwarden, Inc.  
Bitwarden is a trademark or registered trademark of Bitwarden, Inc. in the United States and/or other countries.**

The original work is available at [https://github.com/bitwarden/server].
The original documentation is available at [https://bitwarden.com/help/].
A complete list of all changes is available in the git history of this project.

This project contains the user interface elements and other core infrastructure items needed for the "web" portion of all bitwarden client applications.

The server project is written in Angular/Node JS. The codebase can be developed, built, run, and deployed cross-platform on Windows, macOS, and Linux distributions.

</p>

## Build/Run

### Requirements

- [Node.js](https://nodejs.org) v16.13.1 or greater
- NPM v8

### Run the app

For local development, run the app with:

```
npm install
npm run build:oss:watch
```

You can now access the web vault in your browser at `https://localhost:8080`.

If you want to point the development web vault to the production APIs, you can run using:

```
npm install
ENV=cloud npm run build:oss:watch
```

You can also manually adjusting your API endpoint settings by adding `config/local.json` overriding any of the following values:

```json
{
  "dev": {
    "proxyApi": "http://your-api-url",
    "proxyIdentity": "http://your-identity-url",
    "proxyEvents": "http://your-events-url",
    "proxyNotifications": "http://your-notifications-url",
    "allowedHosts": ["hostnames-to-allow-in-webpack"]
  },
  "urls": {}
}
```

Where the `urls` object is defined by the [Urls type in jslib](https://github.com/hitachi-id/bravura-safe_jslib/blob/master/common/src/abstractions/environment.service.ts).

## Contribute

Code contributions to this fork are not required! Please consider contributing to the original project.

Security audits and feedback are welcome. Please open an issue or email us privately if the report is sensitive in nature. You can read our security policy in the [`SECURITY.md`](SECURITY.md) file.

## Prettier

We recently migrated to using Prettier as code formatter. All previous branches will need to updated to avoid large merge conflicts using the following steps:

1. Check out your local Branch
2. Run `git merge 2b0a9d995e0147601ca8ae4778434a19354a60c2`
3. Resolve any merge conflicts, commit.
4. Run `npm run prettier`
5. Commit
6. Run `git merge -Xours 56477eb39cfd8a73c9920577d24d75fed36e2cf5`
7. Push

### Git blame

We also recommend that you configure git to ignore the prettier revision using:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```
