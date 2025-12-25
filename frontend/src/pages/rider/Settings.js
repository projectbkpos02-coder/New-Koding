import React, { useState, useRef } from 'react';
import RiderLayout from '../../components/RiderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Settings, 
  User, 
  Moon, 
  Sun, 
  Camera, 
  Loader2, 
  Check, 
  Mail, 
  Phone, 
  MapPin,
  Upload,
  X
} from 'lucide-react';

export default function RiderSettings() {
  const { user, updateUser } = useAuth();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar_url: user?.avatar_url || ''
  });

  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Convert to base64 for preview (in real app, upload to server/storage)
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar_url: reader.result });
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Gagal mengupload foto');
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData({ ...formData, avatar_url: '' });
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    
    try {
      await authAPI.updateProfile(formData);
      updateUser({ ...user, ...formData });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal menyimpan perubahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RiderLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Pengaturan</h1>
          <p className="text-sm text-muted-foreground">Kelola akun dan preferensi Anda</p>
        </div>

        {/* Profile Card */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div 
                  className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ring-4 ring-primary/20"
                  onClick={handlePhotoClick}
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      {user?.full_name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
                <button 
                  onClick={handlePhotoClick}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
                {formData.avatar_url && (
                  <button 
                    onClick={handleRemovePhoto}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{user?.full_name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <button 
                  onClick={handlePhotoClick}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 mt-1"
                >
                  <Upload className="w-3 h-3" />
                  Ganti Foto
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Nama Lengkap
                </label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nama lengkap"
                  className="bg-muted/50 border-border focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-muted/30 border-border text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  No. Telepon
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="bg-muted/50 border-border focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Alamat
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Masukkan alamat lengkap..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground resize-none transition-all"
                />
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={loading} 
              className="w-full bg-gradient-primary hover:opacity-90 text-white shadow-glow hover-lift"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : success ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Tersimpan!
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-accent/5 to-transparent">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              Preferensi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div 
              className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted/70 transition-colors cursor-pointer"
              onClick={handleToggleDarkMode}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${darkMode ? 'bg-[hsl(270,70%,60%)]/20 text-[hsl(270,70%,60%)]' : 'bg-accent/20 text-accent'}`}>
                  {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium text-foreground">Mode Gelap</p>
                  <p className="text-sm text-muted-foreground">{darkMode ? 'Aktif' : 'Nonaktif'}</p>
                </div>
              </div>
              <div
                className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${darkMode ? 'translate-x-8' : 'translate-x-1'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/10 rounded-full">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <span className="text-sm font-medium text-secondary">Rider</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Terdaftar sejak {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RiderLayout>
  );
}
