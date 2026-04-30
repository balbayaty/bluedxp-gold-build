// Clear all copilot widget positions from localStorage
// Run this in browser console to reset widget positions

if (typeof window !== 'undefined') {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith('copilot-widget-state')) {
      localStorage.removeItem(key)
      console.log('Cleared:', key)
    }
  })
  console.log('✅ All copilot positions cleared! Refresh the page.')
}




