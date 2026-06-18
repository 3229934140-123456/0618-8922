import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'studio.db')

interface StatementResult {
  lastInsertRowid: number | bigint
  changes: number
}

class WrappedStatement {
  private sql: string
  private db: SqlJsDatabase
  private wrapper: WrappedDatabase

  constructor(wrapper: WrappedDatabase, db: SqlJsDatabase, sql: string) {
    this.wrapper = wrapper
    this.db = db
    this.sql = sql
  }

  all(...params: unknown[]): Record<string, unknown>[] {
    const stmt = this.db.prepare(this.sql)
    if (params.length > 0) {
      stmt.bind(params as (string | number | null | Uint8Array)[])
    }
    const results: Record<string, unknown>[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject() as Record<string, unknown>)
    }
    stmt.free()
    return results
  }

  get(...params: unknown[]): Record<string, unknown> | undefined {
    const stmt = this.db.prepare(this.sql)
    if (params.length > 0) {
      stmt.bind(params as (string | number | null | Uint8Array)[])
    }
    let result: Record<string, unknown> | undefined
    if (stmt.step()) {
      result = stmt.getAsObject() as Record<string, unknown>
    }
    stmt.free()
    return result
  }

  run(...params: unknown[]): StatementResult {
    this.db.run(this.sql, params as (string | number | null | Uint8Array)[])
    const rowidResult = this.db.exec('SELECT last_insert_rowid() as id')
    const lastInsertRowid = rowidResult.length > 0 && rowidResult[0].values.length > 0
      ? Number(rowidResult[0].values[0][0])
      : 0
    const result = {
      lastInsertRowid,
      changes: this.db.getRowsModified(),
    }
    if (result.changes > 0) {
      this.wrapper.scheduleSave()
    }
    return result
  }
}

class WrappedDatabase {
  private db: SqlJsDatabase
  private saveTimer: ReturnType<typeof setTimeout> | null = null

  constructor(db: SqlJsDatabase) {
    this.db = db
  }

  prepare(sql: string): WrappedStatement {
    return new WrappedStatement(this, this.db, sql)
  }

  exec(sql: string): void {
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0)
    for (const stmt of statements) {
      this.db.run(stmt)
    }
    this.scheduleSave()
  }

  pragma(_pragma: string): void {
  }

  transaction<T extends (...args: unknown[]) => unknown>(fn: T): T {
    return ((...args: unknown[]) => {
      this.db.run('BEGIN TRANSACTION')
      try {
        const result = fn(...args)
        this.db.run('COMMIT')
        this.scheduleSave()
        return result
      } catch (err) {
        this.db.run('ROLLBACK')
        throw err
      }
    }) as T
  }

  scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => this.save(), 100)
  }

  save(): void {
    try {
      const data = this.db.export()
      const buffer = Buffer.from(data)
      fs.writeFileSync(dbPath, buffer)
    } catch (err) {
      console.error('Failed to save database:', err)
    }
  }

  close(): void {
    this.save()
    this.db.close()
  }
}

let _db: WrappedDatabase | null = null

export async function initDatabase(): Promise<WrappedDatabase> {
  const SQL = await initSqlJs()

  let sqlDb: SqlJsDatabase
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    sqlDb = new SQL.Database(fileBuffer)
  } else {
    sqlDb = new SQL.Database()
  }

  _db = new WrappedDatabase(sqlDb)
  return _db
}

export function getDb(): WrappedDatabase {
  if (!_db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return _db
}

export default _db!
