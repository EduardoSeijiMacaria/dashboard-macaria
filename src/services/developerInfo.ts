import type { ContactChannel, DeveloperInfo } from '../types/domain'

export const developerInfo: DeveloperInfo = {
  name: 'QA Macaria',
  contact: {
    name: 'e-mail',
    url: 'mailto:eduardo.castro@frenet.com.br',
    display: 'eduardo.castro@frenet.com.br'
  }
}

const allowedContactProtocols = ['https:', 'mailto:']

export function findUsableContact(developer: DeveloperInfo): ContactChannel | undefined {
  const { contact } = developer
  if (!contact) return undefined
  const protocol = readProtocol(contact.url)
  if (protocol && allowedContactProtocols.includes(protocol)) return contact
  console.error('ContactUrlRejected', contact.name)
  return undefined
}

function readProtocol(url: string): string | undefined {
  try {
    return new URL(url).protocol
  } catch {
    return undefined
  }
}
