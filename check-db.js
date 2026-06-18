import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const res = await pool.query("SELECT state FROM zustand_stores WHERE name = 'dispatch-gaz-storage'");
  if (res.rows.length > 0) {
    const state = res.rows[0].state;
    // state contains brands
    if (state.state && state.state.brands) {
      console.log('Brands found:', JSON.stringify(state.state.brands).substring(0, 500));
    } else {
      console.log('Brands not found in state:', Object.keys(state));
    }
  } else {
    console.log('No state found for dispatch-gaz-storage');
  }
  process.exit(0);
}
run();
