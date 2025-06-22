import { renderHook } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { useVideo } from '../useApi'
import { ApiClient } from '@/lib/api'
import { useConfig } from '@/contexts/ConfigContext'

// Mock the dependencies
jest.mock('@/lib/api', () => ({
  ApiClient: {
    getVideoById: jest.fn(),
  },
}))

jest.mock('@/contexts/ConfigContext', () => ({
  useConfig: jest.fn(),
}))

// Mock framer-motion to avoid dynamic import issues
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))


// SWR wrapper for testing
const createWrapper = () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
      {children}
    </SWRConfig>
  )
  TestWrapper.displayName = 'TestWrapper'
  return TestWrapper
}

describe('useVideo hook', () => {
  const mockConfig = {
    NEXT_PUBLIC_API_URL: 'https://api.example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
      ; (useConfig as jest.Mock).mockReturnValue({
        config: mockConfig,
        isLoading: false,
      })
  })

  it('has basic hook structure', () => {
    const { result } = renderHook(
      () => useVideo('test-video-123'),
      { wrapper: createWrapper() }
    )

    // Should have a result object with expected properties
    expect(result.current).toBeDefined()
    expect(typeof result.current.isLoading).toBe('boolean')
    expect('data' in result.current).toBe(true)
    expect('error' in result.current).toBe(true)
  })

  it('does not fetch when config is loading', () => {
    ; (useConfig as jest.Mock).mockReturnValue({
      config: null,
      isLoading: true,
    })

    const { result } = renderHook(
      () => useVideo('test-video-123'),
      { wrapper: createWrapper() }
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(ApiClient.getVideoById).not.toHaveBeenCalled()
  })

  it('does not fetch when videoId is empty', () => {
    const { result } = renderHook(
      () => useVideo(''),
      { wrapper: createWrapper() }
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(ApiClient.getVideoById).not.toHaveBeenCalled()
  })
})
