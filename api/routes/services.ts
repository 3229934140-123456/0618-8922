import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

function parseService(row: Record<string, unknown>) {
  if (!row) return row
  return {
    ...row,
    included_items: JSON.parse((row.included_items as string) || '[]'),
  }
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { category } = req.query
    let sql = 'SELECT * FROM services WHERE is_active = 1'
    const params: unknown[] = []
    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }
    sql += ' ORDER BY created_at DESC'
    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
    res.json({ success: true, data: rows.map(parseService) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch services' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const row = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!row) {
      res.status(404).json({ success: false, error: 'Service not found' })
      return
    }
    res.json({ success: true, data: parseService(row) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch service' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { name, category, duration, basePrice, depositRate, includedItems, description, imageUrl } = req.body
    const stmt = db.prepare(`
      INSERT INTO services (name, category, duration, base_price, deposit_rate, included_items, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      name,
      category,
      duration,
      basePrice,
      depositRate ?? 0.3,
      JSON.stringify(includedItems ?? []),
      description ?? null,
      imageUrl ?? null,
    )
    const row = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>
    res.status(201).json({ success: true, data: parseService(row) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create service' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!existing) {
      res.status(404).json({ success: false, error: 'Service not found' })
      return
    }
    const { name, category, duration, basePrice, depositRate, includedItems, description, imageUrl } = req.body
    db.prepare(`
      UPDATE services SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        duration = COALESCE(?, duration),
        base_price = COALESCE(?, base_price),
        deposit_rate = COALESCE(?, deposit_rate),
        included_items = COALESCE(?, included_items),
        description = COALESCE(?, description),
        image_url = COALESCE(?, image_url),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name ?? null,
      category ?? null,
      duration ?? null,
      basePrice ?? null,
      depositRate ?? null,
      includedItems != null ? JSON.stringify(includedItems) : null,
      description ?? null,
      imageUrl ?? null,
      req.params.id,
    )
    const row = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as Record<string, unknown>
    res.json({ success: true, data: parseService(row) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update service' })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!existing) {
      res.status(404).json({ success: false, error: 'Service not found' })
      return
    }
    db.prepare("UPDATE services SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(req.params.id)
    res.json({ success: true, data: { id: Number(req.params.id), is_active: 0 } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete service' })
  }
})

export default router
