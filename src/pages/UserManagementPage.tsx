import React, { useState, useEffect } from 'react'
import { supabase, type User, type Child } from '../lib/supabase'
import { Users, Plus, Trash2, UserPlus, Baby, Edit } from 'lucide-react'

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [showChildForm, setShowChildForm] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    username: '',
    role: 'parent' as 'parent' | 'teacher' | 'admin'
  })
  const [newChild, setNewChild] = useState({
    name: '',
    parent_id: '',
    birth_date: '',
    group_name: 'Grupa A',
    gender: '' as 'muški' | 'ženski' | '',
    allergies: '',
    additional_notes: '',
    photo_url: '',
    personal_id: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      setUploading(true)
      
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `child-photos/${fileName}`

      // Upload file to Supabase Storage
      const { error } = await supabase.storage
        .from('child-photos')
        .upload(filePath, file)

      if (error) {
        console.error('Error uploading file:', error)
        return null
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('child-photos')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error in uploadPhoto:', error)
      return null
    } finally {
      setUploading(false)
    }
  }

  const fetchData = async () => {
    try {
      // Use regular client for fetching data
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError
      setUsers(usersData || [])

      // Fetch children
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select(`
          *,
          users!children_parent_id_fkey(username)
        `)
        .order('name')

      if (childrenError) throw childrenError
      setChildren(childrenData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.email || !newUser.password || !newUser.username) {
      alert('Molimo unesite sve podatke')
      return
    }

    try {
      setSaving(true)

      // Use Edge function to create user
      const response = await fetch('/functions/v1/admin-create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          username: newUser.username,
          role: newUser.role
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create user')
      }

      setMessage('Korisnik je uspešno kreiran!')
      setNewUser({ email: '', password: '', username: '', role: 'parent' })
      setShowUserForm(false)
      await fetchData()
      
      setTimeout(() => setMessage(''), 5000)
    } catch (error: any) {
      console.error('Error creating user:', error)
      setMessage(`Greška pri kreiranju korisnika: ${error.message}`)
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const validatePersonalId = (personalId: string): boolean => {
    // Serbian personal ID validation (13 digits)
    const personalIdRegex = /^\d{13}$/
    return personalIdRegex.test(personalId)
  }

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChild.name || !newChild.parent_id) {
      setMessage('Molimo unesite ime deteta i izaberite roditelja.')
      return
    }

    // Validate personal ID if provided
    if (newChild.personal_id && !validatePersonalId(newChild.personal_id)) {
      setMessage('Matični broj mora imati tačno 13 cifara.')
      return
    }

    try {
      setSaving(true)

      let photoUrl = newChild.photo_url

      // Upload photo if selected
      if (selectedFile) {
        const uploadedUrl = await uploadPhoto(selectedFile)
        if (uploadedUrl) {
          photoUrl = uploadedUrl
        } else {
          setMessage('Greška pri upload-u fotografije.')
          return
        }
      }

      const { error } = await supabase
        .from('children')
        .insert([{
          id: crypto.randomUUID(), // Explicitly generate UUID
          name: newChild.name,
          parent_id: newChild.parent_id,
          birth_date: newChild.birth_date || null,
          group_name: newChild.group_name,
          gender: newChild.gender || null,
          allergies: newChild.allergies || null,
          additional_notes: newChild.additional_notes || null,
          photo_url: photoUrl || null,
          personal_id: newChild.personal_id || null
        }])

      if (error) throw error

      setMessage('Dete je uspešno registrovano!')
      setNewChild({
        name: '',
        parent_id: '',
        birth_date: '',
        group_name: 'Grupa A',
        gender: '',
        allergies: '',
        additional_notes: '',
        photo_url: '',
        personal_id: ''
      })
      setSelectedFile(null)
      setShowChildForm(false)
      await fetchData()
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      console.error('Error creating child:', error)
      setMessage(`Greška pri registraciji deteta: ${error.message}`)
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleEditChild = (child: Child) => {
    setEditingChild(child)
    setNewChild({
      name: child.name,
      parent_id: child.parent_id,
      birth_date: child.birth_date || '',
      group_name: child.group_name || 'Grupa A',
      gender: child.gender || '',
      allergies: child.allergies || '',
      additional_notes: child.additional_notes || '',
      photo_url: child.photo_url || '',
      personal_id: child.personal_id || ''
    })
    setSelectedFile(null)
    setShowEditForm(true)
  }

  const handleUpdateChild = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingChild || !newChild.name || !newChild.parent_id) {
      setMessage('Molimo unesite ime deteta i izaberite roditelja.')
      return
    }

    // Validate personal ID if provided
    if (newChild.personal_id && !validatePersonalId(newChild.personal_id)) {
      setMessage('Matični broj mora imati tačno 13 cifara.')
      return
    }

    try {
      setSaving(true)

      let photoUrl = newChild.photo_url

      // Upload photo if selected
      if (selectedFile) {
        const uploadedUrl = await uploadPhoto(selectedFile)
        if (uploadedUrl) {
          photoUrl = uploadedUrl
        } else {
          setMessage('Greška pri upload-u fotografije.')
          return
        }
      }

      const { error } = await supabase
        .from('children')
        .update({
          name: newChild.name,
          parent_id: newChild.parent_id,
          birth_date: newChild.birth_date || null,
          group_name: newChild.group_name,
          gender: newChild.gender || null,
          allergies: newChild.allergies || null,
          additional_notes: newChild.additional_notes || null,
          photo_url: photoUrl || null,
          personal_id: newChild.personal_id || null
        })
        .eq('id', editingChild.id)

      if (error) throw error

      setMessage('Informacije o detetu su uspešno ažurirane!')
      setEditingChild(null)
      setNewChild({
        name: '',
        parent_id: '',
        birth_date: '',
        group_name: 'Grupa A',
        gender: '',
        allergies: '',
        additional_notes: '',
        photo_url: '',
        personal_id: ''
      })
      setSelectedFile(null)
      setShowEditForm(false)
      await fetchData()
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      console.error('Error updating child:', error)
      setMessage(`Greška pri ažuriranju deteta: ${error.message}`)
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovog korisnika?')) {
      return
    }

    try {
      setSaving(true)

      // Use Edge function to delete user
      const response = await fetch('/functions/v1/admin-delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
        },
        body: JSON.stringify({
          userId: userId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete user')
      }

      setMessage('Korisnik je uspešno obrisan!')
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      console.error('Error deleting user:', error)
      setMessage(`Greška pri brisanju korisnika: ${error.message}`)
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteChild = async (childId: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovo dete?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId)

      if (error) throw error

      setMessage('Dete je uspešno obrisano!')
      await fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      console.error('Error deleting child:', error)
      setMessage(`Greška pri brisanju deteta: ${error.message}`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'teacher': return 'bg-blue-100 text-blue-800'
      case 'parent': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administracija'
      case 'teacher': return 'Vaspitač'
      case 'parent': return 'Roditelj'
      default: return 'Nepoznato'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Upravljanje korisnicima</h1>
              <p className="text-gray-600">Dodavanje roditelja, vaspitača, dece</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUserForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Dodaj korisnika
              </button>
              <button
                onClick={() => setShowChildForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
              >
                <Baby className="w-4 h-4 mr-2" />
                Dodaj dete
              </button>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('uspešno') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Create User Form */}
        {showUserForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Dodaj novog korisnika</h2>
              <button
                onClick={() => {
                  setShowUserForm(false)
                  setNewUser({ email: '', password: '', username: '', role: 'parent' })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Korisničko ime
                  </label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lozinka
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uloga
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="parent">Roditelj</option>
                    <option value="teacher">Vaspitač</option>
                    <option value="admin">Administracija</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Kreiraj korisnika
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserForm(false)
                    setNewUser({ email: '', password: '', username: '', role: 'parent' })
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Otkaži
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Create Child Form */}
        {showChildForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Dodaj novo dete</h2>
              <button
                onClick={() => {
                  setShowChildForm(false)
                  setNewChild({ 
                    name: '', 
                    parent_id: '', 
                    birth_date: '', 
                    group_name: 'Grupa A',
                    gender: '',
                    allergies: '',
                    additional_notes: '',
                    photo_url: '',
                    personal_id: ''
                  })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChild} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ime deteta
                  </label>
                  <input
                    type="text"
                    value={newChild.name}
                    onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roditelj
                  </label>
                  <select
                    value={newChild.parent_id}
                    onChange={(e) => setNewChild({ ...newChild, parent_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Izaberite roditelja</option>
                    {users.filter(user => user.role === 'parent').map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Datum rođenja
                  </label>
                  <input
                    type="date"
                    value={newChild.birth_date}
                    onChange={(e) => setNewChild({ ...newChild, birth_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grupa
                  </label>
                  <select
                    value={newChild.group_name}
                    onChange={(e) => setNewChild({ ...newChild, group_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Grupa A">Grupa A</option>
                    <option value="Grupa B">Grupa B</option>
                    <option value="Grupa C">Grupa C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pol
                  </label>
                  <select
                    value={newChild.gender}
                    onChange={(e) => setNewChild({ ...newChild, gender: e.target.value as 'muški' | 'ženski' | '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Izaberite pol</option>
                    <option value="muški">Muški</option>
                    <option value="ženski">Ženski</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matični broj
                  </label>
                  <input
                    type="text"
                    value={newChild.personal_id}
                    onChange={(e) => setNewChild({ ...newChild, personal_id: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      newChild.personal_id && !validatePersonalId(newChild.personal_id)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Unesite matični broj (13 cifara)"
                    maxLength={13}
                  />
                  {newChild.personal_id && !validatePersonalId(newChild.personal_id) && (
                    <p className="text-sm text-red-600 mt-1">
                      Matični broj mora imati tačno 13 cifara
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alergije
                </label>
                <textarea
                  value={newChild.allergies}
                  onChange={(e) => setNewChild({ ...newChild, allergies: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Unesite alergije deteta (opciono)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dodatne beleške
                </label>
                <textarea
                  value={newChild.additional_notes}
                  onChange={(e) => setNewChild({ ...newChild, additional_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Dodatne beleške o detetu (opciono)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotografija deteta
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedFile(file)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Izabrana datoteka: {selectedFile.name}
                  </p>
                )}
                {uploading && (
                  <p className="text-sm text-blue-600 mt-1">
                    Upload u toku...
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Izaberite fotografiju deteta (opciono)
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Registruj dete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChildForm(false)
                    setNewChild({ 
                      name: '', 
                      parent_id: '', 
                      birth_date: '', 
                      group_name: 'Grupa A',
                      gender: '',
                      allergies: '',
                      additional_notes: '',
                      photo_url: '',
                      personal_id: ''
                    })
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Otkaži
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Child Form */}
        {showEditForm && editingChild && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Izmeni informacije o detetu</h2>
              <button
                onClick={() => {
                  setShowEditForm(false)
                  setEditingChild(null)
                  setNewChild({ 
                    name: '', 
                    parent_id: '', 
                    birth_date: '', 
                    group_name: 'Grupa A',
                    gender: '',
                    allergies: '',
                    additional_notes: '',
                    photo_url: '',
                    personal_id: ''
                  })
                  setSelectedFile(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateChild} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ime deteta
                  </label>
                  <input
                    type="text"
                    value={newChild.name}
                    onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roditelj
                  </label>
                  <select
                    value={newChild.parent_id}
                    onChange={(e) => setNewChild({ ...newChild, parent_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Izaberite roditelja</option>
                    {users.filter(user => user.role === 'parent').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Datum rođenja
                  </label>
                  <input
                    type="date"
                    value={newChild.birth_date}
                    onChange={(e) => setNewChild({ ...newChild, birth_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grupa
                  </label>
                  <select
                    value={newChild.group_name}
                    onChange={(e) => setNewChild({ ...newChild, group_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Grupa A">Grupa A</option>
                    <option value="Grupa B">Grupa B</option>
                    <option value="Grupa C">Grupa C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pol
                  </label>
                  <select
                    value={newChild.gender}
                    onChange={(e) => setNewChild({ ...newChild, gender: e.target.value as 'muški' | 'ženski' | '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Izaberite pol</option>
                    <option value="muški">Muški</option>
                    <option value="ženski">Ženski</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matični broj
                  </label>
                  <input
                    type="text"
                    value={newChild.personal_id}
                    onChange={(e) => setNewChild({ ...newChild, personal_id: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      newChild.personal_id && !validatePersonalId(newChild.personal_id)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Unesite matični broj (13 cifara)"
                    maxLength={13}
                  />
                  {newChild.personal_id && !validatePersonalId(newChild.personal_id) && (
                    <p className="text-sm text-red-600 mt-1">
                      Matični broj mora imati tačno 13 cifara
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alergije
                </label>
                <textarea
                  value={newChild.allergies}
                  onChange={(e) => setNewChild({ ...newChild, allergies: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Unesite alergije deteta (opciono)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dodatne beleške
                </label>
                <textarea
                  value={newChild.additional_notes}
                  onChange={(e) => setNewChild({ ...newChild, additional_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Dodatne beleške o detetu (opciono)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotografija deteta
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedFile(file)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Izabrana datoteka: {selectedFile.name}
                  </p>
                )}
                {uploading && (
                  <p className="text-sm text-blue-600 mt-1">
                    Upload u toku...
                  </p>
                )}
                {editingChild.photo_url && !selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Trenutna fotografija: {editingChild.photo_url}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Izaberite novu fotografiju deteta (opciono)
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {saving || uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Edit className="w-4 h-4 mr-2" />
                  )}
                  Ažuriraj dete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingChild(null)
                    setNewChild({ 
                      name: '', 
                      parent_id: '', 
                      birth_date: '', 
                      group_name: 'Grupa A',
                      gender: '',
                      allergies: '',
                      additional_notes: '',
                      photo_url: '',
                      personal_id: ''
                    })
                    setSelectedFile(null)
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Otkaži
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <Users className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Korisnici ({users.length})</h2>
            </div>

            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.username}</h3>
                      <p className="text-sm text-gray-600">{user.email || 'Nema email'}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Children List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <Baby className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold">Deca ({children.length})</h2>
            </div>

            <div className="space-y-4">
              {children.map((child) => (
                <div key={child.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        {child.photo_url ? (
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            <img 
                              src={child.photo_url} 
                              alt={`${child.name} fotografija`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 text-xs">📷</span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{child.name}</h3>
                          {child.gender && (
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {child.gender}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>Roditelj: {child.users?.username || 'Nepoznato'}</p>
                        <p>Grupa: {child.group_name || 'Nepoznato'}</p>
                        <p>Rođen: {child.birth_date ? formatDate(child.birth_date) : 'Nepoznato'}</p>
                        {child.personal_id && <p>Matični broj: {child.personal_id}</p>}
                      </div>
                      
                      {child.allergies && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-red-600">⚠️ Alergije:</p>
                          <p className="text-sm text-red-600">{child.allergies}</p>
                        </div>
                      )}
                      
                      {child.additional_notes && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">📝 Dodatne beleške:</p>
                          <p className="text-sm text-gray-600">{child.additional_notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditChild(child)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Izmeni dete"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteChild(child.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Obriši dete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserManagementPage
