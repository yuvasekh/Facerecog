"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Camera, CheckCircle, XCircle, RotateCcw } from "lucide-react"

export default function FaceCapture() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [detectionResult, setDetectionResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [captureCountdown, setCaptureCountdown] = useState(0)
  const [autoCapturing, setAutoCapturing] = useState(false)

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

  const simulateFaceDetection = useCallback(async (imageData) => {
    // Simulate face detection processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Get registered users from localStorage
    const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")

    // Simulate face matching (random for demo)
    const isMatch = Math.random() > 0.3 // 70% success rate for demo

    if (isMatch && registeredUsers.length > 0) {
      const randomUser = registeredUsers[Math.floor(Math.random() * registeredUsers.length)]
      return {
        success: true,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        user: randomUser,
      }
    }

    return {
      success: false,
      confidence: Math.random() * 0.5 + 0.2, // 20-70% confidence
    }
  }, [])

  const processImage = useCallback(async () => {
    if (!capturedImage) return

    setIsProcessing(true)
    try {
      const result = await simulateFaceDetection(capturedImage)
      setDetectionResult(result)
    } catch (error) {
      console.error("Face detection error:", error)
      setDetectionResult({
        success: false,
        confidence: 0,
      })
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImage, simulateFaceDetection])

  const resetCapture = useCallback(() => {
    setCapturedImage(null)
    setDetectionResult(null)
    setIsProcessing(false)
    setAutoCapturing(false)
    setCaptureCountdown(0)
    setFaceDetected(false)
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  useEffect(() => {
    if (capturedImage && !detectionResult && !isProcessing) {
      processImage()
    }
  }, [capturedImage, detectionResult, isProcessing, processImage])

  return (
    <div className="face-capture-container">
      <div className="capture-card">
        <div className="card-header">
          <Camera className="card-icon" />
          <h2>Face Recognition Scanner</h2>
        </div>

        <div className="card-content">
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
                <p>Camera not active</p>
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
                  Stop Camera
                </button>
              </>
            )}

            {capturedImage && (
              <button onClick={resetCapture} className="btn btn-secondary">
                <RotateCcw className="btn-icon" />
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="processing-card">
          <div className="processing-content">
            <div className="spinner"></div>
            <p>Processing face recognition...</p>
          </div>
        </div>
      )}

      {detectionResult && (
        <div className={`result-card ${detectionResult.success ? "success" : "failure"}`}>
          <div className="result-content">
            <div className="result-header">
              {detectionResult.success ? (
                <CheckCircle className="result-icon success-icon" />
              ) : (
                <XCircle className="result-icon failure-icon" />
              )}
              <div className="result-info">
                <p className="result-title">{detectionResult.success ? "Access Granted" : "Access Denied"}</p>
                <p className="result-confidence">Confidence: {(detectionResult.confidence * 100).toFixed(1)}%</p>
                {detectionResult.user && (
                  <div className="user-info">
                    <p>
                      <strong>Welcome:</strong> {detectionResult.user.name}
                    </p>
                    <p>
                      <strong>Employee ID:</strong> {detectionResult.user.employeeId}
                    </p>
                  </div>
                )}
                {!detectionResult.success && (
                  <p className="error-message">Face not recognized. Please try again or contact administrator.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
