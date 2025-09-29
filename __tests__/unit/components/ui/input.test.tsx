import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass(
      'flex',
      'h-9',
      'w-full',
      'rounded-md',
      'border',
      'border-input',
      'bg-transparent',
      'px-3',
      'py-1',
      'text-base',
      'shadow-sm',
      'transition-colors'
    )
  })

  it('handles value changes', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test value' } })
    
    expect(handleChange).toHaveBeenCalled()
    expect(input).toHaveValue('test value')
  })

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled input" />)
    
    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
  })

  it('supports different input types', () => {
    render(<Input type="email" placeholder="Email" />)
    
    const input = screen.getByPlaceholderText('Email')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Input ref={ref} />)
    
    expect(ref).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input')
  })

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />)
    
    const input = screen.getByRole('textbox')
    
    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalled()
    
    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalled()
  })

  it('supports controlled input', () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('')
      return (
        <Input 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          data-testid="controlled-input"
        />
      )
    }
    
    render(<TestComponent />)
    
    const input = screen.getByTestId('controlled-input')
    fireEvent.change(input, { target: { value: 'controlled' } })
    
    expect(input).toHaveValue('controlled')
  })

  it('supports uncontrolled input', () => {
    render(<Input defaultValue="default" data-testid="uncontrolled-input" />)
    
    const input = screen.getByTestId('uncontrolled-input')
    expect(input).toHaveValue('default')
    
    fireEvent.change(input, { target: { value: 'changed' } })
    expect(input).toHaveValue('changed')
  })

  it('handles required attribute', () => {
    render(<Input required placeholder="Required input" />)
    
    const input = screen.getByPlaceholderText('Required input')
    expect(input).toBeRequired()
  })

  it('handles readonly attribute', () => {
    render(<Input readOnly value="readonly" />)
    
    const input = screen.getByDisplayValue('readonly')
    expect(input).toHaveAttribute('readonly')
  })

  it('supports aria attributes', () => {
    render(
      <Input 
        aria-label="Search input"
        aria-describedby="search-help"
        aria-invalid="true"
      />
    )
    
    const input = screen.getByLabelText('Search input')
    expect(input).toHaveAttribute('aria-describedby', 'search-help')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })
})
