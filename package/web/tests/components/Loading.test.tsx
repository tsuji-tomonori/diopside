import { render, screen } from '@testing-library/react'
import { Loading } from '@/components/common/Loading'

// Mock HeroUI components
jest.mock('@heroui/react', () => ({
  Spinner: ({ size, color, ...props }: any) => (
    <div data-testid="spinner" data-size={size} data-color={color} {...props} />
  ),
}))

describe('Loading', () => {
  it('renders with default props', () => {
    render(<Loading />)

    expect(screen.getByTestId('spinner')).toBeInTheDocument()
    expect(screen.getByTestId('spinner')).toHaveAttribute('data-size', 'md')
    expect(screen.getByTestId('spinner')).toHaveAttribute('data-color', 'secondary')
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    render(<Loading size="lg" />)

    expect(screen.getByTestId('spinner')).toHaveAttribute('data-size', 'lg')
  })

  it('renders with custom label', () => {
    render(<Loading label="カスタムメッセージ" />)

    expect(screen.getByText('カスタムメッセージ')).toBeInTheDocument()
    expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument()
  })

  it('renders without label when empty string provided', () => {
    render(<Loading label="" />)

    expect(screen.getByTestId('spinner')).toBeInTheDocument()
    expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Loading className="custom-loading-class" />)

    const container = screen.getByTestId('spinner').parentElement
    expect(container).toHaveClass('custom-loading-class')
  })

  it('renders all size variants correctly', () => {
    const { rerender } = render(<Loading size="sm" />)
    expect(screen.getByTestId('spinner')).toHaveAttribute('data-size', 'sm')

    rerender(<Loading size="md" />)
    expect(screen.getByTestId('spinner')).toHaveAttribute('data-size', 'md')

    rerender(<Loading size="lg" />)
    expect(screen.getByTestId('spinner')).toHaveAttribute('data-size', 'lg')
  })
})