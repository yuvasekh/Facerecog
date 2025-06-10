"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { UserPlus, Camera, Save, Trash2, User } from "lucide-react"

export default function UserManagement() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
  })
  const [registeredUsers, setRegisteredUsers] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [captureCountdown, setCaptureCountdown] = useState(0)
  const [autoCapturing, setAutoCapturing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const loadUsers = useCallback(() => {
    const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
    setRegisteredUsers(users)
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please check permissions.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsStreaming(false)
    }
  }, [])

  const detectFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return false

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) return false

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Simple face detection based on skin tone and brightness analysis
    let skinPixels = 0
    let brightPixels = 0
    const totalPixels = data.length / 4

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const brightness = (r + g + b) / 3

      // Skin tone detection
      if (r > 95 && g > 40 && b > 20 && r > g && r > b) {
        skinPixels++
      }

      // Brightness analysis
      if (brightness > 80 && brightness < 200) {
        brightPixels++
      }
    }

    const skinRatio = skinPixels / totalPixels
    const brightRatio = brightPixels / totalPixels

    // Face detected if we have good skin tone ratio and proper lighting
    return skinRatio > 0.15 && skinRatio < 0.6 && brightRatio > 0.4
  }, [isStreaming])

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (context) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)

      const imageData = canvas.toDataURL("image/jpeg", 0.8)
      setCapturedImage(imageData)
      stopCamera()
      setAutoCapturing(false)
      setCaptureCountdown(0)
    }
  }, [stopCamera])

  const handleSmartCapture = useCallback(async () => {
    if (!isStreaming) return

    setAutoCapturing(true)

    // Check for face detection
    const hasFace = await detectFace()
    setFaceDetected(hasFace)

    if (hasFace) {
      // Start countdown for auto capture
      setCaptureCountdown(3)

      const countdownInterval = setInterval(() => {
        setCaptureCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            // Auto capture after countdown
            setTimeout(() => {
              if (isStreaming && !capturedImage) {
                captureImage()
              }
            }, 100)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      // No face detected, show message and stop auto capturing
      setAutoCapturing(false)
      alert("No face detected. Please position yourself properly in front of the camera.")
    }
  }, [detectFace, capturedImage, isStreaming, captureImage])

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const saveUser = useCallback(async () => {
    if (!formData.name.trim() || !formData.employeeId.trim() || !capturedImage) {
      alert("Please fill all fields and capture an image")
      return
    }

    setIsUploading(true)

    try {
      // Prepare user data for API
      const userData = {
        name: formData.name.trim(),
        employeeId: formData.employeeId.trim(),
        imageData: capturedImage,
        registeredAt: new Date().toISOString(),
      }

      // Simulate API call
      console.log("Sending user data to server:", {
        name: userData.name,
        employeeId: userData.employeeId,
        imageSize: userData.imageData.length,
        registeredAt: userData.registeredAt,
      })

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Save locally
      const newUser = {
        id: Date.now().toString(),
        ...userData,
      }

      const updatedUsers = [...registeredUsers, newUser]
      localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))
      setRegisteredUsers(updatedUsers)

      // Reset form
      setFormData({ name: "", employeeId: "" })
      setCapturedImage(null)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      console.log("User saved successfully!")
    } catch (error) {
      console.error("Error saving user:", error)
      alert("Failed to save user. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }, [formData, capturedImage, registeredUsers])

  const deleteUser = useCallback(
    (userId) => {
      const updatedUsers = registeredUsers.filter((user) => user.id !== userId)
      localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))
      setRegisteredUsers(updatedUsers)
    },
    [registeredUsers],
  )

  const resetForm = useCallback(() => {
    setFormData({ name: "", employeeId: "" })
    setCapturedImage(null)
    setAutoCapturing(false)
    setCaptureCountdown(0)
    setFaceDetected(false)
    stopCamera()
  }, [stopCamera])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div className="user-management-container">
      {showSuccess && <div className="success-alert">User registered successfully!</div>}

      <div className="register-card">
        <div className="card-header">
          <UserPlus className="card-icon" />
          <h2>Register New User</h2>
        </div>

        <div className="card-content">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="employeeId">Employee ID</label>
              <input
                id="employeeId"
                name="employeeId"
                type="text"
                value={formData.employeeId}
                onChange={handleInputChange}
                placeholder="Enter employee ID"
                className="form-input"
              />
            </div>
          </div>

          <div className="photo-section">
            <label>Face Photo</label>
            <div className="video-container">
              {!capturedImage ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="video-element" />

                  {/* Auto-capture indicators */}
                  {isStreaming && autoCapturing && (
                    <div className="capture-overlay">
                      <div className="capture-status">
                        <div className="status-row">
                          <span>Smart Capture: {faceDetected ? "Face Detected" : "Looking for face..."}</span>
                          <div className={`status-indicator ${faceDetected ? "detected" : "searching"}`}></div>
                        </div>
                        {captureCountdown > 0 && (
                          <div className="countdown-container">
                            <div className="countdown-text">Capturing in {captureCountdown}...</div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${((4 - captureCountdown) / 3) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <img src={capturedImage || "/placeholder.svg"} alt="Captured face" className="captured-image" />
              )}

              {!isStreaming && !capturedImage && (
                <div className="camera-placeholder">
                  <Camera className="placeholder-icon" />
                  <p>No photo captured</p>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }} />

            <div className="button-container">
              {!isStreaming && !capturedImage && (
                <button onClick={startCamera} className="btn btn-primary">
                  <Camera className="btn-icon" />
                  Start Camera
                </button>
              )}

              {isStreaming && !capturedImage && (
                <>
                  <button onClick={handleSmartCapture} className="btn btn-primary" disabled={autoCapturing}>
                    <Camera className="btn-icon" />
                    {autoCapturing ? "Capturing..." : "Smart Capture"}
                  </button>
                  <button onClick={stopCamera} className="btn btn-secondary">
                    Cancel
                  </button>
                </>
              )}

              {capturedImage && (
                <>
                  <button onClick={saveUser} disabled={isUploading} className="btn btn-primary">
                    {isUploading ? (
                      <>
                        <div className="btn-spinner"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="btn-icon" />
                        Save User
                      </>
                    )}
                  </button>
                  <button onClick={resetForm} className="btn btn-secondary" disabled={isUploading}>
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="users-card">
        <div className="card-header">
          <User className="card-icon" />
          <h2>Registered Users ({registeredUsers.length})</h2>
        </div>

        <div className="card-content">
          {registeredUsers.length === 0 ? (
            <div className="empty-state">
              <User className="empty-icon" />
              <p>No users registered yet</p>
            </div>
          ) : (
            <div className="users-list">
              {registeredUsers.map((user) => (
                <div key={user.id} className="user-item">
                  <img src={user.imageData || "/placeholder.svg"} alt={user.name} className="user-avatar" />
                  <div className="user-info">
                    <h3>{user.name}</h3>
                    <p className="user-id">ID: {user.employeeId}</p>
                    <p className="user-date">Registered: {new Date(user.registeredAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => deleteUser(user.id)} className="btn btn-danger btn-small">
                    <Trash2 className="btn-icon" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
