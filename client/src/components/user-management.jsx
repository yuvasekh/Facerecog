"use client"

import  React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { UserPlus, Camera, Save, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"


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

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const saveUser = useCallback(() => {
    if (!formData.name.trim() || !formData.employeeId.trim() || !capturedImage) {
      alert("Please fill all fields and capture an image")
      return
    }

    const newUser = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      employeeId: formData.employeeId.trim(),
      imageData: capturedImage,
      registeredAt: new Date().toISOString(),
    }

    const updatedUsers = [...registeredUsers, newUser]
    localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))
    setRegisteredUsers(updatedUsers)

    // Reset form
    setFormData({ name: "", employeeId: "" })
    setCapturedImage(null)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
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
    stopCamera()
  }, [stopCamera])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div className="space-y-6">
      {showSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">User registered successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Register New User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                placeholder="Enter employee ID"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Face Photo</Label>
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
                    <p className="text-sm opacity-75">No photo captured</p>
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
                    Capture Photo
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    Cancel
                  </Button>
                </>
              )}

              {capturedImage && (
                <>
                  <Button onClick={saveUser} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save User
                  </Button>
                  <Button onClick={resetForm} variant="outline">
                    Reset
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Registered Users ({registeredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {registeredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No users registered yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {registeredUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <img
                    src={user.imageData || "/placeholder.svg"}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">ID: {user.employeeId}</p>
                    <p className="text-xs text-gray-400">
                      Registered: {new Date(user.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => deleteUser(user.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
