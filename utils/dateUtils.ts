import { format, differenceInHours, differenceInMinutes, addHours, startOfDay, endOfDay } from 'date-fns';

export const dateUtils = {
  formatTime(date: Date): string {
    return format(date, 'HH:mm');
  },

  formatDate(date: Date): string {
    return format(date, 'MMM dd, yyyy');
  },

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  },

  formatTimeRemaining(endTime: Date): string {
    const now = new Date();
    const totalMinutes = differenceInMinutes(endTime, now);
    
    if (totalMinutes <= 0) {
      return '0m';
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  formatTimeRemaining(endTime: Date, currentTime?: Date): string {
    const now = currentTime || new Date();
    const totalMinutes = differenceInMinutes(endTime, now);
    
    if (totalMinutes <= 0) {
      return '0m';
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },
  getProgressPercentage(startTime: Date, endTime: Date, currentTime?: Date): number {
    const now = currentTime || new Date();
    const totalDuration = differenceInMinutes(endTime, startTime);
    const elapsed = differenceInMinutes(now, startTime);
    
    if (elapsed <= 0) return 0;
    if (elapsed >= totalDuration) return 100;
    
    return Math.round((elapsed / totalDuration) * 100);
  },

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  },

  addHoursToDate(date: Date, hours: number): Date {
    return addHours(date, hours);
  },

  getDayStart(date: Date): Date {
    return startOfDay(date);
  },

  getDayEnd(date: Date): Date {
    return endOfDay(date);
  },
};