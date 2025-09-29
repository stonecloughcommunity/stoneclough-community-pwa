import { render, screen } from '@/__tests__/utils/test-utils'
import { Badge } from '@/components/ui/badge'

describe('Badge Component', () => {
  it('renders correctly with default variant', () => {
    render(<Badge>Default badge</Badge>)

    const badge = screen.getByText('Default badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded-md',
      'border',
      'px-2',
      'py-0.5',
      'text-xs',
      'font-medium',
      'border-transparent',
      'bg-primary',
      'text-primary-foreground'
    )
  })

  it('applies secondary variant correctly', () => {
    render(<Badge variant="secondary">Secondary badge</Badge>)
    
    const badge = screen.getByText('Secondary badge')
    expect(badge).toHaveClass('border-transparent', 'bg-secondary', 'text-secondary-foreground')
  })

  it('applies destructive variant correctly', () => {
    render(<Badge variant="destructive">Destructive badge</Badge>)

    const badge = screen.getByText('Destructive badge')
    expect(badge).toHaveClass('border-transparent', 'bg-destructive', 'text-white')
  })

  it('applies outline variant correctly', () => {
    render(<Badge variant="outline">Outline badge</Badge>)
    
    const badge = screen.getByText('Outline badge')
    expect(badge).toHaveClass('text-foreground')
  })

  it('applies custom className', () => {
    render(<Badge className="custom-badge">Custom badge</Badge>)
    
    const badge = screen.getByText('Custom badge')
    expect(badge).toHaveClass('custom-badge')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Badge ref={ref}>Badge with ref</Badge>)
    
    expect(ref).toHaveBeenCalled()
  })

  it('spreads additional props', () => {
    render(<Badge data-testid="custom-badge">Badge with props</Badge>)
    
    const badge = screen.getByTestId('custom-badge')
    expect(badge).toBeInTheDocument()
  })

  it('can be used as a button', () => {
    const handleClick = jest.fn()
    render(
      <Badge asChild>
        <button onClick={handleClick}>Clickable badge</button>
      </Badge>
    )

    const badge = screen.getByRole('button', { name: 'Clickable badge' })
    expect(badge).toBeInTheDocument()

    badge.click()
    expect(handleClick).toHaveBeenCalled()
  })

  it('supports different HTML elements', () => {
    render(
      <Badge asChild>
        <a href="/test">Link badge</a>
      </Badge>
    )

    const badge = screen.getByRole('link', { name: 'Link badge' })
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('href', '/test')
  })

  it('handles empty content', () => {
    render(<Badge data-testid="empty-badge"></Badge>)

    const badge = screen.getByTestId('empty-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toBeEmptyDOMElement()
  })

  it('handles complex content', () => {
    render(
      <Badge data-testid="complex-badge">
        <span>Complex</span> badge
      </Badge>
    )

    const badge = screen.getByTestId('complex-badge')
    expect(badge).toBeInTheDocument()
    expect(screen.getByText('Complex')).toBeInTheDocument()
    expect(badge).toHaveTextContent('Complex badge')
  })

  it('maintains accessibility', () => {
    render(<Badge role="status" aria-label="Status badge">Active</Badge>)
    
    const badge = screen.getByRole('status')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('aria-label', 'Status badge')
  })

  describe('All variants', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline'] as const

    variants.forEach((variant) => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Badge variant={variant}>{variant} badge</Badge>)
        
        const badge = screen.getByText(`${variant} badge`)
        expect(badge).toBeInTheDocument()
        
        // All variants should have base classes
        expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-md')
      })
    })
  })
})
