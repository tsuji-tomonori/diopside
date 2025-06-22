import { render } from '@testing-library/react'
import VideoDetailSkeleton from '../VideoDetailSkeleton'

describe('VideoDetailSkeleton', () => {
  it('renders skeleton elements correctly', () => {
    render(<VideoDetailSkeleton />)

    // Check if skeleton elements are present
    const skeletonElements = document.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('renders back button skeleton', () => {
    render(<VideoDetailSkeleton />)

    // The first skeleton element should be the back button skeleton
    const backButtonSkeleton = document.querySelector('.w-20.h-10')
    expect(backButtonSkeleton).toBeInTheDocument()
  })

  it('renders thumbnail skeleton', () => {
    render(<VideoDetailSkeleton />)

    // Thumbnail skeleton should have specific dimensions
    const thumbnailSkeleton = document.querySelector('.h-64.md\\:h-80')
    expect(thumbnailSkeleton).toBeInTheDocument()
  })

  it('renders title skeleton with multiple lines', () => {
    render(<VideoDetailSkeleton />)

    // Should have multiple skeleton lines for title
    const titleSkeletons = document.querySelectorAll('.h-8, .h-6')
    expect(titleSkeletons.length).toBeGreaterThan(1)
  })

  it('renders metadata skeleton elements', () => {
    render(<VideoDetailSkeleton />)

    // Should have skeleton elements for metadata
    const metadataSkeletons = document.querySelectorAll('.h-4')
    expect(metadataSkeletons.length).toBeGreaterThan(2)
  })

  it('renders tags skeleton', () => {
    render(<VideoDetailSkeleton />)

    // Should have skeleton elements for tags
    const tagSkeletons = document.querySelectorAll('.h-6')
    expect(tagSkeletons.length).toBeGreaterThan(0)
  })

  it('renders YouTube button skeleton', () => {
    render(<VideoDetailSkeleton />)

    // Should have skeleton for YouTube button
    const buttonSkeleton = document.querySelector('.h-12')
    expect(buttonSkeleton).toBeInTheDocument()
  })

  it('has proper responsive layout classes', () => {
    render(<VideoDetailSkeleton />)

    // Check for responsive classes
    const responsiveElements = document.querySelectorAll('.md\\:flex, .md\\:w-1\\/2')
    expect(responsiveElements.length).toBeGreaterThan(0)
  })

  it('applies correct styling classes', () => {
    render(<VideoDetailSkeleton />)

    // Should have background and styling classes
    const backgroundElements = document.querySelectorAll('.bg-gray-50, .bg-white, .bg-gray-200')
    expect(backgroundElements.length).toBeGreaterThan(0)
  })
})
