"use client"

import { useState } from "react"
import { Camera, Users, Shield } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FaceCapture from "./components/face-capture"
import UserManagement from "./components/user-management"

export default function App() {
  const [activeTab, setActiveTab] = useState("capture")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Face Recognition Door Lock</h1>
          </div>
          <p className="text-gray-600">Secure access control system with face detection</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="capture" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Face Recognition
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="capture" className="mt-6">
            <FaceCapture />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
