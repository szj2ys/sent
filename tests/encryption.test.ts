import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from '~/utils/encryption'

describe('Encryption utilities', () => {
  it('should encrypt and decrypt text correctly', () => {
    const original = 'my-secret-auth-token'
    const encrypted = encrypt(original)
    
    expect(encrypted).not.toBe(original)
    expect(encrypted).toContain(':') // format: iv:ciphertext
    
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(original)
  })

  it('should produce different ciphertext for same input', () => {
    const original = 'my-secret'
    const encrypted1 = encrypt(original)
    const encrypted2 = encrypt(original)
    
    expect(encrypted1).not.toBe(encrypted2)
    expect(decrypt(encrypted1)).toBe(original)
    expect(decrypt(encrypted2)).toBe(original)
  })

  it('should throw on invalid encrypted data', () => {
    expect(() => decrypt('invalid-data')).toThrow()
  })

  it('should throw on tampered ciphertext', () => {
    const original = 'my-secret'
    const encrypted = encrypt(original)
    const [iv] = encrypted.split(':')
    const tampered = `${iv}:tamperedciphertext`
    
    expect(() => decrypt(tampered)).toThrow()
  })
})
