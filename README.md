# release-monorepo-action

Github action that provides support for bumping multiples packages of a monorepo.

## Inputs

| Name           | Description                                                   | Required | Default |
| -------------- | ------------------------------------------------------------- | -------- | ------- |
| base-branch    | Branch in which release will be merged                        | true     | master  |
| head-branch    | Branch to be released                                         | true     | develop |
| github-token   | Github token with access to commit in head-branch             | true     |         |
| initial-branch | Initial version used if base-branch doesn't have package.json | false    | 0.0.0   |

## Usage

```yml
- uses: lemonenergy/release-monorepo-action@main
  with:
    github-token: ${{secrets.PERSONAL_GITHUB_TOKEN}}
```
