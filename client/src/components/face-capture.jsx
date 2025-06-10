"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Camera, CheckCircle, XCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"


export default function FaceCapture() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [detectionResult, setDetectionResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

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
      const tracks = (videoRef.current.srcObject).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsStreaming(false)
    }
  }, [])

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
    }
  }, [stopCamera])

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Face Recognition Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video max-w-md mx-auto">
            {!capturedImage ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <img
                src={capturedImage || "/placeholder.svg"}
                alt="Captured face"
                className="w-full h-full object-cover"
              />
            )}

            {!isStreaming && !capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">Camera not active</p>
                </div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex justify-center gap-3">
            {!isStreaming && !capturedImage && (
              <Button onClick={startCamera} className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Start Camera
              </Button>
            )}

            {isStreaming && !capturedImage && (
              <>
                <Button onClick={captureImage} className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Capture Face
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  Stop Camera
                </Button>
              </>
            )}

            {capturedImage && (
              <Button onClick={resetCapture} variant="outline" className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing face recognition...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {detectionResult && (
        <Card>
          <CardContent className="pt-6">
            <Alert className={detectionResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {detectionResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">{detectionResult.success ? "Access Granted" : "Access Denied"}</p>
                    <p className="text-sm">Confidence: {(detectionResult.confidence * 100).toFixed(1)}%</p>
                    {detectionResult.user && (
                      <div className="text-sm">
                        <p>
                          <strong>Welcome:</strong> {detectionResult.user.name}
                        </p>
                        <p>
                          <strong>Employee ID:</strong> {detectionResult.user.employeeId}
                        </p>
                      </div>
                    )}
                    {!detectionResult.success && (
                      <p className="text-sm text-red-600">
                        Face not recognized. Please try again or contact administrator.
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
