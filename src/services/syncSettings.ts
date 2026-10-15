import { AppError } from './appError'

export interface RepositoryLocation {
  owner: string
  repository: string
}

const GITHUB_URL_PREFIX = 'https://github.com/'
const OWNER_AND_REPOSITORY_PATTERN = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/
const DOTS_ONLY_PATTERN = /^\.+$/

export function requireGithubToken(rawToken: string): string {
  const token = rawToken.trim()
  if (!token) throw new AppError({ key: 'errors.tokenMissing' })
  return token
}

export function parseRepositoryUrl(rawValue: string): RepositoryLocation {
  const trimmedValue = rawValue.trim()
  if (!trimmedValue) throw new AppError({ key: 'errors.repositoryMissing' })
  const withoutPrefix = trimmedValue.startsWith(GITHUB_URL_PREFIX)
    ? trimmedValue.slice(GITHUB_URL_PREFIX.length)
    : trimmedValue
  const ownerAndRepository = withoutPrefix.replace(/\/+$/, '').replace(/\.git$/, '')
  const match = OWNER_AND_REPOSITORY_PATTERN.exec(ownerAndRepository)
  const hasDotsOnlyName =
    match !== null && (DOTS_ONLY_PATTERN.test(match[1]) || DOTS_ONLY_PATTERN.test(match[2]))
  if (!match || hasDotsOnlyName) throw new AppError({ key: 'errors.repositoryInvalid' })
  return { owner: match[1], repository: match[2] }
}

export function parseProjectNumber(rawValue: string): number | undefined {
  const trimmedValue = rawValue.trim()
  if (!trimmedValue) return undefined
  const projectNumber = Number(trimmedValue)
  const isPositiveInteger = Number.isInteger(projectNumber) && projectNumber > 0
  if (!isPositiveInteger) throw new AppError({ key: 'errors.projectNumberInvalid' })
  return projectNumber
}
