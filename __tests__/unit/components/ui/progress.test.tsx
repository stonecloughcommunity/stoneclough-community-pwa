import { render, screen } from '@/__tests__/utils/test-utils'
import { Progress } from '@/components/ui/progress'

describe('Progress Component', () => {
  it('renders correctly with default props', () => {
    render(<Progress />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toBeInTheDocument()
    expect(progressbar).toHaveClass(
      'relative',
      'h-2',
      'w-full',
      'overflow-hidden',
      'rounded-full',
      'bg-primary/20'
    )
  })

  it('displays correct value', () => {
    render(<Progress value={50} />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '50')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '100')
  })

  it('handles zero value', () => {
    render(<Progress value={0} />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '0')
  })

  it('handles maximum value', () => {
    render(<Progress value={100} />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '100')
  })

  it('handles undefined value', () => {
    render(<Progress value={undefined} />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).not.toHaveAttribute('aria-valuenow')
  })

  it('applies custom className', () => {
    render(<Progress className="custom-progress" />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveClass('custom-progress')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Progress ref={ref} />)
    
    expect(ref).toHaveBeenCalled()
  })

  it('spreads additional props', () => {
    render(<Progress data-testid="custom-progress" />)
    
    const progressbar = screen.getByTestId('custom-progress')
    expect(progressbar).toBeInTheDocument()
  })

  it('renders progress indicator with correct width', () => {
    render(<Progress value={75} data-testid="progress" />)
    
    const progressbar = screen.getByTestId('progress')
    const indicator = progressbar.querySelector('[data-state="loading"]')
    
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveStyle('transform: translateX(-25%)')
  })

  it('handles indeterminate state', () => {
    render(<Progress data-testid="progress" />)
    
    const progressbar = screen.getByTestId('progress')
    const indicator = progressbar.querySelector('[data-state="indeterminate"]')
    
    expect(indicator).toBeInTheDocument()
  })

  it('supports custom max value', () => {
    render(<Progress value={50} max={200} />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '50')
    expect(progressbar).toHaveAttribute('aria-valuemax', '200')
  })

  it('calculates percentage correctly with custom max', () => {
    render(<Progress value={50} max={200} data-testid="progress" />)
    
    const progressbar = screen.getByTestId('progress')
    const indicator = progressbar.querySelector('[data-state="loading"]')
    
    // 50 out of 200 is 25%, so translateX should be -75%
    expect(indicator).toHaveStyle('transform: translateX(-75%)')
  })

  it('handles edge cases gracefully', () => {
    render(<Progress value={-10} />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '-10')
  })

  it('handles values over 100', () => {
    render(<Progress value={150} />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '150')
  })

  it('maintains accessibility attributes', () => {
    render(
      <Progress 
        value={60} 
        aria-label="Loading progress"
        aria-describedby="progress-description"
      />
    )
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-label', 'Loading progress')
    expect(progressbar).toHaveAttribute('aria-describedby', 'progress-description')
  })

  describe('Visual states', () => {
    it('shows complete state at 100%', () => {
      render(<Progress value={100} data-testid="progress" />)
      
      const progressbar = screen.getByTestId('progress')
      const indicator = progressbar.querySelector('[data-state="complete"]')
      
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveStyle('transform: translateX(0%)')
    })

    it('shows loading state for partial values', () => {
      render(<Progress value={33} data-testid="progress" />)
      
      const progressbar = screen.getByTestId('progress')
      const indicator = progressbar.querySelector('[data-state="loading"]')
      
      expect(indicator).toBeInTheDocument()
    })
  })
})
