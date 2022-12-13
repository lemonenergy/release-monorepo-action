# release-monorepo-action

Github action that provides support for bumping multiples packages of a monorepo.

## Inputs

| Name           | Description                                                                              | Required | Default |
| -------------- | ---------------------------------------------------------------------------------------- | -------- | ------- |
| base-branch    | Branch in which release will be merged                                                   | true     | main    |
| head-branch    | Branch to be released                                                                    | true     | develop |
| github-token   | Github token with access to commit in head-branch                                        | true     |         |
| initial-branch | Initial version used if base-branch doesn't have package.json                            | false    | 0.0.0   |
| workspaces     | add --sync-workspace-lock flag (recommended when working with workspaces and lerna-lite) | false    | false   |

## Usage

```yml
- uses: lemonenergy/release-monorepo-action@main
  with:
    github-token: ${{secrets.PERSONAL_GITHUB_TOKEN}}
```

## lerna.json

For compatibility, you need to set version to `independent` in your lerna.json file.

```json
{
  "version": "independent",
}
```
