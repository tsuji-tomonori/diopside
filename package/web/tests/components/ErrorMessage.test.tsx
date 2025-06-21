import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorMessage } from '@/components/common/ErrorMessage'

// Mock HeroUI components
jest.mock('@heroui/react', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="error-card" {...props}>
      {children}
    </div>
  ),
  CardBody: ({ children, ...props }: any) => (
    <div data-testid="error-card-body" {...props}>
      {children}
    </div>
  ),
  Button: ({ children, onPress, ...props }: any) => (
    <button data-testid="retry-button" onClick={onPress} {...props}>
      {children}
    </button>
  ),
}))

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ExclamationTriangleIcon: (props: any) => (
    <div data-testid="exclamation-icon" {...props} />
  ),
}))

describe('ErrorMessage', () => {
  it('renders with default title and custom message', () => {
    render(<ErrorMessage message="テストエラーメッセージ" />)

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
    expect(screen.getByText('テストエラーメッセージ')).toBeInTheDocument()
    expect(screen.getByTestId('exclamation-icon')).toBeInTheDocument()
  })

  it('renders with custom title', () => {
    render(
      <ErrorMessage
        title="カスタムエラータイトル"
        message="テストメッセージ"
      />
    )

    expect(screen.getByText('カスタムエラータイトル')).toBeInTheDocument()
    expect(screen.getByText('テストメッセージ')).toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', () => {
    const mockOnRetry = jest.fn()
    render(
      <ErrorMessage
        message="テストメッセージ"
        onRetry={mockOnRetry}
      />
    )

    const retryButton = screen.getByTestId('retry-button')
    expect(retryButton).toBeInTheDocument()
    expect(retryButton).toHaveTextContent('再試行')
  })

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="テストメッセージ" />)

    expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', () => {
    const mockOnRetry = jest.fn()
    render(
      <ErrorMessage
        message="テストメッセージ"
        onRetry={mockOnRetry}
      />
    )

    fireEvent.click(screen.getByTestId('retry-button'))

    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(
      <ErrorMessage
        message="テストメッセージ"
        className="custom-error-class"
      />
    )

    expect(screen.getByTestId('error-card')).toHaveClass('custom-error-class')
  })

  it('renders all required elements in correct structure', () => {
    render(
      <ErrorMessage
        title="テストタイトル"
        message="テストメッセージ"
        onRetry={() => {}}
      />
    )

    // Check that all elements are present
    expect(screen.getByTestId('error-card')).toBeInTheDocument()
    expect(screen.getByTestId('error-card-body')).toBeInTheDocument()
    expect(screen.getByTestId('exclamation-icon')).toBeInTheDocument()
    expect(screen.getByText('テストタイトル')).toBeInTheDocument()
    expect(screen.getByText('テストメッセージ')).toBeInTheDocument()
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
  })

  it('handles empty message gracefully', () => {
    render(<ErrorMessage message="" />)

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
    expect(screen.getByTestId('exclamation-icon')).toBeInTheDocument()
  })

  it('handles long error messages', () => {
    const longMessage = 'これは非常に長いエラーメッセージです。'.repeat(10)
    render(<ErrorMessage message={longMessage} />)

    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })
})
