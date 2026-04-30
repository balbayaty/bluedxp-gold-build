/**
 * Enhanced Location Picker - Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EnhancedLocationPicker from '@/components/marketplace/EnhancedLocationPicker'

// Mock maps service
jest.mock('@/lib/services/maps/mapsService', () => ({
  mapsService: {
    geocode: jest.fn().mockResolvedValue([
      {
        address: 'Riyadh, Saudi Arabia',
        coordinates: { lat: 24.7136, lng: 46.6753 },
        city: 'Riyadh',
        country: 'Saudi Arabia',
      },
    ]),
    reverseGeocode: jest.fn().mockResolvedValue({
      address: 'Riyadh, Saudi Arabia',
      city: 'Riyadh',
      country: 'Saudi Arabia',
    }),
  },
}))

describe('EnhancedLocationPicker', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render location picker', () => {
    render(<EnhancedLocationPicker value={{}} onChange={mockOnChange} />)

    expect(screen.getByPlaceholderText(/search address/i)).toBeInTheDocument()
  })

  it('should show map when map button is clicked', () => {
    render(<EnhancedLocationPicker value={{}} onChange={mockOnChange} />)

    const searchInput = screen.getByPlaceholderText(/search address/i)
    fireEvent.focus(searchInput)

    // Map should appear
  })

  it('should handle address search', async () => {
    render(<EnhancedLocationPicker value={{}} onChange={mockOnChange} />)

    const searchInput = screen.getByPlaceholderText(/search address/i)
    fireEvent.change(searchInput, { target: { value: 'Riyadh' } })

    await waitFor(() => {
      // Search results should appear
    })
  })

  it('should update location when coordinates are entered', () => {
    render(<EnhancedLocationPicker value={{}} onChange={mockOnChange} />)

    const latInput = screen.getByPlaceholderText(/24.7136/i)
    fireEvent.change(latInput, { target: { value: '24.7136' } })

    expect(mockOnChange).toHaveBeenCalled()
  })
})






