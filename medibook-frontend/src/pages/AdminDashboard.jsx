import { useEffect, useMemo, useState } from 'react';
import { SquaresFour, Users, CalendarBlank, UserGear, ChartBar, Bell, Plus } from '@phosphor-icons/react';
import Sidebar from '../components/Sidebar';
import { api } from '../services/api';

const admin = { name: 'Super Admin', initials: 'SA', role: 'Administrator' };

const StatusBadge = ({ s }) => ({
  confirmed: <span className="badge badge-green">Confirmed</span>,
  pending:   <span className="badge badge-amber">Pending</span>,
  completed: <span className="badge badge-grey">Completed</span>,
  cancelled: <span className="badge badge-red">Cancelled</span>,
  active:    <span className="badge badge-green">Active</span>,
  blocked:   <span className="badge badge-red">Blocked</span>,
  review:    <span className="badge badge-amber">Review</span>,
}[s] || <span className="badge badge-grey">{s}</span>);

const BarChart = ({ data }) => {
  const max = Math.max(1, ...data.map(d => d.val));
  return (
    <div className="flex items-end gap-3 h-[140px] mt-4">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-[11px] text-muted font-medium">{d.val}</span>
          <div className="w-full rounded-t-sm transition-all duration-700"
            style={{ height: `${(d.val / max) * 110}px`, background: d.val === max ? '#1A6EBF' : '#EBF5FF', minHeight: 4 }} />
          <span className="text-[11px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({ totalUsers: 0, totalDoctors: 0, totalAppointments: 0 });
  const [doctors, setDoctors] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    user_id: '',
    specialty: '',
    hospital: '',
    experience_years: '',
    fee: '',
    gender: 'Male',
    bio: '',
  });

  const sidebarLinks = useMemo(() => [
    { label: 'Overview', items: [
      { label: 'Dashboard', icon: SquaresFour, onClick: () => setTab('overview'), active: tab === 'overview' },
      { label: 'Doctor Management', icon: UserGear, onClick: () => setTab('doctors'), active: tab === 'doctors' },
      { label: 'Appointments', icon: CalendarBlank, badge: String(appointments.length), onClick: () => setTab('appointments'), active: tab === 'appointments' },
      { label: 'User Management', icon: Users, onClick: () => setTab('users'), active: tab === 'users' },
      { label: 'Reports & Analytics', icon: ChartBar, onClick: () => setTab('reports'), active: tab === 'reports' },
    ]},
  ], [appointments.length, tab]);

  const statCards = [
    { label: 'Total Users',        val: stats.totalUsers,    color: 'bg-blue-light',  text: 'text-blue',   change: 'Live platform total',  up: true },
    { label: 'Active Doctors',     val: stats.totalDoctors,  color: 'bg-green-light', text: 'text-green',  change: 'Verified providers',   up: true },
    { label: 'Total Appointments', val: stats.totalAppointments, color: 'bg-amber-light', text: 'text-amber', change: 'Recent bookings', up: true },
    { label: 'Loaded Users',       val: users.length,        color: 'bg-purple-light', text:'text-purple', change: 'Active user list',      up: true },
  ];

  const weekData = useMemo(() => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totals = dayLabels.reduce((acc, label) => ({ ...acc, [label]: 0 }), {});

    appointments.forEach((appointment) => {
      if (!appointment.appointment_date) return;
      const day = dayLabels[new Date(appointment.appointment_date).getDay()];
      totals[day] += 1;
    });

    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(label => ({
      label,
      val: totals[label],
    }));
  }, [appointments]);

  const specialtyData = useMemo(() => {
    const counts = doctors.reduce((acc, doctor) => {
      const key = doctor.specialty || 'Unspecified';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const total = Math.max(doctors.length, 1);
    return Object.entries(counts).map(([name, count], index) => ({
      name,
      pct: Math.round((count / total) * 100),
      color: ['bg-blue', 'bg-red', 'bg-green', 'bg-amber', 'bg-purple'][index % 5],
    }));
  }, [doctors]);

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statsData, usersData, appointmentsData, doctorsData, pendingDoctorsData] = await Promise.all([
          api.getAdminStats(),
          api.getUsers(),
          api.getAllAppointments(),
          api.getAllDoctors(),
          api.getPendingDoctors(),
        ]);

        setStats(statsData);
        setUsers(usersData);
        setAppointments(appointmentsData);
        setDoctors(doctorsData);
        setPendingDoctors(pendingDoctorsData);
      } catch (err) {
        setError(err.message || 'Unable to load admin data.');
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const handleToggleBlock = async (id) => {
    if (!window.confirm('Toggle block status for this user?')) return;
    setActionLoading(true);

    try {
      await api.toggleBlockUser(id);
      const updatedUsers = await api.getUsers();
      setUsers(updatedUsers);
    } catch (err) {
      window.alert(err.message || 'Unable to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDoctorStatus = async (doctorId, status) => {
    if (!window.confirm(`Set doctor status to ${status}?`)) return;
    setActionLoading(true);

    try {
      await api.updateDoctorStatus(doctorId, status);
      const [updatedDoctors, updatedPending] = await Promise.all([
        api.getAllDoctors(),
        api.getPendingDoctors(),
      ]);
      setDoctors(updatedDoctors);
      setPendingDoctors(updatedPending);
    } catch (err) {
      window.alert(err.message || 'Unable to update doctor status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      await api.addDoctor({
        user_id: newDoctor.user_id,
        specialty: newDoctor.specialty,
        hospital: newDoctor.hospital,
        experience_years: newDoctor.experience_years,
        fee: newDoctor.fee,
        gender: newDoctor.gender,
        bio: newDoctor.bio,
      });

      const [updatedDoctors, updatedPending] = await Promise.all([
        api.getAllDoctors(),
        api.getPendingDoctors(),
      ]);
      setDoctors(updatedDoctors);
      setPendingDoctors(updatedPending);
      setNewDoctor({ user_id: '', specialty: '', hospital: '', experience_years: '', fee: '', gender: 'Male', bio: '' });
      setShowAddDoctor(false);
    } catch (err) {
      window.alert(err.message || 'Unable to add doctor.');
    } finally {
      setActionLoading(false);
    }
  };

  const showDoctorDetails = (doctor) => {
    window.alert([
      `Doctor: ${doctor.full_name}`,
      `Email: ${doctor.email || 'N/A'}`,
      `Specialty: ${doctor.specialty || 'N/A'}`,
      `Hospital: ${doctor.hospital || 'N/A'}`,
      `Status: ${doctor.status || 'active'}`,
    ].join('\n'));
  };

  const showUserDetails = (user) => {
    window.alert([
      `User: ${user.full_name}`,
      `Email: ${user.email}`,
      `Role: ${user.role}`,
      `Status: ${user.is_blocked ? 'Blocked' : 'Active'}`,
    ].join('\n'));
  };

  const showAppointmentDetails = (appointment) => {
    window.alert([
      `Appointment #${appointment.id}`,
      `Patient: ${appointment.patient_name}`,
      `Doctor: ${appointment.doctor_name}`,
      `Date: ${new Date(appointment.appointment_date).toLocaleDateString()}`,
      `Time: ${appointment.time_slot}`,
      `Status: ${appointment.status}`,
    ].join('\n'));
  };

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar links={sidebarLinks} role={admin.role} user={admin} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-border px-8 h-[68px] flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-[18px] font-bold text-dark">Admin Dashboard</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => { setTab('doctors'); setShowAddDoctor(true); }} className="btn-primary text-[13px] py-2 px-[18px]"><Plus size={14} weight="bold"/>Add Doctor</button>
            <button className="relative w-[38px] h-[38px] border border-border rounded-sm flex items-center justify-center">
              <Bell size={18} className="text-slate" />
              <span className="absolute top-[7px] right-[7px] w-2 h-2 bg-red rounded-full border-2 border-white" />
            </button>
          </div>
        </div>

        <div className="p-8 flex-1">
          <div className="mb-7">
            <h1 className="font-fraunces text-[28px] font-semibold text-dark">Platform Overview</h1>
            <p className="text-[15px] text-muted mt-1">Monday, May 8, 2024 — All systems operational.</p>
            {loading && <p className="text-[13px] text-blue mt-2">Loading admin data...</p>}
            {error && <p className="text-[13px] text-red mt-2">{error}</p>}
          </div>

          <div className="flex gap-1 bg-white border border-border rounded-sm p-1 w-fit mb-7 flex-wrap">
            {[['overview','Overview'],['doctors','Doctors'],['appointments','Appointments'],['users','Users'],['reports','Reports']].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-sm text-[14px] font-medium transition-all ${t===tab?'bg-blue text-white shadow-sm':'text-slate hover:text-dark'}`}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map(s => (
                  <div key={s.label} className="card-static p-6">
                    <div className={`w-[52px] h-[52px] ${s.color} rounded-sm flex items-center justify-center mb-3`}>
                      <Users size={26} className={s.text} weight="duotone" />
                    </div>
                    <p className={`text-[28px] font-bold leading-none ${s.text}`}>{s.val}</p>
                    <p className="text-[13px] text-muted mt-1">{s.label}</p>
                    <p className="text-[12px] mt-1.5 font-semibold text-green">{s.change}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-[2fr_1fr] gap-5">
                <div className="card-static p-6">
                  <h4 className="text-[16px] font-bold text-dark">Appointments This Week</h4>
                  <p className="text-[13px] text-muted mt-0.5">Daily booking volume</p>
                  <BarChart data={weekData} />
                </div>
                <div className="card-static p-6">
                  <h4 className="text-[16px] font-bold text-dark mb-5">Specialty Breakdown</h4>
                  <div className="space-y-3.5">
                    {(specialtyData.length ? specialtyData : [{ name: 'No doctors yet', pct: 0, color: 'bg-blue' }]).map(s => (
                      <div key={s.name}>
                        <div className="flex justify-between text-[13px] text-slate mb-1">
                          <span>{s.name}</span><span className="font-semibold text-dark">{s.pct}%</span>
                        </div>
                        <div className="h-2 bg-bg rounded-full overflow-hidden">
                          <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'doctors' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[17px] font-bold text-dark">Doctor Management</h3>
                <button onClick={() => setShowAddDoctor(!showAddDoctor)} className="btn-success text-[13px] py-2 px-[18px]"><Plus size={14} weight="bold"/>Add Doctor</button>
              </div>

              {showAddDoctor && (
                <form onSubmit={handleAddDoctor} className="card-static p-6 grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label block mb-1.5">Existing User ID</label>
                    <input value={newDoctor.user_id} onChange={e => setNewDoctor({ ...newDoctor, user_id: e.target.value })} className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label block mb-1.5">Specialty</label>
                    <input value={newDoctor.specialty} onChange={e => setNewDoctor({ ...newDoctor, specialty: e.target.value })} className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label block mb-1.5">Hospital / Clinic</label>
                    <input value={newDoctor.hospital} onChange={e => setNewDoctor({ ...newDoctor, hospital: e.target.value })} className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label block mb-1.5">Experience Years</label>
                    <input type="number" value={newDoctor.experience_years} onChange={e => setNewDoctor({ ...newDoctor, experience_years: e.target.value })} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label block mb-1.5">Fee</label>
                    <input type="number" value={newDoctor.fee} onChange={e => setNewDoctor({ ...newDoctor, fee: e.target.value })} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label block mb-1.5">Gender</label>
                    <select value={newDoctor.gender} onChange={e => setNewDoctor({ ...newDoctor, gender: e.target.value })} className="form-input">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label block mb-1.5">Bio</label>
                    <textarea value={newDoctor.bio} onChange={e => setNewDoctor({ ...newDoctor, bio: e.target.value })} className="form-input min-h-[90px]" />
                  </div>
                  <div className="md:col-span-2 flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowAddDoctor(false)} className="btn-ghost text-[13px] py-2 px-[18px]">Cancel</button>
                    <button type="submit" disabled={actionLoading} className="btn-primary text-[13px] py-2 px-[18px]">{actionLoading ? 'Adding...' : 'Save Doctor'}</button>
                  </div>
                </form>
              )}

              <div className="card-static p-6">
                <h4 className="text-[16px] font-bold text-dark mb-3">Pending Doctor Approvals</h4>
                {pendingDoctors.length === 0 ? (
                  <p className="text-[13px] text-muted">No pending doctor applications at the moment.</p>
                ) : (
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Specialty</th><th>Hospital</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {pendingDoctors.map(d => (
                        <tr key={d.doctor_id}>
                          <td>{d.full_name}</td>
                          <td className="text-slate text-[13px]">{d.email}</td>
                          <td className="text-slate text-[13px]">{d.specialty}</td>
                          <td className="text-slate text-[13px]">{d.hospital}</td>
                          <td><StatusBadge s="review" /></td>
                          <td className="flex gap-2">
                            <button onClick={() => handleDoctorStatus(d.doctor_id, 'active')} disabled={actionLoading} className="action-btn action-btn-green">Approve</button>
                            <button onClick={() => handleDoctorStatus(d.doctor_id, 'inactive')} disabled={actionLoading} className="action-btn action-btn-red">Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div>
                <h4 className="text-[16px] font-bold text-dark mb-3">Active Doctors</h4>
                <table className="data-table">
                  <thead><tr><th>Doctor</th><th>Specialty</th><th>Hospital</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {doctors.map(d => (
                      <tr key={d.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-[38px] h-[38px] rounded-full bg-blue-light text-blue grid place-items-center font-semibold text-sm">
                              {d.full_name?.split(' ').map(n => n[0]).join('') || 'D'}
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-dark">{d.full_name}</p>
                              <p className="text-[12px] text-muted">{d.gender || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-slate">{d.specialty}</td>
                        <td className="text-slate text-[13px]">{d.hospital}</td>
                        <td className="text-slate text-[13px]">{d.email}</td>
                        <td><StatusBadge s="active" /></td>
                        <td><div className="flex gap-2"><button onClick={() => showDoctorDetails(d)} className="action-btn action-btn-blue">View</button><button onClick={() => handleDoctorStatus(d.id, 'inactive')} disabled={actionLoading} className="action-btn action-btn-red">Suspend</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'appointments' && (
            <div className="animate-fade-in">
              <h3 className="text-[17px] font-bold text-dark mb-4">All Appointments</h3>
              <table className="data-table">
                <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td className="font-mono text-[12px] text-muted">{a.id}</td>
                      <td className="font-medium text-dark">{a.patient_name}</td>
                      <td className="text-slate">{a.doctor_name}</td>
                      <td className="text-slate">{new Date(a.appointment_date).toLocaleDateString()}</td>
                      <td className="text-slate">{a.time_slot}</td>
                      <td className="text-slate">{a.type || 'In-person'}</td>
                      <td><StatusBadge s={a.status} /></td>
                      <td><div className="flex gap-2"><button onClick={() => showAppointmentDetails(a)} className="action-btn action-btn-blue">View</button><button onClick={() => api.updateAppointmentStatus(a.id, 'cancelled').then(() => api.getAllAppointments()).then(setAppointments).catch(err => window.alert(err.message || 'Unable to cancel appointment.'))} className="action-btn action-btn-red">Cancel</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'users' && (
            <div className="animate-fade-in">
              <h3 className="text-[17px] font-bold text-dark mb-4">User Management</h3>
              <table className="data-table">
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-[38px] h-[38px] rounded-full bg-blue-light text-blue grid place-items-center font-semibold text-sm">
                            {u.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </div>
                          <p className="text-[14px] font-semibold text-dark">{u.full_name}</p>
                        </div>
                      </td>
                      <td className="text-slate">{u.email}</td>
                      <td className="text-slate">{u.role}</td>
                      <td className="text-slate">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td><StatusBadge s={u.is_blocked ? 'blocked' : 'active'} /></td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => showUserDetails(u)} className="action-btn action-btn-blue">View</button>
                          <button onClick={() => handleToggleBlock(u.id)} disabled={actionLoading} className={`action-btn ${u.is_blocked ? 'action-btn-green' : 'action-btn-red'}`}>
                            {u.is_blocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'reports' && (
            <div className="animate-fade-in grid lg:grid-cols-2 gap-5">
              <div className="card-static p-6">
                <h3 className="text-[17px] font-bold text-dark">Platform Totals</h3>
                <div className="mt-5 space-y-3">
                  <p className="flex justify-between text-[14px] text-slate"><span>Users</span><strong className="text-dark">{stats.totalUsers}</strong></p>
                  <p className="flex justify-between text-[14px] text-slate"><span>Doctors</span><strong className="text-dark">{stats.totalDoctors}</strong></p>
                  <p className="flex justify-between text-[14px] text-slate"><span>Appointments</span><strong className="text-dark">{stats.totalAppointments}</strong></p>
                  <p className="flex justify-between text-[14px] text-slate"><span>Pending approvals</span><strong className="text-dark">{pendingDoctors.length}</strong></p>
                </div>
              </div>
              <div className="card-static p-6">
                <h3 className="text-[17px] font-bold text-dark">Specialty Breakdown</h3>
                <BarChart data={(specialtyData.length ? specialtyData : [{ name: 'None', pct: 0 }]).map(s => ({ label: s.name.slice(0, 8), val: s.pct }))} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
