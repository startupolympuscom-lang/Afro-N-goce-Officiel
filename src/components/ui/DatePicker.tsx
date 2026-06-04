import React, { forwardRef, useMemo } from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

// Register French locale for the date picker
registerLocale('fr', fr);

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, className = '', required = false, placeholder = 'JJ/MM/AAAA' }, ref) => {
    const selectedDate = useMemo(() => {
      if (!value) return null;
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }, [value]);

    const handleChange = (date: Date | null) => {
      let newValue = '';
      if (date && !isNaN(date.getTime())) {
        // Format to YYYY-MM-DD for internal state consistency
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        newValue = `${year}-${month}-${day}`;
      }
      
      // Only trigger onChange if the value actually changed to prevent infinite loops
      if (newValue !== value) {
        onChange(newValue);
      }
    };

    return (
      <div className="relative">
        <ReactDatePicker
          selected={selectedDate}
          onChange={handleChange}
          dateFormat="dd/MM/yyyy"
          locale="fr"
          placeholderText={placeholder}
          required={required}
          className={`w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${className}`}
          customInput={<input ref={ref} />}
        />
        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
