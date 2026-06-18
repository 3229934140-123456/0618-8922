import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status, date } = req.query
    let sql = `
      SELECT b.*, s.name as service_name, s.category as service_category, s.base_price,
             c.name as customer_name, c.phone as customer_phone, c.email as customer_email
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN customers c ON b.customer_id = c.id
      WHERE 1=1
    `
    const params: unknown[] = []
    if (status) {
      sql += ' AND b.status = ?'
      params.push(status)
    }
    if (date) {
      sql += ' AND b.date = ?'
      params.push(date)
    }
    sql += ' ORDER BY b.date DESC, b.time_slot ASC'
    const rows = db.prepare(sql).all(...params)
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' })
  }
})

router.get('/customer/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rows = db.prepare(`
      SELECT b.*, s.name as service_name, s.category as service_category, s.base_price
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.customer_id = ?
      ORDER BY b.date DESC, b.time_slot ASC
    `).all(req.params.id)
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch customer bookings' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const row = db.prepare(`
      SELECT b.*, s.name as service_name, s.category as service_category, s.base_price, s.duration,
             c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
             c.style_preferences as customer_style_preferences
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `).get(req.params.id) as Record<string, unknown> | undefined
    if (!row) {
      res.status(404).json({ success: false, error: 'Booking not found' })
      return
    }
    row.customer_style_preferences = JSON.parse((row.customer_style_preferences as string) || '[]')
    res.json({ success: true, data: row })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch booking' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { serviceId, customerName, customerPhone, customerEmail, date, timeSlot, notes } = req.body

    if (!serviceId || !customerName || !customerPhone || !date || !timeSlot) {
      res.status(400).json({ success: false, error: 'Missing required fields' })
      return
    }

    const booked = db.prepare(`
      SELECT id FROM bookings
      WHERE date = ? AND time_slot LIKE ? || '%' AND status != 'cancelled'
    `).get(date, timeSlot.split('-')[0])
    if (booked) {
      res.status(409).json({ success: false, error: '该时段已被预约' })
      return
    }

    let customerId: number
    const existingCustomer = db.prepare('SELECT id FROM customers WHERE phone = ?').get(customerPhone) as { id: number } | undefined
    if (existingCustomer) {
      customerId = existingCustomer.id
      if (customerName || customerEmail) {
        db.prepare(`
          UPDATE customers SET
            name = COALESCE(?, name),
            email = COALESCE(?, email),
            updated_at = datetime('now')
          WHERE id = ?
        `).run(customerName || null, customerEmail || null, customerId)
      }
    } else {
      const custResult = db.prepare('INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)').run(
        customerName,
        customerPhone,
        customerEmail ?? null,
      )
      customerId = Number(custResult.lastInsertRowid)
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId) as Record<string, unknown> | undefined
    if (!service) {
      res.status(400).json({ success: false, error: 'Service not found' })
      return
    }

    let multiplier = 1.0

    const holiday = db.prepare('SELECT price_multiplier FROM holidays WHERE date = ?').get(date) as { price_multiplier: number } | undefined
    if (holiday && holiday.price_multiplier > 1) {
      multiplier = holiday.price_multiplier
    } else {
      const schedule = db.prepare('SELECT season_type, price_multiplier FROM schedule_configs WHERE date = ?').get(date) as
        | { season_type: string; price_multiplier: number }
        | undefined

      let seasonType = schedule?.season_type || 'normal'
      const scheduleMultiplier = schedule?.price_multiplier || 1

      if (scheduleMultiplier > 1) {
        multiplier = scheduleMultiplier
      } else {
        const seasonPricing = db
          .prepare('SELECT multiplier FROM season_pricing WHERE season_type = ? AND service_id = ?')
          .get(seasonType, serviceId) as { multiplier: number } | undefined
        if (seasonPricing && seasonPricing.multiplier > 1) {
          multiplier = seasonPricing.multiplier
        }
      }
    }

    const basePrice = service.base_price as number
    const depositRate = service.deposit_rate as number
    const totalPrice = Math.round(basePrice * multiplier * 100) / 100
    const depositAmount = Math.round(totalPrice * depositRate * 100) / 100

    const timeSlotStart = timeSlot.includes('-') ? timeSlot.split('-')[0] : timeSlot

    const result = db.prepare(`
      INSERT INTO bookings (
        service_id, customer_id, date, time_slot, status, deposit_paid, deposit_amount, total_price, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      serviceId,
      customerId,
      date,
      timeSlotStart,
      'confirmed',
      1,
      depositAmount,
      totalPrice,
      notes ?? null,
    )

    const booking = db.prepare(`
      SELECT b.*, s.name as service_name, c.name as customer_name, c.phone as customer_phone, c.email as customer_email
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: booking })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create booking' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!existing) {
      res.status(404).json({ success: false, error: 'Booking not found' })
      return
    }
    const { status, depositPaid, photographerId } = req.body
    db.prepare(`
      UPDATE bookings SET
        status = COALESCE(?, status),
        deposit_paid = COALESCE(?, deposit_paid),
        photographer_id = COALESCE(?, photographer_id),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(status ?? null, depositPaid ?? null, photographerId ?? null, req.params.id)
    const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: row })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update booking' })
  }
})

