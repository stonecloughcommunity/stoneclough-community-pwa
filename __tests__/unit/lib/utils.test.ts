import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      const result = cn('px-2 py-1', 'bg-blue-500')
      expect(result).toBe('px-2 py-1 bg-blue-500')
    })

    it('handles conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toBe('base-class active-class')
    })

    it('handles false conditional classes', () => {
      const isActive = false
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toBe('base-class')
    })

    it('handles undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'other-class')
      expect(result).toBe('base-class other-class')
    })

    it('merges conflicting Tailwind classes correctly', () => {
      const result = cn('px-2', 'px-4')
      expect(result).toBe('px-4')
    })

    it('handles arrays of classes', () => {
      const result = cn(['px-2', 'py-1'], 'bg-blue-500')
      expect(result).toBe('px-2 py-1 bg-blue-500')
    })

    it('handles objects with boolean values', () => {
      const result = cn({
        'base-class': true,
        'active-class': true,
        'inactive-class': false,
      })
      expect(result).toBe('base-class active-class')
    })

    it('handles empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('handles complex combinations', () => {
      const isActive = true
      const variant = 'primary'
      const result = cn(
        'base-class',
        {
          'active-class': isActive,
          'inactive-class': !isActive,
        },
        variant === 'primary' && 'primary-class',
        ['additional', 'classes']
      )
      expect(result).toBe('base-class active-class primary-class additional classes')
    })
  })
})
