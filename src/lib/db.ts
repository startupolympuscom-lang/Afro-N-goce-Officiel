import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://dummy:dummy@localhost/dummy', // dummy to prevent crash on instantiating
  ssl: {
    rejectUnauthorized: false
  }
});

export async function query(text: string, params?: any[]) {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required but not configured.');
  }
  return pool.query(text, params);
}

export async function initDb() {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.error('initDb: DATABASE_URL is missing, skipping DB initialization.');
    throw new Error('DATABASE_URL environment variable is required');
  }
  console.log('initDb: Connecting client...');
  const client = await pool.connect();
  console.log('initDb: Client connected');
  try {
    await client.query('BEGIN');

    // Zustand Stores Persistence Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS zustand_stores (
        name TEXT PRIMARY KEY,
        state JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // E-commerce Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS ecom_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ecom_products (
        id TEXT PRIMARY KEY,
        category_id TEXT REFERENCES ecom_categories(id),
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url TEXT,
        stock INTEGER DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ecom_orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT NOT NULL,
        customer_address TEXT NOT NULL,
        items JSONB NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Afro Dispatch Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS dispatch_drivers (
        id TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        status TEXT DEFAULT 'actif',
        cnss TEXT,
        address TEXT,
        cin TEXT,
        speed NUMERIC DEFAULT 0,
        stops INTEGER DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS gaz_brands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        categories TEXT[],
        mascot_url TEXT,
        logo_url TEXT
      )
    `);

    // Ensure columns exist for older table versions
    await client.query("ALTER TABLE gaz_brands ADD COLUMN IF NOT EXISTS mascot_url TEXT");
    await client.query("ALTER TABLE gaz_brands ADD COLUMN IF NOT EXISTS logo_url TEXT");

    await client.query(`
      CREATE TABLE IF NOT EXISTS gaz_clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        zone_id TEXT,
        city TEXT,
        address TEXT,
        lat NUMERIC,
        lng NUMERIC
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS gaz_sales (
        id TEXT PRIMARY KEY,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        driver_id TEXT REFERENCES dispatch_drivers(id),
        client_id TEXT REFERENCES gaz_clients(id),
        brand_id TEXT REFERENCES gaz_brands(id),
        category TEXT,
        quantity INTEGER,
        unit_price NUMERIC,
        total_price NUMERIC
      )
    `);

    // FleetOps Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS fleet_vehicules (
        id TEXT PRIMARY KEY,
        immatriculation TEXT NOT NULL UNIQUE,
        marque TEXT,
        modele TEXT,
        type TEXT,
        status TEXT DEFAULT 'disponible',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fleet_chauffeurs (
        id TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        status TEXT DEFAULT 'actif',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fleet_documents (
        id TEXT PRIMARY KEY,
        entite_id TEXT NOT NULL,
        entite_type TEXT NOT NULL,
        type TEXT NOT NULL,
        reference TEXT,
        date_emission DATE,
        date_expiration DATE NOT NULL,
        prestataire TEXT,
        cout NUMERIC,
        fichier_url TEXT,
        notes TEXT,
        status TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure columns exist for older table versions
    await client.query("ALTER TABLE fleet_documents ADD COLUMN IF NOT EXISTS entite_type TEXT");
    await client.query("ALTER TABLE fleet_documents ADD COLUMN IF NOT EXISTS reference TEXT");
    await client.query("ALTER TABLE fleet_documents ADD COLUMN IF NOT EXISTS date_emission DATE");
    await client.query("ALTER TABLE fleet_documents ADD COLUMN IF NOT EXISTS prestataire TEXT");
    await client.query("ALTER TABLE fleet_documents ADD COLUMN IF NOT EXISTS cout NUMERIC");
    await client.query("ALTER TABLE fleet_documents ADD COLUMN IF NOT EXISTS fichier_url TEXT");
    await client.query("ALTER TABLE fleet_documents ADD COLUMN IF NOT EXISTS notes TEXT");
    await client.query("ALTER TABLE fleet_documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP");

    await client.query(`
      CREATE TABLE IF NOT EXISTS fleet_maintenance (
        id TEXT PRIMARY KEY,
        vehicule_id TEXT REFERENCES fleet_vehicules(id),
        type TEXT NOT NULL,
        date DATE NOT NULL,
        kilometrage INTEGER,
        cout NUMERIC,
        prestataire_id TEXT,
        description TEXT,
        status TEXT DEFAULT 'termine'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_name TEXT NOT NULL,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fleet_budgets (
        id TEXT PRIMARY KEY,
        categorie TEXT NOT NULL,
        montant_alloue NUMERIC NOT NULL,
        montant_consomme NUMERIC DEFAULT 0,
        periode TEXT NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fleet_infractions (
        id TEXT PRIMARY KEY,
        chauffeur_id TEXT REFERENCES fleet_chauffeurs(id),
        vehicule_id TEXT REFERENCES fleet_vehicules(id),
        type TEXT NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        montant NUMERIC,
        points_perdus INTEGER,
        status TEXT DEFAULT 'en_attente'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fleet_prestataires (
        id TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        service TEXT NOT NULL,
        contact TEXT,
        telephone TEXT,
        email TEXT,
        adresse TEXT,
        note NUMERIC DEFAULT 5
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fleet_charges_variables (
        id TEXT PRIMARY KEY,
        vehicule_id TEXT REFERENCES fleet_vehicules(id),
        type TEXT NOT NULL,
        montant NUMERIC NOT NULL,
        date DATE NOT NULL,
        description TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fleet_vidanges (
        id TEXT PRIMARY KEY,
        vehicule_id TEXT REFERENCES fleet_vehicules(id),
        date DATE NOT NULL,
        kilometrage INTEGER NOT NULL,
        kilometrage_prochain INTEGER,
        cout NUMERIC,
        type_huile TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fleet_leasings (
        id TEXT PRIMARY KEY,
        vehicule_id TEXT REFERENCES fleet_vehicules(id),
        bailleur TEXT NOT NULL,
        date_debut DATE NOT NULL,
        date_fin DATE NOT NULL,
        loyer_mensuel NUMERIC NOT NULL,
        kilometrage_max INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fleet_carburant_tickets (
        id TEXT PRIMARY KEY,
        vehicule_id TEXT REFERENCES fleet_vehicules(id),
        chauffeur_id TEXT REFERENCES fleet_chauffeurs(id),
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        volume NUMERIC NOT NULL,
        prix_unitaire NUMERIC NOT NULL,
        montant_total NUMERIC NOT NULL,
        station TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fleet_missions (
        id TEXT PRIMARY KEY,
        chauffeur_id TEXT REFERENCES fleet_chauffeurs(id),
        vehicule_id TEXT REFERENCES fleet_vehicules(id),
        date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
        date_fin TIMESTAMP WITH TIME ZONE,
        destination TEXT NOT NULL,
        status TEXT DEFAULT 'en_cours',
        kilometrage_debut INTEGER,
        kilometrage_fin INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fleet_pneus (
        id TEXT PRIMARY KEY,
        vehicule_id TEXT REFERENCES fleet_vehicules(id),
        date_installation DATE NOT NULL,
        kilometrage_installation INTEGER NOT NULL,
        marque TEXT,
        position TEXT,
        etat TEXT DEFAULT 'neuf'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS news_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        category TEXT,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        avatar_initials TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', e);
    throw e;
  } finally {
    client.release();
  }
}