router.get('/available-slots/list', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { date } = req.query
    if (!date) {
      res.status(400).json({ success: false, error: 'Date parameter is required' })
      return
    }

    const schedule = db.prepare('SELECT is_available FROM schedule_configs WHERE date = ?').get(date as string) as
      | { is_available: number }
      | undefined
    if (schedule && !schedule.is_available) {
      res.json({ success: true, data: [] })
      return
    }

    const allSlots: string[] = []
    for (let h = 9; h < 18; h++) {
      allSlots.push(`${h.toString().padStart(2, '0')}:00`)
    }

    const booked = db.prepare("SELECT time_slot FROM bookings WHERE date = ? AND status != 'cancelled'").all(date as string) as {
      time_slot: string
    }[]
    const bookedSlots = new Set(booked.map((b) => b.time_slot))
    const available = allSlots.filter((s) => !bookedSlots.has(s))

    res.json({ success: true, data: available })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch available slots' })
  }
})

router.get('/price/preview', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { serviceId, date } = req.query
    if (!serviceId || !date) {
      res.status(400).json({ success: false, error: 'serviceId and date are required' })
      return
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(Number(serviceId)) as Record<string, unknown> | undefined
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' })
      return
    }

    let multiplier = 1.0
    let multiplierType = 'normal'

    const holiday = db.prepare('SELECT price_multiplier FROM holidays WHERE date = ?').get(date as string) as { price_multiplier: number } | undefined
    if (holiday && holiday.price_multiplier > 1) {
      multiplier = holiday.price_multiplier
      multiplierType = 'holiday'
    } else {
      const schedule = db.prepare('SELECT season_type, price_multiplier FROM schedule_configs WHERE date = ?').get(date as string) as
        | { season_type: string; price_multiplier: number }
        | undefined

      const seasonType = schedule?.season_type || 'normal'
      const scheduleMultiplier = schedule?.price_multiplier || 1

      if (scheduleMultiplier > 1) {
        multiplier = scheduleMultiplier
        multiplierType = 'schedule'
      } else {
        const seasonPricing = db
          .prepare('SELECT multiplier FROM season_pricing WHERE season_type = ? AND service_id = ?')
          .get(seasonType, Number(serviceId)) as { multiplier: number } | undefined
        if (seasonPricing && seasonPricing.multiplier !== 1) {
          multiplier = seasonPricing.multiplier
          multiplierType = seasonType as string
        }
      }
    }

    const basePrice = Number(service.base_price)
    const depositRate = Number(service.deposit_rate)
    const totalPrice = Math.round(basePrice * multiplier * 100) / 100
    const depositAmount = Math.round(totalPrice * depositRate * 100) / 100

    res.json({
      success: true,
      data: {
        basePrice,
        depositRate,
        multiplier,
        multiplierType,
        totalPrice,
        depositAmount,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to preview price' })
  }
})

export default router
