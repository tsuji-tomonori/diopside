import '@testing-library/jest-dom'

// Mock framer-motion to avoid dynamic import issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { Component = 'div' } = props
      return { $$typeof: Symbol.for('react.element'), type: Component, props: { ...props, children } }
    },
    span: ({ children, ...props }) => {
      return { $$typeof: Symbol.for('react.element'), type: 'span', props: { ...props, children } }
    },
    button: ({ children, ...props }) => {
      return { $$typeof: Symbol.for('react.element'), type: 'button', props: { ...props, children } }
    },
    a: ({ children, ...props }) => {
      return { $$typeof: Symbol.for('react.element'), type: 'a', props: { ...props, children } }
    }
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({}),
  useMotionValue: () => ({ set: jest.fn() }),
  useTransform: () => ({ set: jest.fn() }),
  useSpring: () => ({ set: jest.fn() }),
  useInView: () => [null, true],
  useAnimationControls: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn()
  })
}))

// Mock Hero UI components that use framer-motion
jest.mock('@heroui/ripple', () => ({
  Ripple: ({ children }) => children,
  useRipple: () => ({
    ripples: [],
    onClick: jest.fn(),
    onClear: jest.fn(),
    onRipplePressHandler: jest.fn(),
    rippleProps: {
      ripples: [],
      onClear: jest.fn()
    }
  })
}))
