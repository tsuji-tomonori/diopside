import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import VideoNotFound from '../VideoNotFound'

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock Hero UI components
jest.mock('@heroui/react', () => ({
  Button: ({ children, onPress, startContent, ...props }: {
    children: React.ReactNode;
    onPress?: () => void;
    startContent?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <button onClick={onPress} {...props}>
      {startContent}
      {children}
    </button>
  ),
}))

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
}

describe('VideoNotFound', () => {
  beforeEach(() => {
    jest.clearAllMocks()
      ; (useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('renders error message correctly', () => {
    render(<VideoNotFound />)

    expect(screen.getByText('動画が見つかりません')).toBeInTheDocument()
    expect(screen.getByText('指定された動画は存在しないか、削除された可能性があります。')).toBeInTheDocument()
  })

  it('renders error icon', () => {
    render(<VideoNotFound />)

    // Check for the exclamation triangle icon
    const icon = document.querySelector('.w-16.h-16')
    expect(icon).toBeInTheDocument()
  })

  it('renders back button', () => {
    render(<VideoNotFound />)

    const backButton = screen.getByText('戻る')
    expect(backButton).toBeInTheDocument()
  })

  it('renders home page link', () => {
    render(<VideoNotFound />)

    const homeLink = screen.getByText('トップページに戻る')
    expect(homeLink).toBeInTheDocument()
  })

  it('navigates back when back button is clicked with history', () => {
    // Mock window.history.length to simulate having history
    Object.defineProperty(window, 'history', {
      value: { length: 3 },
      writable: true,
    })

    render(<VideoNotFound />)

    const backButton = screen.getByText('戻る')
    fireEvent.click(backButton)

    expect(mockRouter.back).toHaveBeenCalled()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('navigates to home when back button is clicked without history', () => {
    // Mock window.history.length to simulate direct access
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true,
    })

    render(<VideoNotFound />)

    const backButton = screen.getByText('戻る')
    fireEvent.click(backButton)

    expect(mockRouter.push).toHaveBeenCalledWith('/')
    expect(mockRouter.back).not.toHaveBeenCalled()
  })

  it('navigates to home when home link is clicked', () => {
    render(<VideoNotFound />)

    const homeLink = screen.getByText('トップページに戻る')
    fireEvent.click(homeLink)

    expect(mockRouter.push).toHaveBeenCalledWith('/')
  })

  it('has proper styling and layout', () => {
    render(<VideoNotFound />)

    // Check for main container classes
    const container = document.querySelector('.min-h-screen.bg-gray-50')
    expect(container).toBeInTheDocument()

    // Check for centered layout
    const centerContainer = document.querySelector('.flex.items-center.justify-center')
    expect(centerContainer).toBeInTheDocument()
  })

  it('has accessible button elements', () => {
    render(<VideoNotFound />)

    const backButton = screen.getByText('戻る')
    const homeLink = screen.getByText('トップページに戻る')

    // Buttons should be accessible
    expect(backButton).toBeEnabled()
    expect(homeLink).toBeEnabled()
  })

  it('displays appropriate button variants', () => {
    render(<VideoNotFound />)

    // Back button should have primary styling
    const backButton = screen.getByText('戻る')
    expect(backButton.closest('button')).toBeInTheDocument()

    // Home link should have light variant styling
    const homeLink = screen.getByText('トップページに戻る')
    expect(homeLink.closest('button')).toBeInTheDocument()
  })
})
