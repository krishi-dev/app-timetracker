export interface Category {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface TimeLog {
  id: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  category_id: number;
}

export interface TimeSlot {
  time: string;
  category?: Category;
  isSelected?: boolean;
}

export interface DayStats {
  date: string;
  categoryHours: { [categoryId: number]: number };
  unloggedHours: number;
  totalLogged: number;
}