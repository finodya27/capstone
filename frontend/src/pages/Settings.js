// frontend/src/pages/Settings.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../utils/api";

const Settings = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [userData, setUserData] = useState({
    username: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    profileImage: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/user/profile");
        const user = res.data.data;
        setUserData(user);
        if (user.profileImage) setImagePreview(user.profileImage);
      } catch (err) {
        console.error("Gagal memuat data:", err);
        if (err.response?.status === 401) {
          alert("Sesi login berakhir. Silakan login ulang.");
          localStorage.clear();
          navigate("/");
        } else {
          setError("Gagal memuat data profil.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Ukuran maksimal 5MB!");
    if (!file.type.startsWith("image/")) return alert("File harus gambar!");

    setProfileImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      Object.entries(userData).forEach(([key, val]) => formData.append(key, val));
      if (profileImage) formData.append("profileImage", profileImage);

      await api.put("/user/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Profil berhasil diperbarui!");
      setIsEditing(false);
      setProfileImage(null);
    } catch (err) {
      console.error("❌ Gagal menyimpan:", err);
      alert("Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileImage(null);
    window.location.reload();
  };

  if (isLoading)
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-2 border-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data pengguna...</p>
        </div>
      </div>
    );

  return (
    <Layout
      pageTitle="Settings"
      connectionStatus="firebase"
      onLogout={handleLogout}
    >
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
          {/* Profile Header */}
          <div className="flex justify-between items-start">
            <div className="flex gap-6 items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-blue-600 overflow-hidden bg-gray-100">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-4xl text-gray-400">
                      👤
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white cursor-pointer shadow-md">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    📷
                  </label>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold">{userData.username}</h2>
                <p className="text-gray-500">{userData.email}</p>
                <p className="text-gray-400 text-sm">
                  {userData.department || "No department"}
                </p>
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700"
              >
                ✏️ Edit
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSaving ? "💾 Menyimpan..." : "💾 Simpan"}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  ❌ Batal
                </button>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {["username", "email", "phone", "role", "department"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {field}
                </label>
                <input
                  type="text"
                  name={field}
                  value={userData[field]}
                  disabled={!isEditing}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
