'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Customer } from '@/types/tenant'
import { flexLogisticsCustomer } from '@/data/flexLogisticsCustomer'

interface CustomerContextType {
  currentCustomer: Customer | null
  setCurrentCustomer: (customer: Customer | null) => void
  customers: Customer[]
  setCustomers: (customers: Customer[]) => void
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  // HYDRATION-SAFE: Start with null on both server and client
  // Then read from localStorage AFTER mount to avoid hydration mismatch
  const [currentCustomer, setCurrentCustomerState] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([flexLogisticsCustomer])
  const [isHydrated, setIsHydrated] = useState(false)

  // Read from localStorage AFTER mount (hydration-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const saved = localStorage.getItem('current-customer')
    if (saved) {
      try {
        const customerData = JSON.parse(saved)
        if (customerData && customerData.id) {
          // If it's Flex Logistics, always use the latest data to ensure logo is correct
          if (customerData.id === 'customer-flex-001') {
            setCurrentCustomerState(flexLogisticsCustomer)
          } else {
            setCurrentCustomerState(customerData)
          }
        } else {
          // Invalid data, use default
          setCurrentCustomerState(flexLogisticsCustomer)
        }
      } catch (e) {
        console.error('Error loading current customer:', e)
        // On error, use default
        setCurrentCustomerState(flexLogisticsCustomer)
      }
    } else {
      // No saved customer, use Flex Logistics
      setCurrentCustomerState(flexLogisticsCustomer)
    }
    
    setIsHydrated(true)
  }, [])

  // Save current customer to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentCustomer) {
        localStorage.setItem('current-customer', JSON.stringify(currentCustomer))
      } else {
        localStorage.removeItem('current-customer')
      }
    }
  }, [currentCustomer])

  const setCurrentCustomer = useCallback((customer: Customer | null) => {
    setCurrentCustomerState(customer)
  }, [])

  return (
    <CustomerContext.Provider
      value={{
        currentCustomer,
        setCurrentCustomer,
        customers,
        setCustomers,
      }}
    >
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomer() {
  const context = useContext(CustomerContext)
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider')
  }
  return context
}

