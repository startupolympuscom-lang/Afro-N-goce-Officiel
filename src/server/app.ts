import express from 'express';
import { pool, initDb } from '../lib/db.js'; // Note .ts to .js may be needed for vercel build
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const app = express();

// Custom body parsing middleware to handle Vercel's pre-parsed body
app.use((req, res, next) => {
  // In Vercel, req.body might already be parsed for JSON payloads.
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return next();
  }
  express.json({ limit: '100mb' })(req, res, next);
});

app.use(express.urlencoded({ limit: '100mb', extended: true }));

let dbInitPromise: Promise<void> | null = null;

async function ensureDb() {
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = (async () => {
    try {
      console.log('Connecting to PostgreSQL from API...');
      await initDb();
      console.log('PostgreSQL connected and initialized');
      
      // Seed first admin if not exists
      const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@fleetops.com']);
      if (adminCheck.rows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin', salt);
        await pool.query(
          'INSERT INTO users (id, nom, prenom, email, password, role, avatar_initials) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [nanoid(), 'Admin', 'System', 'admin@fleetops.com', hashedPassword, 'super_admin', 'AS']
        );
        console.log('Seeded default admin user: admin@fleetops.com / admin');
      }

      // Seed dispatch users
      const dispatchAdminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@afronegoce.ma']);
      if (dispatchAdminCheck.rows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedAdmin = await bcrypt.hash('admin', salt);
        const hashedDriver = await bcrypt.hash('driver', salt);
        const hashedVendeur = await bcrypt.hash('vendeur', salt);
        
        await pool.query(
          'INSERT INTO users (id, nom, prenom, email, password, role, avatar_initials) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [nanoid(), 'Admin', 'Dispatch', 'admin@afronegoce.ma', hashedAdmin, 'admin', 'AD']
        );
        await pool.query(
          'INSERT INTO users (id, nom, prenom, email, password, role, avatar_initials) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [nanoid(), 'Chauffeur', 'Test', 'driver@afronegoce.ma', hashedDriver, 'driver', 'CT']
        );
        await pool.query(
          'INSERT INTO users (id, nom, prenom, email, password, role, avatar_initials) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [nanoid(), 'Vendeur', 'Comptoir', 'vendeur@afronegoce.ma', hashedVendeur, 'vendeur_comptoir', 'VC']
        );
        const hashedStock = await bcrypt.hash('stock', salt);
        await pool.query(
          'INSERT INTO users (id, nom, prenom, email, password, role, avatar_initials) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [nanoid(), 'Stock', 'Superviseur', 'stock@afronegoce.ma', hashedStock, 'stock_superviseur', 'SS']
        );
        console.log('Seeded dispatch users');
      }

      // Seed vendeur user if missing
      const vendeurCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['vendeur@afronegoce.ma']);
      if (vendeurCheck.rows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedVendeur = await bcrypt.hash('vendeur', salt);
        await pool.query(
          'INSERT INTO users (id, nom, prenom, email, password, role, avatar_initials) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [nanoid(), 'Vendeur', 'Comptoir', 'vendeur@afronegoce.ma', hashedVendeur, 'vendeur_comptoir', 'VC']
        );
        console.log('Seeded vendeur comptoir user');
      }

      // Seed stock user if missing
      const stockCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['stock@afronegoce.ma']);
      if (stockCheck.rows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedStock = await bcrypt.hash('stock', salt);
        await pool.query(
          'INSERT INTO users (id, nom, prenom, email, password, role, avatar_initials) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [nanoid(), 'Stock', 'Superviseur', 'stock@afronegoce.ma', hashedStock, 'stock_superviseur', 'SS']
        );
        console.log('Seeded stock superviseur user');
      }

      // Seed compta user
      const dispatchComptableCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['comptable@afronegoce.ma']);
      if (dispatchComptableCheck.rows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedComptable = await bcrypt.hash('comptable', salt);
        await pool.query(
          'INSERT INTO users (id, nom, prenom, email, password, role, avatar_initials) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [nanoid(), 'Comptable', 'Fiduciaire', 'comptable@afronegoce.ma', hashedComptable, 'comptable', 'CF']
        );
        console.log('Seeded compta user: comptable@afronegoce.ma / comptable');
      }

      // Seed Brands
      const brands = [
        {
          id: 'b1',
          name: 'Butagaz',
          categories: ['3Kg', '12Kg', '34Kg'],
          mascot_url: 'https://static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_0.png',
          logo_url: 'https://static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_0.png'
        },
        {
          id: 'b2',
          name: 'Air Liquide',
          categories: ['Industriel', 'Médical', 'Spécial'],
          mascot_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Air_Liquide_logo.svg/2560px-Air_Liquide_logo.svg.png',
          logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Air_Liquide_logo.svg/2560px-Air_Liquide_logo.svg.png'
        }
      ];

      for (const brand of brands) {
        await pool.query(
          'INSERT INTO gaz_brands (id, name, categories, mascot_url, logo_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
          [brand.id, brand.name, brand.categories, brand.mascot_url, brand.logo_url]
        );
      }
      console.log('Seeded/Updated gaz brands');
    } catch (err) {
      dbInitPromise = null; // Clear promise on error so we can retry on next request
      console.error('Failed to initialize database during cold start:', err);
      throw err;
    }
  })();

  return dbInitPromise;
}

