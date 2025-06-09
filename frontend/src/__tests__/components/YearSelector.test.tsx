import { render, screen, fireEvent } from '@testing-library/react'
import { YearSelector } from '@/components/year/YearSelector'

// Mock HeroUI components
jest.mock('@heroui/react', () => ({
  Select: ({ children, selectedKeys, onSelectionChange, label, placeholder, ...props }: any) => (
    <div data-testid="year-select" {...props}>
      <label>{label}</label>
      <select
        data-testid="year-select-input"
        value={Array.from(selectedKeys)[0] || ''}
        onChange={(e) => onSelectionChange(new Set([e.target.value]))}
        placeholder={placeholder}
      >
        {children}
      </select>
    </div>
  ),
  SelectItem: ({ children, value, ...props }: any) => (
    <option value={value} {...props}>
      {children}
    </option>
  ),
}))

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  CalendarIcon: (props: any) => (
    <div data-testid="calendar-icon" {...props} />
  ),
}))

describe('YearSelector', () => {
  const mockOnYearChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock current year to be consistent in tests
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders with default years when no availableYears provided', () => {
    render(
      <YearSelector 
        selectedYear={2024} 
        onYearChange={mockOnYearChange} 
      />
    )

    expect(screen.getByText('年度を選択')).toBeInTheDocument()
    expect(screen.getByTestId('year-select-input')).toHaveValue('2024')
  })

  it('renders with custom available years', () => {
    const availableYears = [2022, 2023, 2024]
    render(
      <YearSelector 
        selectedYear={2023} 
        onYearChange={mockOnYearChange}
        availableYears={availableYears}
      />
    )

    expect(screen.getByTestId('year-select-input')).toHaveValue('2023')
    
    // Check that options are rendered
    expect(screen.getByText('2022年')).toBeInTheDocument()
    expect(screen.getByText('2023年')).toBeInTheDocument()
    expect(screen.getByText('2024年')).toBeInTheDocument()
  })

  it('calls onYearChange when selection changes', () => {
    render(
      <YearSelector 
        selectedYear={2024} 
        onYearChange={mockOnYearChange} 
      />
    )

    const selectInput = screen.getByTestId('year-select-input')
    fireEvent.change(selectInput, { target: { value: '2023' } })

    expect(mockOnYearChange).toHaveBeenCalledWith(2023)
  })

  it('applies custom className', () => {
    render(
      <YearSelector 
        selectedYear={2024} 
        onYearChange={mockOnYearChange}
        className="custom-year-selector"
      />
    )

    expect(screen.getByTestId('year-select')).toHaveClass('custom-year-selector')
  })

  it('generates correct default year range', () => {
    // Mock current year as 2024
    render(
      <YearSelector 
        selectedYear={2024} 
        onYearChange={mockOnYearChange} 
      />
    )

    // Should generate years from 2024 down to 2020 (5 years)
    expect(screen.getByText('2024年')).toBeInTheDocument()
    expect(screen.getByText('2023年')).toBeInTheDocument()
    expect(screen.getByText('2022年')).toBeInTheDocument()
    expect(screen.getByText('2021年')).toBeInTheDocument()
    expect(screen.getByText('2020年')).toBeInTheDocument()
  })

  it('handles year selection with string conversion', () => {
    render(
      <YearSelector 
        selectedYear={2024} 
        onYearChange={mockOnYearChange} 
      />
    )

    const selectInput = screen.getByTestId('year-select-input')
    fireEvent.change(selectInput, { target: { value: '2022' } })

    expect(mockOnYearChange).toHaveBeenCalledWith(2022)
    expect(typeof mockOnYearChange.mock.calls[0][0]).toBe('number')
  })

  it('displays correct selected year', () => {
    const { rerender } = render(
      <YearSelector 
        selectedYear={2023} 
        onYearChange={mockOnYearChange} 
      />
    )

    expect(screen.getByTestId('year-select-input')).toHaveValue('2023')

    rerender(
      <YearSelector 
        selectedYear={2022} 
        onYearChange={mockOnYearChange} 
      />
    )

    expect(screen.getByTestId('year-select-input')).toHaveValue('2022')
  })

  it('handles empty selection gracefully', () => {
    render(
      <YearSelector 
        selectedYear={2024} 
        onYearChange={mockOnYearChange} 
      />
    )

    const selectInput = screen.getByTestId('year-select-input')
    fireEvent.change(selectInput, { target: { value: '' } })

    // Should not call onYearChange with invalid value
    expect(mockOnYearChange).not.toHaveBeenCalled()
  })

  it('renders label correctly', () => {
    render(
      <YearSelector 
        selectedYear={2024} 
        onYearChange={mockOnYearChange} 
      />
    )

    expect(screen.getByText('年度を選択')).toBeInTheDocument()
  })
})