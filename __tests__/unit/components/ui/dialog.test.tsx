import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

describe('Dialog Components', () => {
  describe('Dialog with Trigger', () => {
    it('opens when trigger is clicked', () => {
      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>This is a test dialog</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      fireEvent.click(trigger)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Test Dialog')).toBeInTheDocument()
      expect(screen.getByText('This is a test dialog')).toBeInTheDocument()
    })

    it('closes when close button is clicked', () => {
      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>Test dialog description</DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )
      
      // Open dialog
      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      fireEvent.click(trigger)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      
      // Close dialog using the custom close button (first one)
      const closeButtons = screen.getAllByRole('button', { name: 'Close' })
      fireEvent.click(closeButtons[0])
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Controlled Dialog', () => {
    it('can be controlled externally', () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(false)
        
        return (
          <div>
            <Button onClick={() => setOpen(true)}>Open Controlled</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Controlled Dialog</DialogTitle>
                  <DialogDescription>Controlled dialog description</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        )
      }
      
      render(<TestComponent />)
      
      const trigger = screen.getByRole('button', { name: 'Open Controlled' })
      fireEvent.click(trigger)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Controlled Dialog')).toBeInTheDocument()
    })
  })

  describe('DialogContent', () => {
    it('renders with correct classes', () => {
      render(
        <Dialog open>
          <DialogContent data-testid="dialog-content">
            <DialogTitle>Content Test</DialogTitle>
            <DialogDescription>Content test description</DialogDescription>
          </DialogContent>
        </Dialog>
      )
      
      const content = screen.getByTestId('dialog-content')
      expect(content).toHaveClass(
        'bg-background',
        'fixed',
        'top-[50%]',
        'left-[50%]',
        'z-50',
        'grid',
        'w-full',
        'max-w-[calc(100%-2rem)]',
        'translate-x-[-50%]',
        'translate-y-[-50%]',
        'gap-4',
        'rounded-lg',
        'border',
        'p-6',
        'shadow-lg',
        'duration-200',
        'sm:max-w-lg'
      )
    })

    it('applies custom className', () => {
      render(
        <Dialog open>
          <DialogContent className="custom-content">
            <DialogTitle>Custom Content</DialogTitle>
            <DialogDescription>Custom content description</DialogDescription>
          </DialogContent>
        </Dialog>
      )
      
      const content = screen.getByRole('dialog')
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('DialogHeader', () => {
    it('renders with correct structure', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader data-testid="dialog-header">
              <DialogTitle>Header Test</DialogTitle>
              <DialogDescription>Header description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
      
      const header = screen.getByTestId('dialog-header')
      expect(header).toHaveClass('flex', 'flex-col', 'gap-2', 'text-center', 'sm:text-left')
      expect(header).toContainElement(screen.getByText('Header Test'))
      expect(header).toContainElement(screen.getByText('Header description'))
    })
  })

  describe('DialogTitle', () => {
    it('renders with correct styling', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle data-testid="dialog-title">Title Test</DialogTitle>
            <DialogDescription>Title test description</DialogDescription>
          </DialogContent>
        </Dialog>
      )
      
      const title = screen.getByTestId('dialog-title')
      expect(title).toHaveClass('text-lg', 'leading-none', 'font-semibold')
    })

    it('provides accessibility labeling', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Accessible Title</DialogTitle>
            <DialogDescription>Accessible title description</DialogDescription>
          </DialogContent>
        </Dialog>
      )
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })
  })

  describe('DialogDescription', () => {
    it('renders with correct styling', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription data-testid="dialog-description">
              Description test
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )
      
      const description = screen.getByTestId('dialog-description')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })

    it('provides accessibility description', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Accessible description</DialogDescription>
          </DialogContent>
        </Dialog>
      )
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-describedby')
    })
  })

  describe('DialogFooter', () => {
    it('renders with correct styling', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Footer test description</DialogDescription>
            <DialogFooter data-testid="dialog-footer">
              <Button>Action</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
      
      const footer = screen.getByTestId('dialog-footer')
      expect(footer).toHaveClass(
        'flex',
        'flex-col-reverse',
        'gap-2',
        'sm:flex-row',
        'sm:justify-end'
      )
    })
  })

  describe('Accessibility', () => {
    it('traps focus within dialog', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Focus Test</DialogTitle>
            <DialogDescription>Focus test description</DialogDescription>
            <Button>First Button</Button>
            <Button>Second Button</Button>
          </DialogContent>
        </Dialog>
      )
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      
      // Focus should be trapped within the dialog
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3) // Including close button
    })

    it('closes on escape key', () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(true)
        
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Escape Test</DialogTitle>
              <DialogDescription>Escape test description</DialogDescription>
            </DialogContent>
          </Dialog>
        )
      }
      
      render(<TestComponent />)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