// Global middleware to conditionally initialize DB for Vercel Serverless cold starts
app.use('/api', async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (error) {
    console.error('Error in ensureDb middleware:', error);
    res.status(500).json({ error: 'Database initialization failed' });
  }
});

// Auth Routes
app.post('/api/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SSE clients for real-time zustand updates
const sseClients = new Set<express.Response>();

app.get('/api/zustand-stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Send initial connected message
  res.write('data: {"connected": true}\n\n');
  
  sseClients.add(res);
  req.on('close', () => {
    sseClients.delete(res);
  });
});

// API Routes for Zustand Persistence
app.get('/api/zustand/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await pool.query('SELECT state FROM zustand_stores WHERE name = $1', [name]);
    if (result.rows.length > 0) {
      res.json(result.rows[0].state);
    } else {
      res.status(404).json({ error: 'Store not found' });
    }
  } catch (error) {
    console.error('Error reading from Postgres:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/zustand/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const state = req.body;
    await pool.query(
      'INSERT INTO zustand_stores (name, state, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (name) DO UPDATE SET state = $2, updated_at = CURRENT_TIMESTAMP',
      [name, state]
    );
    
    // Broadcast update to all connected SSE clients
    const eventData = JSON.stringify({ name, timestamp: Date.now() });
    sseClients.forEach(client => {
      client.write(`data: ${eventData}\n\n`);
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error writing to Postgres:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/zustand/:name', async (req, res) => {
  try {
    const { name } = req.params;
    await pool.query('DELETE FROM zustand_stores WHERE name = $1', [name]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from Postgres:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Document APIs
app.get('/api/zustand-stores', async (req, res) => {
  try {
    const result = await pool.query('SELECT name FROM zustand_stores');
    res.json(result.rows.map(r => r.name));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fleet_documents ORDER BY created_at DESC');
    const docs = result.rows.map(row => ({
      id: row.id,
      entiteId: row.entite_id,
      entiteType: row.entite_type,
      type: row.type,
      reference: row.reference,
      dateEmission: row.date_emission,
      dateExpiration: row.date_expiration,
      prestataire: row.prestataire,
      cout: row.cout ? parseFloat(row.cout) : undefined,
      fichierUrl: row.fichier_url,
      notes: row.notes,
      status: row.status
    }));
    res.json(docs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const doc = req.body;
    const id = doc.id || nanoid();
    
    const date_emission = doc.dateEmission && doc.dateEmission.trim() !== '' ? doc.dateEmission : null;
    const date_expiration = doc.dateExpiration && doc.dateExpiration.trim() !== '' ? doc.dateExpiration : null;
    
    if (!date_expiration) {
      return res.status(400).json({ error: "La date d'expiration est obligatoire" });
    }

    await pool.query(
      `INSERT INTO fleet_documents (
        id, entite_id, entite_type, type, reference, date_emission, 
        date_expiration, prestataire, cout, fichier_url, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET 
        entite_id = EXCLUDED.entite_id,
        entite_type = EXCLUDED.entite_type,
        type = EXCLUDED.type,
        reference = EXCLUDED.reference,
        date_emission = EXCLUDED.date_emission,
        date_expiration = EXCLUDED.date_expiration,
        prestataire = EXCLUDED.prestataire,
        cout = EXCLUDED.cout,
        fichier_url = EXCLUDED.fichier_url,
        notes = EXCLUDED.notes,
        status = EXCLUDED.status`,
      [
        id, doc.entiteId, doc.entiteType, doc.type, doc.reference, 
        date_emission, date_expiration, doc.prestataire, 
        doc.cout, doc.fichierUrl, doc.notes, doc.status
      ]
    );
    res.json({ ...doc, id, dateEmission: date_emission, dateExpiration: date_expiration });
  } catch (error: any) {
    console.error('Error saving document:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM fleet_documents WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/brands', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gaz_brands');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/brands/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { mascot_url, logo_url } = req.body;
    await pool.query(
      'UPDATE gaz_brands SET mascot_url = COALESCE($1, mascot_url), logo_url = COALESCE($2, logo_url) WHERE id = $3',
      [mascot_url, logo_url, id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// News and Events APIs
app.get('/api/news', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news_events ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/news', async (req, res) => {
  try {
    const { title, content, image_url, category, date } = req.body;
    const id = nanoid();
    const result = await pool.query(
      'INSERT INTO news_events (id, title, content, image_url, category, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, title, content, image_url, category, date || new Date()]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image_url, category, date } = req.body;
    const result = await pool.query(
      'UPDATE news_events SET title = $1, content = $2, image_url = $3, category = $4, date = $5 WHERE id = $6 RETURNING *',
      [title, content, image_url, category, date, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM news_events WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User APIs
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nom, prenom, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { nom, prenom, email, password, role } = req.body;
    
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    const id = nanoid();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const initials = `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase();

    const result = await pool.query(
      'INSERT INTO users (id, nom, prenom, email, password, role, avatar_initials) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, nom, prenom, email, role, avatar_initials',
      [id, nom, prenom, email, hashedPassword, role, initials]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

export default app;
