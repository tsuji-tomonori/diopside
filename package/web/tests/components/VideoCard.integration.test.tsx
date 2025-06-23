/**
 * Integration test for VideoCard component
 * Tests the actual implementation without mocking Hero UI components
 * This test would fail before the fix and pass after the fix
 */

import { render, screen } from '@testing-library/react'
import { VideoCard } from '@/components/video/VideoCard'
import type { Video } from '@/types/api'

// DO NOT mock Hero UI components - we want to test the actual implementation

describe('VideoCard Integration Tests (Fix Verification)', () => {
  const mockVideo: Video = {
    video_id: 'test123',
    title: 'Test Video Title',
    tags: ['tag1', 'tag2'],
    year: 2024,
    thumbnail_url: 'https://img.youtube.com/vi/test123/maxresdefault.jpg',
    created_at: '2024-01-15T10:30:00Z',
  }

  describe('Image rendering implementation', () => {
    it('should render HTML img element instead of Hero UI Image component', () => {
      render(<VideoCard video={mockVideo} />)

      // After fix: should find HTML img element
      const imgElement = screen.getByRole('img')
      expect(imgElement).toBeInTheDocument()
      expect(imgElement.tagName).toBe('IMG') // Ensures it's a native HTML img element
    })

    it('should have loading="lazy" attribute on img element', () => {
      render(<VideoCard video={mockVideo} />)

      // After fix: HTML img should have loading="lazy"
      // Before fix: Hero UI Image component wouldn't have this attribute
      const imgElement = screen.getByRole('img')
      expect(imgElement).toHaveAttribute('loading', 'lazy')
    })

    it('should NOT have radius attribute (Hero UI specific)', () => {
      render(<VideoCard video={mockVideo} />)

      // After fix: HTML img doesn't support radius attribute
      // Before fix: Hero UI Image would have radius="none"
      const imgElement = screen.getByRole('img')
      expect(imgElement).not.toHaveAttribute('radius')
    })

    it('should have correct src and alt attributes', () => {
      render(<VideoCard video={mockVideo} />)

      const imgElement = screen.getByRole('img')
      expect(imgElement).toHaveAttribute('src', mockVideo.thumbnail_url)
      expect(imgElement).toHaveAttribute('alt', mockVideo.title)
    })

    it('should have object-cover class for proper image styling', () => {
      render(<VideoCard video={mockVideo} />)

      const imgElement = screen.getByRole('img')
      expect(imgElement).toHaveClass('object-cover')
      expect(imgElement).toHaveClass('w-full')
      expect(imgElement).toHaveClass('h-48')
    })
  })

  describe('Fallback behavior when thumbnail_url is not provided', () => {
    it('should not render any img element when thumbnail_url is undefined', () => {
      const videoWithoutThumbnail = { ...mockVideo, thumbnail_url: undefined }
      render(<VideoCard video={videoWithoutThumbnail} />)

      // Should not find any img element
      expect(screen.queryByRole('img')).not.toBeInTheDocument()

      // Should find the fallback div with gradient background
      const fallbackDiv = screen.getByText('Te') // First 2 characters of title
      expect(fallbackDiv).toBeInTheDocument()
    })

    it('should not render any img element when thumbnail_url is empty string', () => {
      const videoWithEmptyThumbnail = { ...mockVideo, thumbnail_url: '' }
      render(<VideoCard video={videoWithEmptyThumbnail} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  describe('Performance attributes', () => {
    it('should have loading="lazy" for better performance', () => {
      render(<VideoCard video={mockVideo} />)

      const imgElement = screen.getByRole('img')
      expect(imgElement).toHaveAttribute('loading', 'lazy')
    })

    it('should not have any Next.js Image specific attributes', () => {
      render(<VideoCard video={mockVideo} />)

      const imgElement = screen.getByRole('img')

      // These are Next.js Image specific attributes that should not be present
      expect(imgElement).not.toHaveAttribute('priority')
      expect(imgElement).not.toHaveAttribute('placeholder')
      expect(imgElement).not.toHaveAttribute('blurDataURL')
      expect(imgElement).not.toHaveAttribute('unoptimized')
    })
  })

  describe('Static export compatibility', () => {
    it('should use regular img element that works with static export', () => {
      render(<VideoCard video={mockVideo} />)

      const imgElement = screen.getByRole('img')

      // Verify it's a regular HTML img element, not a Next.js Image
      expect(imgElement.tagName).toBe('IMG')

      // Should have the YouTube thumbnail URL directly
      expect(imgElement.getAttribute('src')).toBe(mockVideo.thumbnail_url)

      // Should not have any data-nimg attributes (Next.js Image specific)
      expect(imgElement).not.toHaveAttribute('data-nimg')
    })

    it('should handle external URLs correctly', () => {
      const videoWithExternalUrl = {
        ...mockVideo,
        thumbnail_url: 'https://external-cdn.example.com/thumbnail.jpg'
      }
      render(<VideoCard video={videoWithExternalUrl} />)

      const imgElement = screen.getByRole('img')
      expect(imgElement.getAttribute('src')).toBe(videoWithExternalUrl.thumbnail_url)
    })
  })
})

/**
 * Test cases that would specifically fail BEFORE the fix:
 *
 * 1. 'should have loading="lazy" attribute' - Would fail because Hero UI Image doesn't have this attribute
 * 2. 'should NOT have radius attribute' - Would fail because Hero UI Image would have radius="none"
 * 3. 'should use regular img element' - Would fail because Hero UI Image renders different elements
 * 4. 'should not have data-nimg attributes' - Would fail if using Next.js Image component
 *
 * These tests verify that we're using plain HTML img elements with appropriate attributes
 * for static export mode, which is essential for proper image display in production.
 */
