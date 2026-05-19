import { useEffect, useState } from 'react';
import { SquaresFour, Users, CalendarBlank, UserGear, ChartBar, Bell, Plus } from '@phosphor-icons/react';
import Sidebar from '../components/Sidebar';
import { api } from '../services/api';

const admin = { name: 'Super Admin', initials: 'SA', role: 'Administrator' };

const sidebarLinks = [
  { label: 'Overview', items: [
    { label: 'Dashboard',          to: '/admin-dashboard', icon: SquaresFour },
    { label: 'Doctor Management',  to: '/admin-dashboard', icon: UserGear },
    { label: 'Appointments',       to: '/admin-dashboard', icon: CalendarBlank, badge: '8' },
    { label: 'User Management',    to: '/admin-dashboard', icon: Users },
    { label: 'Reports & Analytics',to: '/admin-dashboard', icon: ChartBar },
  ]},
];

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
  const max = Math.max(...data.map(d => d.val));
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

  const statCards = [
    { label: 'Total Users',        val: stats.totalUsers,    color: 'bg-blue-light',  text: 'text-blue',   change: 'Live platform total',  up: true },
    { label: 'Active Doctors',     val: stats.totalDoctors,  color: 'bg-green-light', text: 'text-green',  change: 'Verified providers',   up: true },
    { label: 'Total Appointments', val: stats.totalAppointments, color: 'bg-amber-light', text: 'text-amber', change: 'Recent bookings', up: true },
    { label: 'Loaded Users',       val: users.length,        color: 'bg-purple-light', text:'text-purple', change: 'Active user list',      up: true },
  ];

  const weekData = [
    { label:'Mon',val:60 },{ label:'Tue',val:95 },{ label:'Wed',val:75 },
    { label:'Thu',val:110 },{ label:'Fri',val:85 },{ label:'Sat',val:50 },{ label:'Sun',val:30 },
  ];

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

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar links={sidebarLinks} role={admin.role} user={admin} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-border px-8 h-[68px] flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-[18px] font-bold text-dark">Admin Dashboard</h2>
          <div className="flex items-center gap-3">
            <button className="btn-primary text-[13px] py-2 px-[18px]"><Plus size={14} weight="bold"/>Add Doctor</button>
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
            {[['overview','Overview'],['doctors','Doctors'],['appointments','Appointments'],['users','Users']].map(([t,l]) => (
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
                    {[
                      { name:'General',    pct:35, color:'bg-blue' },
                      { name:'Cardiology', pct:22, color:'bg-red' },
                      { name:'Pediatrics', pct:18, color:'bg-green' },
                      { name:'Neurology',  pct:15, color:'bg-amber' },
                      { name:'Other',      pct:10, color:'bg-purple' },
                    ].map(s => (
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
                <button className="btn-success text-[13px] py-2 px-[18px]"><Plus size={14} weight="bold"/>Add Doctor</button>
              </div>

              <div className="card-static p-6">
                <h4 className="text-[16px] font-bold text-dark mb-3">Pending Doctor Approvals</h4>
                {pendingDoctors.length === 0 ? (
                  <p className="text-[13px] text-muted">No pending doctor applications at the moment.</p>
                ) : (
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Specialty</th><th>Hospital</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {pendingDoctors.map(d => (
                        <tr key={d.id}>
                          <td>{d.full_name}</td>
                          <td className="text-slate text-[13px]">{d.email}</td>
                          <td className="text-slate text-[13px]">{d.specialty}</td>
                          <td className="text-slate text-[13px]">{d.hospital}</td>
                          <td><StatusBadge s="review" /></td>
                          <td className="flex gap-2">
                            <button onClick={() => handleDoctorStatus(d.id, 'active')} disabled={actionLoading} className="action-btn action-btn-green">Approve</button>
                            <button onClick={() => handleDoctorStatus(d.id, 'rejected')} disabled={actionLoading} className="action-btn action-btn-red">Reject</button>
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
                        <td><div className="flex gap-2"><button className="action-btn action-btn-blue">View</button><button className="action-btn action-btn-red">Suspend</button></div></td>
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
                      <td><div className="flex gap-2"><button className="action-btn action-btn-blue">View</button><button className="action-btn action-btn-red">Cancel</button></div></td>
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
                          <button className="action-btn action-btn-blue">View</button>
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
        </div>
      </div>
    </div>
  );
}
