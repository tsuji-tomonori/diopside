'use client'

import { Select, SelectItem, SelectProps } from '@heroui/react'

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

  const handleSelectionChange: SelectProps['onSelectionChange'] = (
    keys: 'all' | (Set<React.Key> & { anchorKey?: string; currentKey?: string })
  ) => {
    if (keys !== 'all') {
      // この時点で keys は Set<string> 相当
      const year = Array.from(keys as Set<string>)[0];
      if (year) {
        onYearChange(parseInt(year, 10));
      }
    }
  };

  return (
    <Select
      label="年度を選択"
      placeholder="年度を選択してください"
      selectedKeys={[selectedYear.toString()]}
      onSelectionChange={handleSelectionChange}
      className={className}
      variant="bordered"
      size="lg"
      labelPlacement="outside"
      classNames={{
        trigger: "h-14 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer",
        listbox: "max-h-[300px]",
        popoverContent: "bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700",
        value: "text-lg font-bold text-purple-700 dark:text-purple-300",
        label: "text-base font-medium text-gray-700 dark:text-gray-300 mb-2",
        mainWrapper: "block",
        innerWrapper: "w-full"
      }}
      popoverProps={{
        placement: "bottom-start",
        offset: 5,
        className: "z-50"
      }}
    >
      {defaultYears.map((year) => (
        <SelectItem
          key={year.toString()}
          className={`data-[hover=true]:bg-purple-100 dark:data-[hover=true]:bg-purple-900/30 ${year === selectedYear ? 'bg-purple-100 dark:bg-purple-900/30 font-bold text-purple-700 dark:text-purple-300' : ''
            }`}
        >
          {year}年
        </SelectItem>
      ))
      }
    </Select >
  )
}
