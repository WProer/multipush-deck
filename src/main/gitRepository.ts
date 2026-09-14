import { stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

export async function isGitRepository(cwd: string): Promise<boolean> {
  let current = resolve(cwd)

  while (true) {
    try {
      const marker = await stat(join(current, '.git'))
      if (marker.isDirectory() || marker.isFile()) {
        return true
      }
    } catch {
      // Continue checking parent directories.
    }

    const parent = dirname(current)
    if (parent === current) {
      return false
    }

    current = parent
  }
}
