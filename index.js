const core = require('@actions/core')
const github = require('@actions/github')
const { exec } = require('@actions/exec')
const { Octokit } = require('@octokit/rest')

const fs = require('fs')

const githubToken = core.getInput('github-token')
const actor = process.env.GITHUB_ACTOR
const repository = process.env.GITHUB_REPOSITORY
const remote = `https://${actor}:${githubToken}@github.com/${repository}.git`

const octokit = new Octokit({ auth: githubToken })

const deleteTags = async baseVersions => {
  const { context } = github
  const tags = await octokit.repos
    .listTags(context.repo)
    .then(response => response.data.map(tag => tag.name.split('@')))

  const tagsToDelete = tags.filter(
    ([package, version]) => version > baseVersions[package],
  )

  console.log(`tags to delete`, tagsToDelete)

  await Promise.all(
    tagsToDelete.map(tag =>
      octokit.git.deleteRef({
        ...context.repo,
        ref: `tags/${tag.join('@')}`,
      }),
    ),
  )
}

const getBaseVersions = async (base, initial) => {
  const { context } = github

  const packagesPath = './packages'
  const packagesNames = fs.readdirSync(packagesPath)

  return packagesNames.reduce(async (baseVersions, packageName) => {
    const packagePath = `${packagesPath}/${packageName}`
    if (!fs.statSync(packagePath).isDirectory()) return
    try {
      const pkgFile = await octokit.repos.getContent({
        ...context.repo,
        ref: base,
        path: `packages/${packageName}/package.json`,
      })

      const content = Buffer.from(pkgFile.data.content, 'base64').toString()

      const { version } = JSON.parse(content)
      return {
        ...baseVersions,
        [packageName]: version,
      }
    } catch (e) {
      return {
        ...baseVersions,
        [packageName]: initial,
      }
    }
  }, {})
}

const forceBaseVersions = baseVersions => {
  return Promise.all(
    Object.entries(baseVersions).map(async ([packageName, version]) => {
      const path = `./packages/${packageName}/package.json`
      const headPackage = JSON.parse(fs.readFileSync(path))
      if (headPackage.version === version) return
      headPackage.version = version
      const forcedBasePackage = JSON.stringify(headPackage)
      fs.unlinkSync(path)
      fs.writeFileSync(path, forcedBasePackage)
      return exec(`git commit -a --amend --no-edit`)
    }),
  )
}

const bump = async () => {
  await exec(
    `npx lerna version --conventional-commits --create-release github --no-push --yes --force-git-tag`,
  )
}

const configGit = async head => {
  await exec(`git fetch ${remote} ${head}:${head}`)
  await exec(`git config --local user.email "action@github.com"`)
  await exec(`git config --local user.name "Version Bump Action"`)
  await exec(`git checkout ${head}`)
}

const pushBumpedVersionAndTag = async head => {
  await exec(`git push -f "${remote}" HEAD:${head}`)
  await exec(`git push -f "${remote}" --tags`)
}

const run = async () => {
  const base = core.getInput('base-branch')
  const head = core.getInput('head-branch')
  const initialVersion = core.getInput('initial-version')
  try {
    const baseVersions = await getBaseVersions(base, initialVersion)
    await deleteTags(baseVersions)
    await configGit(head)
    console.log(`fetched base versions`, baseVersions)
    await forceBaseVersions(baseVersions)
    console.log(`forced base versions in packages`)
    await bump()
    console.log(`bumped packages!`)
    await pushBumpedVersionAndTag(head)
    console.log(`pushed release!`)
  } catch (e) {
    core.setFailed(e)
  }
}

run()
