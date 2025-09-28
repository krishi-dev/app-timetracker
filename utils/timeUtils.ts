export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function formatDateForDisplay(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

export function getWeekDates(date: string): string[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // First day is Sunday
  const sunday = new Date(d.setDate(diff));
  
  const week = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    week.push(day.toISOString().split('T')[0]);
  }
  return week;
}

export function getMonthDates(date: string): string[] {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const dates = [];
  for (let day = 1; day <= lastDay.getDate(); day++) {
    dates.push(new Date(year, month, day).toISOString().split('T')[0]);
  }
  return dates;
}