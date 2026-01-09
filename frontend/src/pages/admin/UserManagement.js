import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { usersAPI } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { Users, User, Shield, Bike, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newRole, setNewRole] = useState('rider');
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setSaving(true);
    try {
      await usersAPI.updateRole(userId, newRole);
      setDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Gagal mengubah role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Hapus user "${userName}"? Aksi ini tidak dapat dibatalkan.`)) return;
    
    try {
      await usersAPI.delete(userId);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Gagal menghapus user');
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'super_admin': return <Shield className="w-4 h-4" />;
      case 'admin': return <User className="w-4 h-4" />;
      default: return <Bike className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'super_admin': return <Badge variant="destructive">Super Admin</Badge>;
      case 'admin': return <Badge>Admin</Badge>;
      default: return <Badge variant="secondary">Rider</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola User</h1>
          <p className="text-gray-500">Kelola akun admin dan rider</p>
        </div>

        {/* Add User Button */}
        {currentUser?.role && (currentUser.role === 'super_admin' || currentUser.role === 'admin') && (
          <div className="flex justify-end">
            <Button onClick={() => { setSelectedUser(null); setDialogOpen(true); }}>
              Tambah Pengguna
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.role === 'super_admin').length}</p>
                  <p className="text-sm text-gray-500">Super Admin</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                  <p className="text-sm text-gray-500">Admin</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Bike className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.role === 'rider').length}</p>
                  <p className="text-sm text-gray-500">Rider</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Daftar User
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada user</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Telepon</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Terdaftar</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <span className="font-semibold text-gray-600">
                                  {user.full_name?.charAt(0)?.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{user.full_name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {user.phone || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {formatDateTime(user.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {user.id !== currentUser.id && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setSelectedUser(user); setDialogOpen(true); }}
                              >
                                Ubah Role
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => handleDelete(user.id, user.full_name)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Change Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedUser(null);
            setNewEmail(''); setNewFullName(''); setNewPhone(''); setNewPassword('password123'); setNewRole('rider');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedUser ? 'Ubah Role User' : 'Tambah Pengguna Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedUser ? (
                <>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">{selectedUser?.full_name}</p>
                    <p className="text-sm text-gray-500">{selectedUser?.email}</p>
                    <p className="text-sm text-gray-500 mt-1">Role saat ini: {selectedUser?.role}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Pilih role baru:</p>
                    <div className="space-y-2">
                      <Button
                        variant={selectedUser?.role === 'rider' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => handleRoleChange(selectedUser?.id, 'rider')}
                        disabled={saving}
                      >
                        <Bike className="w-4 h-4 mr-2" />
                        Rider - Akses POS, leaderboard, laporan pribadi
                      </Button>
                      <Button
                        variant={selectedUser?.role === 'admin' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => handleRoleChange(selectedUser?.id, 'admin')}
                        disabled={saving}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Admin - Akses penuh kecuali kelola user
                      </Button>
                      <Button
                        variant={selectedUser?.role === 'super_admin' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => handleRoleChange(selectedUser?.id, 'super_admin')}
                        disabled={saving}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Super Admin - Akses penuh termasuk kelola user
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                // Create user form
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-sm">Email</label>
                    <input className="input" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                    <label className="text-sm">Nama Lengkap</label>
                    <input className="input" value={newFullName} onChange={e => setNewFullName(e.target.value)} />
                    <label className="text-sm">Telepon</label>
                    <input className="input" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                    <label className="text-sm">Password</label>
                    <input className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <label className="text-sm">Role</label>
                    <select className="input" value={newRole} onChange={e => setNewRole(e.target.value)}>
                      <option value="rider">Rider</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <Button className="w-full" onClick={async () => {
                      setSaving(true);
                      try {
                        // If current user is admin, force role to rider client-side to avoid accidental privilege escalation
                        const roleToCreate = (currentUser.role === 'admin' && newRole !== 'rider') ? 'rider' : newRole;
                        await usersAPI.create({ email: newEmail, password: newPassword, full_name: newFullName, phone: newPhone, role: roleToCreate });
                        setDialogOpen(false);
                        fetchUsers();
                        alert('Pengguna berhasil dibuat');
                      } catch (err) {
                        console.error('Error creating user:', err);
                        alert(err.response?.data?.error || 'Gagal membuat pengguna');
                      } finally {
                        setSaving(false);
                      }
                    }}>
                      Buat Pengguna
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
