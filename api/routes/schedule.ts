import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { month } = req.query
    if (!month) {
      res.status(400).json({ success: false, error: 'Month parameter (YYYY-MM) is required' })
      return
    }
    const rows = db.prepare("SELECT * FROM schedule_configs WHERE date LIKE ? || '%' ORDER BY date").all(month)
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch schedule' })
  }
})

router.put('/:date', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { isAvailable, priceMultiplier, isHoliday, seasonType } = req.body
    const existing = db.prepare('SELECT date FROM schedule_configs WHERE date = ?').get(req.params.date)
    if (existing) {
      db.prepare(`
        UPDATE schedule_configs SET
          is_available = COALESCE(?, is_available),
          price_multiplier = COALESCE(?, price_multiplier),
          is_holiday = COALESCE(?, is_holiday),
          season_type = COALESCE(?, season_type)
        WHERE date = ?
      `).run(
        isAvailable ?? null,
        priceMultiplier ?? null,
        isHoliday ?? null,
        seasonType ?? null,
        req.params.date,
      )
    } else {
      db.prepare(`
        INSERT INTO schedule_configs (date, is_available, price_multiplier, is_holiday, season_type)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        req.params.date,
        isAvailable ?? 1,
        priceMultiplier ?? 1.0,
        isHoliday ?? 0,
        seasonType ?? 'normal',
      )
    }
    const row = db.prepare('SELECT * FROM schedule_configs WHERE date = ?').get(req.params.date)
    res.json({ success: true, data: row })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update schedule config' })
  }
})

router.get('/pricing/seasons', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rows = db.prepare(`
      SELECT sp.*, s.name as service_name
      FROM season_pricing sp
      JOIN services s ON sp.service_id = s.id
      ORDER BY sp.season_type, sp.service_id
    `).all()
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch season pricing' })
  }
})

router.put('/pricing/seasons', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const items: { seasonType: string; serviceId: number; multiplier: number }[] = req.body
    if (!Array.isArray(items)) {
      res.status(400).json({ success: false, error: 'Request body must be an array' })
      return
    }
    const runUpsert = db.transaction((entries: typeof items) => {
      db.prepare('DELETE FROM season_pricing').run()
      for (const item of entries) {
        db.prepare('INSERT INTO season_pricing (season_type, service_id, multiplier) VALUES (?, ?, ?)').run(item.seasonType, item.serviceId, item.multiplier ?? 1.0)
      }
    })
    runUpsert(items)
    const rows = db.prepare('SELECT * FROM season_pricing ORDER BY season_type, service_id').all()
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update season pricing' })
  }
})

router.get('/pricing/holidays', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rows = db.prepare('SELECT * FROM holidays ORDER BY date').all()
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch holidays' })
  }
})

router.post('/pricing/holidays', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { date, name, priceMultiplier } = req.body
    const result = db.prepare('INSERT INTO holidays (date, name, price_multiplier) VALUES (?, ?, ?)').run(date, name, priceMultiplier ?? 1.0)
    const holiday = db.prepare('SELECT * FROM holidays WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: holiday })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add holiday' })
  }
})

router.delete('/pricing/holidays/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT id FROM holidays WHERE id = ?').get(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Holiday not found' })
      return
    }
    db.prepare('DELETE FROM holidays WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: { id: Number(req.params.id) } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete holiday' })
  }
})

export default router
