import type { ptBR } from './messages/pt-BR'

export type MessageSchema<Messages> = {
  [Key in keyof Messages]: Messages[Key] extends string ? string : MessageSchema<Messages[Key]>
}

type KeyPaths<Messages> = Messages extends string
  ? never
  : {
      [Key in keyof Messages & string]: Messages[Key] extends string
        ? Key
        : `${Key}.${KeyPaths<Messages[Key]>}`
    }[keyof Messages & string]

export type MessageKey = KeyPaths<typeof ptBR>
