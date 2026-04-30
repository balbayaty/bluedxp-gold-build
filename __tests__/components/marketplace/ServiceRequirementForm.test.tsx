/**
 * Service Requirement Form Component - Integration Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ServiceRequirementForm from '@/components/marketplace/ServiceRequirementForm'

describe('ServiceRequirementForm', () => {
  it('should render form fields', () => {
    render(<ServiceRequirementForm />)
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    render(<ServiceRequirementForm />)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument()
    })
  })

  it('should handle form submission', async () => {
    const onSubmit = jest.fn()
    render(<ServiceRequirementForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'STORAGE' },
    })
    fireEvent.change(screen.getByLabelText(/location/i), {
      target: { value: 'Riyadh' },
    })

    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
  })

  it('should auto-save form data', async () => {
    render(<ServiceRequirementForm />)

    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'STORAGE' },
    })

    await waitFor(() => {
      const savedData = localStorage.getItem('marketplace-form-draft')
      expect(savedData).toBeTruthy()
    })
  })
})
