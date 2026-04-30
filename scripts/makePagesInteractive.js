const fs = require('fs')
const path = require('path')

// Find all page.tsx files
function findPageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      findPageFiles(filePath, fileList)
    } else if (file === 'page.tsx' && !filePath.includes('node_modules')) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

// Add interactive imports and state to a page
function makePageInteractive(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  
  // Skip if already has interactive components
  if (content.includes('Modal') && content.includes('ConfirmDialog')) {
    console.log(`Skipping ${filePath} - already interactive`)
    return
  }
  
  // Add imports if not present
  if (!content.includes("import Modal from '@/components/Modal'")) {
    content = content.replace(
      /import Tooltip from '@\/components\/Tooltip'/,
      `import Tooltip from '@/components/Tooltip'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'`
    )
  }
  
  // Change const to useState for data
  const dataPattern = /const \[(\w+)\] = useState\(\(\) => (generate\w+\(\d+\))\)/
  if (dataPattern.test(content)) {
    content = content.replace(
      dataPattern,
      (match, varName, generator) => {
        return `const [${varName}, set${varName.charAt(0).toUpperCase() + varName.slice(1)}] = useState(() => ${generator})`
      }
    )
  }
  
  // Add interactive state
  if (!content.includes('showCreateModal')) {
    const statePattern = /const \[searchQuery, setSearchQuery\] = useState\(''\)/
    if (statePattern.test(content)) {
      content = content.replace(
        statePattern,
        `const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [formData, setFormData] = useState({})`
      )
    }
  }
  
  // Add handler functions
  if (!content.includes('handleCreate')) {
    const beforeReturn = content.lastIndexOf('return (')
    if (beforeReturn > 0) {
      const handlerFunctions = `
  const handleCreate = () => {
    setFormData({})
    setShowCreateModal(true)
  }

  const handleEdit = (item) => {
    setSelectedItem(item)
    setFormData(item)
    setShowEditModal(true)
  }

  const handleView = (item) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const handleDelete = (item) => {
    setSelectedItem(item)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (selectedItem) {
      set${content.match(/const \[(\w+),/)?.[1]?.charAt(0).toUpperCase() + content.match(/const \[(\w+),/)?.[1]?.slice(1) || 'Data'}(prev => prev.filter(item => item.id !== selectedItem.id))
      setSelectedItem(null)
    }
  }

  const handleSave = () => {
    if (showCreateModal) {
      const newItem = {
        ...formData,
        id: \`ITEM-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,
      }
      set${content.match(/const \[(\w+),/)?.[1]?.charAt(0).toUpperCase() + content.match(/const \[(\w+),/)?.[1]?.slice(1) || 'Data'}(prev => [...prev, newItem])
      setShowCreateModal(false)
    } else if (showEditModal && selectedItem) {
      set${content.match(/const \[(\w+),/)?.[1]?.charAt(0).toUpperCase() + content.match(/const \[(\w+),/)?.[1]?.slice(1) || 'Data'}(prev => prev.map(item => item.id === selectedItem.id ? { ...item, ...formData } : item))
      setShowEditModal(false)
      setSelectedItem(null)
    }
    setFormData({})
  }
`
      content = content.slice(0, beforeReturn) + handlerFunctions + content.slice(beforeReturn)
    }
  }
  
  // Update Create button
  content = content.replace(
    /<button className="bg-gradient-to-r from-cyan-500 to-blue-600[^>]*>[\s\S]*?<\/button>/,
    (match) => {
      if (!match.includes('onClick')) {
        return match.replace('<button', '<button onClick={handleCreate}')
      }
      return match
    }
  )
  
  // Update View/Edit/Delete buttons
  content = content.replace(
    /<button[^>]*>[\s\S]*?<i className="ri-eye-line"><\/i>[\s\S]*?<\/button>/g,
    (match) => {
      if (!match.includes('onClick')) {
        return match.replace('<button', '<button onClick={() => handleView(item)}')
      }
      return match
    }
  )
  
  content = content.replace(
    /<button[^>]*>[\s\S]*?<i className="ri-edit-line"><\/i>[\s\S]*?<\/button>/g,
    (match) => {
      if (!match.includes('onClick')) {
        return match.replace('<button', '<button onClick={() => handleEdit(item)}')
      }
      return match
    }
  )
  
  // Add modals before closing PageTemplate
  const beforeClosing = content.lastIndexOf('</PageTemplate>')
  if (beforeClosing > 0) {
    const modals = `
      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false)
          setShowEditModal(false)
          setFormData({})
          setSelectedItem(null)
        }}
        title={showCreateModal ? 'Create New Item' : 'Edit Item'}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-[#9ca3af]">Form fields will be customized per page type.</p>
          <div className="flex items-center gap-3 justify-end pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setShowCreateModal(false)
                setShowEditModal(false)
                setFormData({})
                setSelectedItem(null)
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors"
            >
              {showCreateModal ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedItem(null)
        }}
        title={\`View Details - \${selectedItem?.name || selectedItem?.title || selectedItem?.number || selectedItem?.code || 'Item'}\`}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <pre className="text-sm text-white bg-white/5 p-4 rounded-lg overflow-auto">
              {JSON.stringify(selectedItem, null, 2)}
            </pre>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSelectedItem(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Item"
        message={\`Are you sure you want to delete this item? This action cannot be undone.\`}
        confirmText="Delete"
        variant="danger"
      />
`
    content = content.slice(0, beforeClosing) + modals + content.slice(beforeClosing)
  }
  
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`Updated: ${filePath}`)
}

// Main execution
const appDir = path.join(process.cwd(), 'app')
const pageFiles = findPageFiles(appDir)

console.log(`Found ${pageFiles.length} page files`)

pageFiles.forEach((filePath) => {
  try {
    makePageInteractive(filePath)
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
})

console.log(`\n✅ Updated ${pageFiles.length} pages with interactive functionality!`)

