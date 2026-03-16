import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || "https://dummy.supabase.co"
const supabaseKey = process.env.SUPABASE_ANON_KEY || "dummy_key"

export const supabase = createClient(supabaseUrl, supabaseKey)
