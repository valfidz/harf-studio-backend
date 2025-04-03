import postgres from 'postgres'
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL : ""
const sql = postgres(connectionString)

export default sql


// import { createClient } from '@supabase/supabase-js'
// const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL : ""
// const supabaseKey = process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY : ""
// const supabase = createClient(supabaseUrl, supabaseKey)

// export default supabase