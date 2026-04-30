import { useState, useCallback } from 'react'

interface UseInteractiveCRUDProps<T> {
  initialData: T[]
  generateId?: (item: Partial<T>) => string
}

export function useInteractiveCRUD<T extends { id: string }>({
  initialData,
  generateId,
}: UseInteractiveCRUDProps<T>) {
  const [data, setData] = useState<T[]>(initialData)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Partial<T>>({})

  const handleCreate = useCallback(() => {
    setFormData({})
    setShowCreateModal(true)
  }, [])

  const handleEdit = useCallback((item: T) => {
    setSelectedItem(item)
    setFormData(item)
    setShowEditModal(true)
  }, [])

  const handleView = useCallback((item: T) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }, [])

  const handleDelete = useCallback((item: T) => {
    setSelectedItem(item)
    setShowDeleteDialog(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (selectedItem) {
      setData((prev) => prev.filter((item) => item.id !== selectedItem.id))
      setSelectedItem(null)
    }
  }, [selectedItem])

  const handleSave = useCallback(
    (transformData?: (formData: Partial<T>, isEdit: boolean) => T) => {
      if (showCreateModal) {
        const newItem = transformData
          ? transformData(formData, false)
          : ({
              ...formData,
              id: generateId
                ? generateId(formData)
                : `ITEM-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            } as T)
        setData((prev) => [...prev, newItem])
        setShowCreateModal(false)
      } else if (showEditModal && selectedItem) {
        const updatedItem = transformData
          ? transformData({ ...selectedItem, ...formData }, true)
          : ({ ...selectedItem, ...formData } as T)
        setData((prev) => prev.map((item) => (item.id === selectedItem.id ? updatedItem : item)))
        setShowEditModal(false)
        setSelectedItem(null)
      }
      setFormData({})
    },
    [showCreateModal, showEditModal, selectedItem, formData, generateId]
  )

  const closeModals = useCallback(() => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowViewModal(false)
    setShowDeleteDialog(false)
    setFormData({})
    setSelectedItem(null)
  }, [])

  return {
    data,
    setData,
    showCreateModal,
    showEditModal,
    showViewModal,
    showDeleteDialog,
    selectedItem,
    formData,
    setFormData,
    handleCreate,
    handleEdit,
    handleView,
    handleDelete,
    confirmDelete,
    handleSave,
    closeModals,
    setShowCreateModal,
    setShowEditModal,
    setShowViewModal,
    setShowDeleteDialog,
  }
}

