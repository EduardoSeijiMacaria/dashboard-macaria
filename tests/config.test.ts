import { describe, expect, it } from 'vitest'
import { githubToken, projectNumberSetting, repositoryUrl } from '../src/services/config'

describe('embedded build values under test', () => {
  it('leaves the token empty so tests never hold a real token', () => {
    const isTokenEmpty = githubToken === ''
    expect(isTokenEmpty).toBe(true)
  })

  it('leaves the repository URL empty', () => {
    const isRepositoryUrlEmpty = repositoryUrl === ''
    expect(isRepositoryUrlEmpty).toBe(true)
  })

  it('leaves the Project number empty', () => {
    const isProjectNumberEmpty = projectNumberSetting === ''
    expect(isProjectNumberEmpty).toBe(true)
  })
})
