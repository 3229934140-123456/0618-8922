import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScheduleConfig } from '@/store';

interface CalendarProps {
  schedules?: ScheduleConfig[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function Calendar({ schedules = [], selectedDate, onSelectDate }: CalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const scheduleMap = new Map(schedules.map((s) => [s.date, s]));

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDateClass = (day: number) => {
    const dateStr = formatDate(currentYear, currentMonth, day);
    const schedule = scheduleMap.get(dateStr);
    const isToday = formatDate(today.getFullYear(), today.getMonth(), today.getDate()) === dateStr;
    const isSelected = selectedDate === dateStr;

    let base = 'w-9 h-9 flex items-center justify-center rounded-full text-sm font-body cursor-pointer transition-all ';

    if (isSelected) {
      return base + 'bg-gold text-charcoal font-semibold';
    }
    if (schedule?.isHoliday) {
      return base + 'bg-gold/20 text-gold';
    }
    if (!schedule?.isAvailable && schedule) {
      return base + 'text-charcoal/30 cursor-not-allowed line-through';
    }
    if (isToday) {
      return base + 'border border-gold text-gold';
    }
    return base + 'text-charcoal/80 hover:bg-gold/10';
  };

  return (
    <div className="bg-ivory rounded-xl p-6 shadow-sm border border-gold/10">
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-1 text-charcoal/60 hover:text-gold transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-display text-lg text-charcoal">
          {currentYear}年{currentMonth + 1}月
        </h3>
        <button onClick={nextMonth} className="p-1 text-charcoal/60 hover:text-gold transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-body text-charcoal/50 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = formatDate(currentYear, currentMonth, day);
          const schedule = scheduleMap.get(dateStr);
          const isDisabled = schedule && !schedule.isAvailable;

          return (
            <div key={day} className="flex justify-center">
              <button
                disabled={isDisabled}
                className={getDateClass(day)}
                onClick={() => !isDisabled && onSelectDate?.(dateStr)}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-4 text-xs font-body text-charcoal/60">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gold/20" />
          节假日
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full border border-gold" />
          今天
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gold" />
          已选
        </div>
      </div>
    </div>
  );
}
