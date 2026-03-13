import 'dotenv/config'
import path from 'node:path'

const data = path.resolve(process.cwd(), '.env')


export const config = {
    AssemblyAISTT_API_KEY: process.env.AssemblyAISTT,
    CartesiaTTS_API_KEY: process.env.CartesiaTTS,
    GIMINI_API_KEY: process.env.GIMINI,
    TRAVILY_API_KEY: process.env.TRAVILY,
    PORT: process.env.PORT
}


