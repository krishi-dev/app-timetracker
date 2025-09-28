import * as SQLite from 'expo-sqlite';
import { Category, TimeLog } from '@/types/database';

let db: SQLite.SQLiteDatabase;

export async function initDatabase() {
  db = await SQLite.openDatabaseAsync('timetracker.db');
  
  // Create categories table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create time_logs table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS time_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      category_id INTEGER,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);
  
  // Create unique index to prevent overlapping time slots
  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_time_slot 
    ON time_logs(date, start_time);
  `);
}

export async function getCategories(): Promise<Category[]> {
  const result = await db.getAllAsync('SELECT * FROM categories ORDER BY name');
  return result as Category[];
}

export async function addCategory(name: string, color: string): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO categories (name, color) VALUES (?, ?)',
    [name, color]
  );
  return result.lastInsertRowId;
}

export async function updateCategory(id: number, name: string, color: string): Promise<void> {
  await db.runAsync(
    'UPDATE categories SET name = ?, color = ? WHERE id = ?',
    [name, color, id]
  );
}

export async function deleteCategory(id: number): Promise<void> {
  // First remove the category from time logs (set to NULL)
  await db.runAsync('UPDATE time_logs SET category_id = NULL WHERE category_id = ?', [id]);
  // Then delete the category
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function getTimeLogsForDate(date: string): Promise<TimeLog[]> {
  const result = await db.getAllAsync(
    'SELECT * FROM time_logs WHERE date = ? ORDER BY start_time',
    [date]
  );
  return result as TimeLog[];
}

export async function logTime(date: string, startTime: string, endTime: string, categoryId: number): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO time_logs (date, start_time, end_time, category_id) VALUES (?, ?, ?, ?)',
    [date, startTime, endTime, categoryId]
  );
}

export async function bulkLogTime(date: string, timeSlots: string[], categoryId: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const startTime of timeSlots) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const endMinutes = minutes + 15;
      const endHours = endMinutes >= 60 ? hours + 1 : hours;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
      
      await db.runAsync(
        'INSERT OR REPLACE INTO time_logs (date, start_time, end_time, category_id) VALUES (?, ?, ?, ?)',
        [date, startTime, endTime, categoryId]
      );
    }
  });
}

export async function deleteTimeLog(date: string, startTime: string): Promise<void> {
  await db.runAsync(
    'DELETE FROM time_logs WHERE date = ? AND start_time = ?',
    [date, startTime]
  );
}

export async function getStatsForDateRange(startDate: string, endDate: string) {
  const result = await db.getAllAsync(`
    SELECT 
      tl.date,
      c.id as category_id,
      c.name as category_name,
      c.color as category_color,
      COUNT(*) * 0.25 as hours
    FROM time_logs tl
    LEFT JOIN categories c ON tl.category_id = c.id
    WHERE tl.date BETWEEN ? AND ?
    GROUP BY tl.date, c.id, c.name, c.color
    ORDER BY tl.date, c.name
  `, [startDate, endDate]);
  
  return result;
}

export async function initDefaultCategories() {
  const existingCategories = await getCategories();
  if (existingCategories.length === 0) {
    const defaultCategories = [
      { name: 'Work', color: '#3B82F6' },
      { name: 'Study', color: '#10B981' },
      { name: 'Leisure', color: '#F59E0B' },
      { name: 'Sleep', color: '#6366F1' },
      { name: 'Exercise', color: '#EF4444' },
      { name: 'Other', color: '#6B7280' }
    ];
    
    for (const category of defaultCategories) {
      await addCategory(category.name, category.color);
    }
  }
}