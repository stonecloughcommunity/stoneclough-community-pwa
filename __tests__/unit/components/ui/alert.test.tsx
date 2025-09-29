import { render, screen } from '@/__tests__/utils/test-utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

describe('Alert Components', () => {
  describe('Alert', () => {
    it('renders correctly with default variant', () => {
      render(<Alert>Alert content</Alert>)
      
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveClass(
        'relative',
        'w-full',
        'rounded-lg',
        'border',
        'px-4',
        'py-3',
        'text-sm'
      )
    })

    it('applies destructive variant correctly', () => {
      render(<Alert variant="destructive">Destructive alert</Alert>)
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('border-destructive/50', 'text-destructive')
    })

    it('applies custom className', () => {
      render(<Alert className="custom-alert">Custom alert</Alert>)
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('custom-alert')
    })

    it('forwards ref correctly', () => {
      const ref = jest.fn()
      render(<Alert ref={ref}>Alert with ref</Alert>)
      
      expect(ref).toHaveBeenCalled()
    })

    it('spreads additional props', () => {
      render(<Alert data-testid="custom-alert">Alert with props</Alert>)
      
      const alert = screen.getByTestId('custom-alert')
      expect(alert).toBeInTheDocument()
    })
  })

  describe('AlertTitle', () => {
    it('renders correctly', () => {
      render(
        <Alert>
          <AlertTitle>Alert Title</AlertTitle>
        </Alert>
      )
      
      const title = screen.getByText('Alert Title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight')
    })

    it('applies custom className', () => {
      render(
        <Alert>
          <AlertTitle className="custom-title">Custom Title</AlertTitle>
        </Alert>
      )
      
      const title = screen.getByText('Custom Title')
      expect(title).toHaveClass('custom-title')
    })

    it('forwards ref correctly', () => {
      const ref = jest.fn()
      render(
        <Alert>
          <AlertTitle ref={ref}>Title with ref</AlertTitle>
        </Alert>
      )
      
      expect(ref).toHaveBeenCalled()
    })
  })

  describe('AlertDescription', () => {
    it('renders correctly', () => {
      render(
        <Alert>
          <AlertDescription>Alert description</AlertDescription>
        </Alert>
      )
      
      const description = screen.getByText('Alert description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-sm', '[&_p]:leading-relaxed')
    })

    it('applies custom className', () => {
      render(
        <Alert>
          <AlertDescription className="custom-desc">Custom description</AlertDescription>
        </Alert>
      )
      
      const description = screen.getByText('Custom description')
      expect(description).toHaveClass('custom-desc')
    })

    it('forwards ref correctly', () => {
      const ref = jest.fn()
      render(
        <Alert>
          <AlertDescription ref={ref}>Description with ref</AlertDescription>
        </Alert>
      )
      
      expect(ref).toHaveBeenCalled()
    })
  })

  describe('Complete Alert', () => {
    it('renders all components together', () => {
      render(
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong</AlertDescription>
        </Alert>
      )
      
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('works with destructive variant', () => {
      render(
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Critical Error</AlertTitle>
          <AlertDescription>This is a critical error message</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('border-destructive/50', 'text-destructive')
      expect(screen.getByText('Critical Error')).toBeInTheDocument()
      expect(screen.getByText('This is a critical error message')).toBeInTheDocument()
    })

    it('maintains proper structure', () => {
      render(
        <Alert data-testid="alert">
          <AlertTitle data-testid="title">Title</AlertTitle>
          <AlertDescription data-testid="description">Description</AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByTestId('alert')
      const title = screen.getByTestId('title')
      const description = screen.getByTestId('description')
      
      expect(alert).toContainElement(title)
      expect(alert).toContainElement(description)
    })

    it('works without title', () => {
      render(
        <Alert>
          <AlertDescription>Just a description</AlertDescription>
        </Alert>
      )
      
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Just a description')).toBeInTheDocument()
    })

    it('works without description', () => {
      render(
        <Alert>
          <AlertTitle>Just a title</AlertTitle>
        </Alert>
      )
      
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Just a title')).toBeInTheDocument()
    })
  })
})
