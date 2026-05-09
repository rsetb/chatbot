import { defineConfig } from '@prisma/config'
import * as dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  earlyAccess: true,
  studio: {
    port: 5555,
  }
})
