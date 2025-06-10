"use client"

import { useState } from "react"
import { Camera, Users, Shield } from "lucide-react"
import FaceCapture from "./components/face-capture"
import UserManagement from "./components/user-management"
import "./App.css"

export default function App() {
  const [activeTab, setActiveTab] = useState("capture")

  return (
    <div className="app-container">
      <div className="app-content">
        <div className="app-header">
          <div className="header-title">
            <Shield className="header-icon" />
            <h1>Face Recognition Door Lock</h1>
          </div>
          <p className="header-subtitle">Secure access control system with face detection</p>
        </div>

        <div className="tabs-container">
          <div className="tabs-list">
            <button
              className={`tab-button ${activeTab === "capture" ? "active" : ""}`}
              onClick={() => setActiveTab("capture")}
            >
              <Camera className="tab-icon" />
              Face Recognition
            </button>
            <button
              className={`tab-button ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <Users className="tab-icon" />
              User Management
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "capture" && <FaceCapture />}
            {activeTab === "users" && <UserManagement />}
          </div>
        </div>
      </div>
    </div>
  )
}
