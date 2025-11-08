import React, { useEffect, useRef, useState } from 'react'
import { createPost } from '../../lib/firebase/firestoreApi.js'
import { auth } from '../../lib/firebase/firebase.js'
import './CreatePostModal.css'

const HELP_TYPES = [
  { value: 'food', label: '🍔 Food' },
  { value: 'medical', label: '🏥 Medical' },
  { value: 'shelter', label: '🏠 Shelter' },
  { value: 'donation', label: '💰 Donation' },
  { value: 'rescue', label: '🚑 Rescue' },
  { value: 'water', label: '💧 Water' },
  { value: 'power', label: '⚡ Power' },
  { value: 'transport', label: '🚗 Transport' },
]

export default function CreatePostModal({ open, onClose, onSuccess }) {
  const [caption, setCaption] = useState('')
  const [helpType, setHelpType] = useState('food')
  const [urgency, setUrgency] = useState(0)
  const [targetAmount, setTargetAmount] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [mediaType, setMediaType] = useState(null) // 'image' or 'video'
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setCaption('')
      setHelpType('food')
      setUrgency(0)
      setTargetAmount('')
      setMediaFile(null)
      setMediaPreview(null)
      setMediaType(null)
      setError(null)
      setUploadProgress(0)
    }
  }, [open])

  useEffect(() => {
    if (!mediaFile) {
      setMediaPreview(null)
      setMediaType(null)
      return
    }

    const fileType = mediaFile.type
    if (fileType.startsWith('video/')) {
      setMediaType('video')
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        const url = URL.createObjectURL(mediaFile)
        setMediaPreview(url)
      }
      video.src = URL.createObjectURL(mediaFile)
    } else if (fileType.startsWith('image/')) {
      setMediaType('image')
      const reader = new FileReader()
      reader.onloadend = () => setMediaPreview(reader.result)
      reader.readAsDataURL(mediaFile)
    }
  }, [mediaFile])

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!mediaFile) {
      setError('Please upload an image or video')
      return
    }

    if (!caption.trim()) {
      setError('Description is required')
      return
    }

    if (caption.trim().length < 10) {
      setError('Description must be at least 10 characters')
      return
    }

    setSubmitting(true)
    setUploadProgress(10)

    try {
      setUploadProgress(30)

      const postData = {
        caption: caption.trim(),
        helpType,
        urgency,
        type: 'request',
        targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
      }

      setUploadProgress(50)

      await createPost(postData, mediaFile)

      setUploadProgress(100)
      
      if (onSuccess) {
        onSuccess()
      }
      
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (err) {
      console.error('Error creating post:', err)
      setError(err.message || 'Failed to create post. Please try again.')
      setUploadProgress(0)
    } finally {
      setSubmitting(false)
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB for videos, 5MB for images - will be compressed)
    const maxSize = file.type.startsWith('video/') ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`File too large. Maximum size: ${file.type.startsWith('video/') ? '10MB' : '5MB'}. Images will be automatically compressed.`)
      return
    }

    // Additional validation for images
    if (file.type.startsWith('image/')) {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        setMediaFile(file)
        setError(null)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        setError('Invalid image file. Please select a valid image.')
      }
      img.src = url
    } else {
      setMediaFile(file)
      setError(null)
    }
  }

  if (!open) return null

  return (
    <div className="createPostModalOverlay" onClick={onClose}>
      <div className="createPostModal" onClick={(e) => e.stopPropagation()}>
        <div className="createPostModal__header">
          <div>
            <h2 className="createPostModal__title">Create New Post</h2>
            <p className="createPostModal__subtitle">Share what help is needed in your area</p>
          </div>
          <button
            onClick={onClose}
            className="createPostModal__close"
            disabled={submitting}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="createPostModal__form">
          {/* Media Upload */}
          <div className="createPostModal__mediaSection">
            <label className="createPostModal__mediaLabel">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                disabled={submitting}
                className="createPostModal__fileInput"
              />
              {!mediaPreview ? (
                <div className="createPostModal__mediaPlaceholder">
                  <span className="createPostModal__mediaIcon">📷</span>
                  <span className="createPostModal__mediaText">Tap to upload photo or video</span>
                  <span className="createPostModal__mediaHint">Supports images and videos</span>
                </div>
              ) : (
                <div className="createPostModal__mediaPreview">
                  {mediaType === 'video' ? (
                    <video
                      src={mediaPreview}
                      controls
                      className="createPostModal__previewVideo"
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="createPostModal__previewImage"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaFile(null)
                      setMediaPreview(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="createPostModal__removeMedia"
                    disabled={submitting}
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </label>
          </div>

          {/* Description */}
          <label className="createPostModal__label">
            Description *
            <textarea
              className="createPostModal__textarea"
              placeholder="Describe what help is needed... Be specific about location, urgency, and requirements."
              maxLength={500}
              value={caption}
              onChange={(e) => {
                setCaption(e.target.value)
                setError(null)
              }}
              disabled={submitting}
              rows={4}
            />
            <span className="createPostModal__charCount">
              {caption.length}/500 characters
            </span>
          </label>

          {/* Help Type & Urgency */}
          <div className="createPostModal__row">
            <label className="createPostModal__label">
              Help Type
              <select
                className="createPostModal__select"
                value={helpType}
                onChange={(e) => setHelpType(e.target.value)}
                disabled={submitting}
              >
                {HELP_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="createPostModal__label createPostModal__label--toggle">
              <span>Urgent Request</span>
              <button
                type="button"
                className={`createPostModal__toggle ${urgency === 1 ? 'createPostModal__toggle--active' : ''}`}
                onClick={() => setUrgency(urgency === 1 ? 0 : 1)}
                disabled={submitting}
                role="switch"
                aria-checked={urgency === 1}
              >
                <span className="createPostModal__toggleSlider" />
              </button>
            </label>
          </div>

          {/* Target Amount */}
          <label className="createPostModal__label">
            Fundraising Goal (Optional)
            <div className="createPostModal__amountInput">
              <span className="createPostModal__amountSymbol">$</span>
              <input
                type="number"
                min="0"
                step="1"
                className="createPostModal__input"
                placeholder="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                disabled={submitting}
              />
            </div>
            <span className="createPostModal__hint">
              Leave empty if you don't need monetary donations
            </span>
          </label>

          {/* Error Message */}
          {error && (
            <div className="createPostModal__error">
              {error}
            </div>
          )}

          {/* Progress Bar */}
          {submitting && (
            <div className="createPostModal__progress">
              <div className="createPostModal__progressBar">
                <div
                  className="createPostModal__progressFill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="createPostModal__progressText">
                {uploadProgress < 50 ? 'Uploading media...' : uploadProgress < 90 ? 'Creating post...' : 'Almost done...'}
              </span>
            </div>
          )}

          {/* Submit Button */}
          <div className="createPostModal__actions">
            <button
              type="button"
              onClick={onClose}
              className="createPostModal__cancelBtn"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="createPostModal__submitBtn"
              disabled={submitting || !mediaFile || !caption.trim() || caption.trim().length < 10}
            >
              {submitting ? 'Posting...' : '✨ Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

