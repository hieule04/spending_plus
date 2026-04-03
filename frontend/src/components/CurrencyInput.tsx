import React from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  className = "",
  required = false
}: CurrencyInputProps) {
  
  // Format numeric string to have spaces every 3 digits
  const format = (val: string) => {
    if (!val) return "";
    // Remove non-numeric characters
    const clean = val.replace(/\D/g, "");
    // Add spaces every 3 digits from the right
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    onChange(rawValue);
  };

  const displayValue = format(value);

  return (
    <input
      type="text"
      inputMode="numeric"
      required={required}
      value={displayValue}
      onChange={handleInputChange}
      className={className}
      placeholder={placeholder}
    />
  );
}
