'use client'

import { Select, SelectItem } from '@heroui/react'
import { CalendarIcon } from '@heroicons/react/24/outline'

interface YearSelectorProps {
  selectedYear: number
  onYearChange: (year: number) => void
  availableYears?: number[]
  className?: string
}

export function YearSelector({ 
  selectedYear, 
  onYearChange, 
  availableYears,
  className 
}: YearSelectorProps) {
  // Generate default years if not provided
  const currentYear = new Date().getFullYear()
  const defaultYears = availableYears || Array.from(
    { length: currentYear - 2020 + 1 }, 
    (_, i) => currentYear - i
  )

  const handleSelectionChange = (keys: any) => {
    const year = Array.from(keys)[0] as string
    if (year) {
      onYearChange(parseInt(year, 10))
    }
  }

  return (
    <Select
      label="年度を選択"
      placeholder="年度を選択してください"
      selectedKeys={[selectedYear.toString()]}
      onSelectionChange={handleSelectionChange}
      startContent={<CalendarIcon className="w-4 h-4" />}
      className={className}
      variant="bordered"
    >
      {defaultYears.map((year) => (
        <SelectItem key={year.toString()} value={year.toString()}>
          {year}年
        </SelectItem>
      ))}
    </Select>
  )
}