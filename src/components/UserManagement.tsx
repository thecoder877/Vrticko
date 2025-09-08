import React, { useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { createUserAdmin } from '../utils/adminUsers' // ✅ koristi Edge funkciju

const UserManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    username: '',
    full_name: '',
    role: 'parent' as 'parent' | 'teacher' | 'admin'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // ✅ pozovi Edge funkciju (service role na serveru)
      const res = await createUserAdmin({
        email: newUser.email.trim(),
        password: newUser.password,
        username: newUser.username.trim(),
        role: newUser.role,
        full_name: newUser.full_name?.trim() || undefined,
      })

      setMessage(`Korisnik je uspešno kreiran! (id: ${res?.userId ?? '—'})`)
      setNewUser({ email: '', password: '', username: '', full_name: '', role: 'parent' })
      setShowCreateForm(false)
    } catch (err: any) {
      setMessage(`Greška pri kreiranju korisnika: ${err?.message || 'Nepoznata greška'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Upravljanje korisnicima</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Dodaj korisnika
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Kreiraj novog korisnika</h3>
          <form onSubmit={createUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lozinka
              </label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ime i prezime (opciono)
              </label>
              <input
                type="text"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="npr. Marko Marković"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uloga
              </label>
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value as 'parent' | 'teacher' | 'admin' })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="parent">Roditelj</option>
                <option value="teacher">Vaspitač</option>
                <option value="admin">Administracija</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Kreiranje...' : 'Kreiraj korisnika'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Otkaži
              </button>
            </div>
          </form>
        </div>
      )}

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.toLowerCase().includes('greška') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Lista korisnika
        </h3>
        <p className="text-gray-600">
          Funkcionalnost za prikaz i upravljanje postojećim korisnicima će biti dodata u sledećoj verziji.
        </p>
      </div>
    </div>
  )
}

export default UserManagement
