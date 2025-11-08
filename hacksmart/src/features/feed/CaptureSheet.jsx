import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { createPost } from '../../lib/firestoreApi.js'

const HELP_TYPES = [
  { value: 'food', label: 'Food' },
  { value: 'medical', label: 'Medical' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'donation', label: 'Donation' },
  { value: 'rescue', label: 'Rescue' },
]

export default function CaptureSheet({ open, onClose }) {
  const dialogRef = useRef(null)
  const [caption, setCaption] = useState('')
  const [helpType, setHelpType] = useState('food')
  const [urgency, setUrgency] = useState(0)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (open) {
      setCaption('')
      setHelpType('food')
      setUrgency(0)
      setPhotoFile(null)
      setPhotoPreview(null)
      setError(null)
      setUploadProgress(0)
    }
  }, [open])

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(photoFile)
    return () => reader.abort()
  }, [photoFile])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [open])

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!photoFile) {
      setError('Please capture a photo first')
      return
    }

    if (!caption.trim()) {
      setError('Caption is required')
      return
    }

    setSubmitting(true)
    setUploadProgress(10)

    try {
      // Get user location
      let location = { lat: 32.525, lng: -92.64 } // Default: Grambling, LA
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
        } catch (geoError) {
          console.warn('Could not get location, using default:', geoError)
        }
      }

      setUploadProgress(30)

      // Create post with image upload
      await createPost(
        {
          caption: caption.trim(),
          helpType,
          urgency,
          location,
          type: 'request',
        },
        photoFile,
      )

      setUploadProgress(100)
      onClose()
    } catch (err) {
      console.error(err)
      setError('Failed to submit post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-2xl rounded-t-3xl bg-white p-0 text-left shadow-2xl backdrop:bg-slate-900/60 md:rounded-3xl"
      onCancel={(event) => {
        event.preventDefault()
        if (!submitting) onClose()
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Capture new update</h2>
            <p className="text-sm text-slate-500">Take a photo and share what help is needed.</p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close capture sheet"
          >
            ✕
          </button>
        </header>

        <label className="flex flex-col gap-3 text-sm font-medium text-slate-700">
          Photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-600"
            onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
            disabled={submitting}
          />
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Preview of captured post"
              className="h-48 w-full rounded-xl object-cover"
            />
          ) : null}
        </label>

        <label className="text-sm font-medium text-slate-700">
          Caption
          <textarea
            className="mt-2 h-24 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            placeholder="Describe the situation..."
            maxLength={200}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            disabled={submitting}
          />
          <span className="mt-1 block text-xs text-slate-400">
            {caption.length}/200 characters
          </span>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Help type
            <select
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              value={helpType}
              onChange={(event) => setHelpType(event.target.value)}
              disabled={submitting}
            >
              {HELP_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <span>Urgent</span>
            <button
              type="button"
              className={clsx(
                'relative h-6 w-11 rounded-full transition-colors',
                urgency === 1 ? 'bg-red-500' : 'bg-slate-300',
              )}
              role="switch"
              aria-checked={urgency === 1}
              onClick={() => setUrgency((prev) => (prev === 1 ? 0 : 1))}
              disabled={submitting}
            >
              <span
                className={clsx(
                  'absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform',
                  urgency === 1 ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Location</p>
          <p className="mt-1 text-sm text-slate-500">
            Using your device location to auto-fill nearby responders.
          </p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {submitting ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Uploading photo</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          className="h-12 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={submitting}
        >
          Post update
        </button>
      </form>
    </dialog>
  )
}

CaptureSheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

