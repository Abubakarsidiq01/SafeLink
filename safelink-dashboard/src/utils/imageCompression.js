/**
 * Compress and resize image to reduce file size
 * @param {File} file - Image file
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @param {number} quality - JPEG quality (0.1 to 1.0)
 * @param {number} maxSizeKB - Maximum file size in KB
 * @returns {Promise<string>} Base64 data URL
 */
export async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.7, maxSizeKB = 500) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width
        let height = img.height
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }
        
        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to blob with quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            
            // Check if we need further compression
            const sizeKB = blob.size / 1024
            if (sizeKB > maxSizeKB) {
              // Recursively compress with lower quality
              const newQuality = Math.max(0.3, quality - 0.1)
              compressImage(file, maxWidth, maxHeight, newQuality, maxSizeKB)
                .then(resolve)
                .catch(reject)
              return
            }
            
            // Convert blob to base64
            const reader2 = new FileReader()
            reader2.onloadend = () => resolve(reader2.result)
            reader2.onerror = reject
            reader2.readAsDataURL(blob)
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compress video by reducing quality/size (for base64 storage)
 * Note: For production, videos should be stored in Firebase Storage, not Firestore
 * @param {File} file - Video file
 * @returns {Promise<string>} Base64 data URL (compressed if possible)
 */
export async function compressVideo(file) {
  // For now, just convert to base64
  // In production, videos should go to Firebase Storage
  // Limit video size to 5MB for base64 (Firestore limit is 1MB per field, so we'll need Storage)
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (file.size > maxSize) {
    throw new Error('Video file too large. Maximum size: 5MB. Please use Firebase Storage for larger videos.')
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read video file'))
    reader.readAsDataURL(file)
  })
}

