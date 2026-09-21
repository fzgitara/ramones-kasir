import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, UserCheck } from 'lucide-react'

export function AttendanceReportPage() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email')

      if (error || !data) return
      setUsers(data)
    }
    fetchUsers()
  }, [])

  const fetchSessions = async () => {
    setLoading(true)
    let query = supabase
      .from('attendances')
      .select('*')
      .order('check_in_at', { ascending: false })

    if (selectedUser) query = query.eq('user_id', selectedUser)
    if (selectedDate) query = query.eq('attendance_date', selectedDate)

    const { data, error } = await query
    setLoading(false)

    if (error) {
      console.error(error)
      return
    }
    setSessions(data || [])
  }

  useEffect(() => {
    fetchSessions()
  }, [selectedUser, selectedDate])

  const getUserLabel = (userId) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return userId
    return user.full_name || user.email
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Laporan Absensi</h1>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-4 sm:p-6 border border-neutral-200 dark:border-neutral-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="input"
            >
              <option value="">Semua user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tanggal</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-neutral-500 dark:text-neutral-400">Memuat…</p>
      ) : sessions.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">Tidak ada data absensi.</p>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Masuk</th>
                <th className="px-4 py-3 font-semibold">Keluar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                    {getUserLabel(session.user_id)}
                  </td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{session.attendance_date}</td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                    {session.check_in_at ? new Date(session.check_in_at).toLocaleTimeString('id-ID') : '-'}
                  </td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                    {session.check_out_at ? new Date(session.check_out_at).toLocaleTimeString('id-ID') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
