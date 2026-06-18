import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import serviceRoutes from './routes/services.js'
import bookingRoutes from './routes/bookings.js'
import albumRoutes from './routes/albums.js'
import customerRoutes from './routes/customers.js'
import reviewRoutes from './routes/reviews.js'
import scheduleRoutes from './routes/schedule.js'
import statsRoutes from './routes/stats.js'
import { initDatabase } from './db.js'
import { seedDatabase } from './seed.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/albums', albumRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/schedule', scheduleRoutes)
app.use('/api/stats', statsRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export async function initializeApp(): Promise<express.Application> {
  await initDatabase()

  const ddl = `
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      duration INTEGER NOT NULL,
      base_price REAL NOT NULL,
      deposit_rate REAL NOT NULL DEFAULT 0.3,
      included_items TEXT NOT NULL DEFAULT '[]',
      description TEXT,
      image_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      style_preferences TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      photographer_id INTEGER,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      deposit_paid INTEGER NOT NULL DEFAULT 0,
      deposit_amount REAL NOT NULL DEFAULT 0,
      total_price REAL NOT NULL DEFAULT 0,
      price_multiplier REAL NOT NULL DEFAULT 1.0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      access_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      album_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      thumbnail_url TEXT,
      is_selected INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      content TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      is_featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS schedule_configs (
      date TEXT PRIMARY KEY,
      is_available INTEGER NOT NULL DEFAULT 1,
      price_multiplier REAL NOT NULL DEFAULT 1.0,
      is_holiday INTEGER NOT NULL DEFAULT 0,
      season_type TEXT NOT NULL DEFAULT 'normal'
    );
    CREATE TABLE IF NOT EXISTS photographer_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      photographer_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS season_pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_type TEXT NOT NULL,
      service_id INTEGER NOT NULL,
      multiplier REAL NOT NULL DEFAULT 1.0
    );
    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      price_multiplier REAL NOT NULL DEFAULT 1.0
    );
  `

  const { getDb } = await import('./db.js')
  const db = getDb()
  db.exec(ddl)
  try {
    db.exec('ALTER TABLE bookings ADD COLUMN price_multiplier REAL NOT NULL DEFAULT 1.0')
  } catch { /* 字段已存在则忽略 */ }
  db.save()

  seedDatabase()

  return app
}

export default app
