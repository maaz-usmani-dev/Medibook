import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  SquaresFour, CalendarBlank, MagnifyingGlass,
  User, Bell, PencilSimple, FloppyDisk
} from '@phosphor-icons/react';
import Sidebar from '../components/Sidebar';
import { api } from '../services/api';

const fallbackImg = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=84&h=84&fit=crop&crop=face';

const initialsFromName = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

const mapProfile = (data = {}) => ({
  name: data.full_name || data.name || 'Patient',
  initials: initialsFromName(data.full_name || data.name),
  role: 'Patient Account',
  img: fallbackImg,
  email: data.email || '',
  phone: data.phone || '',
  dob: data.date_of_birth ? String(data.date_of_birth).slice(0, 10) : '',
  gender: data.gender || '',
});

const sidebarLinks = [
  { label: 'Main', items: [
    { label: 'Dashboard',      to: '/patient-dashboard', icon: SquaresFour },
    { label: 'Appointments',   to: '/patient-dashboard', icon: CalendarBlank, badge: '2' },
    { label: 'Find Doctors',   to: '/doctors',           icon: MagnifyingGlass },
  ]},
  { label: 'Account', items: [
    { label: 'My Profile',     to: '/patient-dashboard', icon: User },
    { label: 'Notifications',  to: '/patient-dashboard', icon: Bell },
  ]},
];

const StatusBadge = ({ s }) => ({
  confirmed: <span className="badge badge-green">Confirmed</span>,
  pending:   <span className="badge badge-amber">Pending</span>,
  completed: <span className="badge badge-grey">Completed</span>,
  cancelled: <span className="badge badge-red">Cancelled</span>,
}[s]);

const TypeBadge = ({ t }) => t === 'Video'
  ? <span className="badge badge-purple">Video</span>
  : <span className="badge badge-blue">In-person</span>;

export default function PatientDashboard() {
  const [tab, setTab]         = useState('dashboard');
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(() => {
    const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    return mapProfile(storedUser);
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    api.getMe()
      .then(data => setProfile(mapProfile(data)))
      .catch(() => {});
  }, []);

  const handleCancel = async (id) => {
    const confirmed = window.confirm('Cancel this appointment?');
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await api.updateAppointmentStatus(id, 'cancelled');
      await fetchAppointments();
    } catch (err) {
      window.alert(err.message || 'Unable to cancel appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (id) => {
    const appointment_date = window.prompt('Enter new date (YYYY-MM-DD)');
    if (!appointment_date) return;
    const time_slot = window.prompt('Enter new time slot (e.g. 02:30 PM)');
    if (!time_slot) return;

    setActionLoading(true);
    try {
      await api.rescheduleAppointment(id, appointment_date, time_slot);
      await fetchAppointments();
      window.alert('Appointment rescheduled successfully.');
    } catch (err) {
      window.alert(err.message || 'Unable to reschedule appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      const updated = await api.updateMe({
        full_name: profile.name,
        phone: profile.phone,
        date_of_birth: profile.dob,
        gender: profile.gender,
      });
      const mapped = mapProfile(updated);
      setProfile(mapped);
      localStorage.setItem('user', JSON.stringify({
        id: updated.id,
        full_name: updated.full_name,
        email: updated.email,
        role: updated.role,
      }));
      setEditing(false);
    } catch (err) {
      window.alert(err.message || 'Unable to save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const upcoming = useMemo(() =>
    appointments.filter(a => ['confirmed', 'pending'].includes(a.status)),
    [appointments]
  );

  const past = useMemo(() =>
    appointments.filter(a => ['completed', 'cancelled'].includes(a.status)),
    [appointments]
  );

  const stats = useMemo(() => [
    { label: 'Total Appointments', val: appointments.length, color: 'bg-blue-light', iconColor: 'text-blue', change: 'Updated live', up: true },
    { label: 'Upcoming', val: upcoming.length, color: 'bg-green-light', iconColor: 'text-green', change: 'Next appointment soon', up: true },
    { label: 'Completed', val: past.filter(a => a.status === 'completed').length, color: 'bg-amber-light', iconColor: 'text-amber', change: 'Recent visits', up: true },
    { label: 'Cancelled', val: past.filter(a => a.status === 'cancelled').length, color: 'bg-red-light', iconColor: 'text-red', change: 'Recently cancelled', up: false },
  ], [appointments, past, upcoming]);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar
        links={sidebarLinks.map(group => ({
          ...group,
          items: group.items.map(item => item.label === 'Dashboard'
            ? { ...item, onClick: () => setTab('dashboard'), active: tab === 'dashboard' }
            : item.label === 'Appointments'
            ? { ...item, onClick: () => setTab('appointments'), active: tab === 'appointments', badge: String(upcoming.length) }
            : item.label === 'My Profile'
            ? { ...item, onClick: () => setTab('profile'), active: tab === 'profile' }
            : item)
        }))}
        role={profile.role}
        user={{ name: profile.name, initials: profile.initials, img: profile.img }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <div className="bg-white border-b border-border px-8 h-[68px] flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-[18px] font-bold text-dark">Dashboard</h2>
          <div className="flex items-center gap-3.5">
            <button className="relative w-[38px] h-[38px] border border-border rounded-sm flex items-center justify-center">
              <Bell size={18} className="text-slate" />
              <span className="absolute top-[7px] right-[7px] w-2 h-2 bg-red rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-2.5 cursor-pointer px-2.5 py-1.5 rounded-sm hover:bg-bg transition-colors">
              <img src={profile.img} alt={profile.name} className="w-9 h-9 rounded-full object-cover" />
              <span className="text-[14px] font-semibold text-dark">{profile.name}</span>
            </div>
          </div>
        </div>

        <div className="p-8 flex-1">
          {/* Greeting */}
          <div className="mb-7">
            <h1 className="font-fraunces text-[28px] font-semibold text-dark">Good morning, {profile.name.split(' ')[0]}</h1>
            <p className="text-[15px] text-muted mt-1">Here's an overview of your health activity.</p>
          </div>

          {/* Tab nav */}
          <div className="flex gap-1 bg-white border border-border rounded-sm p-1 w-fit mb-7">
            {[['dashboard','Dashboard'],['appointments','Appointments'],['profile','Profile']].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)}
                className={`px-5 py-2 rounded-sm text-[14px] font-medium transition-all ${t===tab?'bg-blue text-white shadow-sm':'text-slate hover:text-dark'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-7 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map(s => (
                  <div key={s.label} className="card-static p-6 flex items-center gap-4">
                    <div className={`w-[52px] h-[52px] ${s.color} rounded-sm flex items-center justify-center flex-shrink-0`}>
                      <CalendarBlank size={26} className={s.iconColor} weight="duotone" />
                    </div>
                    <div>
                      <p className="text-[28px] font-bold text-dark leading-none">{s.val}</p>
                      <p className="text-[13px] text-muted mt-1">{s.label}</p>
                      <p className={`text-[12px] mt-1.5 font-semibold ${s.up ? 'text-green' : 'text-red'}`}>{s.change}</p>
                    </div>
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="card p-8 text-center text-muted">Loading appointments…</div>
              ) : error ? (
                <div className="card p-8 text-center text-red">{error}</div>
              ) : (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[17px] font-bold text-dark">Upcoming Appointments</h3>
                      <Link to="/doctors" className="text-[14px] text-blue font-semibold hover:underline">+ Book New</Link>
                    </div>
                    <table className="data-table">
                      <thead><tr>
                        <th>Doctor</th><th>Specialty</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Actions</th>
                      </tr></thead>
                      <tbody>
                        {upcoming.length === 0 ? (
                          <tr><td colSpan="7" className="text-center text-muted py-8">No upcoming appointments found.</td></tr>
                        ) : upcoming.map(a => (
                          <tr key={a.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="w-[38px] h-[38px] rounded-full bg-blue-light text-blue grid place-items-center font-semibold text-sm">{a.doctor_name?.[0] || 'D'}</div>
                                <div>
                                  <p className="text-[14px] font-semibold text-dark">{a.doctor_name}</p>
                                  <p className="text-[12px] text-muted">{a.specialty}</p>
                                </div>
                              </div>
                            </td>
                            <td className="text-slate">{a.specialty}</td>
                            <td className="text-slate">{new Date(a.appointment_date).toLocaleDateString()}</td>
                            <td className="text-slate">{a.time_slot}</td>
                            <td><TypeBadge t={a.type} /></td>
                            <td><StatusBadge s={a.status} /></td>
                            <td>
                              <div className="flex gap-2">
                                <button onClick={() => handleReschedule(a.id)} disabled={actionLoading}
                                  className="action-btn action-btn-blue">Reschedule</button>
                                <button onClick={() => handleCancel(a.id)} disabled={actionLoading}
                                  className="action-btn action-btn-red">Cancel</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[17px] font-bold text-dark">Past Appointments</h3>
                      <button className="text-[14px] text-blue font-semibold hover:underline">View All</button>
                    </div>
                    <table className="data-table">
                      <thead><tr><th>Doctor</th><th>Specialty</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {past.length === 0 ? (
                          <tr><td colSpan="5" className="text-center text-muted py-8">No past appointments yet.</td></tr>
                        ) : past.map(a => (
                          <tr key={a.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="w-[38px] h-[38px] rounded-full bg-blue-light text-blue grid place-items-center font-semibold text-sm">{a.doctor_name?.[0] || 'D'}</div>
                                <div>
                                  <p className="text-[14px] font-semibold text-dark">{a.doctor_name}</p>
                                  <p className="text-[12px] text-muted">{a.specialty}</p>
                                </div>
                              </div>
                            </td>
                            <td className="text-slate">{a.specialty}</td>
                            <td className="text-slate">{new Date(a.appointment_date).toLocaleDateString()}</td>
                            <td><StatusBadge s={a.status} /></td>
                            <td><button className="action-btn action-btn-blue">View Details</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* APPOINTMENTS */}
          {tab === 'appointments' && (
            <div className="animate-fade-in">
              {loading ? (
                <div className="card p-8 text-center text-muted">Loading appointments…</div>
              ) : error ? (
                <div className="card p-8 text-center text-red">{error}</div>
              ) : (
                <>
                  <table className="data-table">
                    <thead><tr><th>ID</th><th>Doctor</th><th>Specialty</th><th>Date</th><th>Time</th><th>Type</th><th>Fee</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {appointments.length === 0 ? (
                        <tr><td colSpan="9" className="text-center text-muted py-8">No appointments available.</td></tr>
                      ) : appointments.map(a => (
                        <tr key={a.id}>
                          <td className="font-mono text-[12px] text-muted">{a.id}</td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-[38px] h-[38px] rounded-full bg-blue-light text-blue grid place-items-center font-semibold text-sm">{a.doctor_name?.[0] || 'D'}</div>
                              <div>
                                <p className="text-[14px] font-semibold text-dark">{a.doctor_name}</p>
                                <p className="text-[12px] text-muted">{a.specialty}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-slate">{a.specialty}</td>
                          <td className="text-slate">{new Date(a.appointment_date).toLocaleDateString()}</td>
                          <td className="text-slate">{a.time_slot}</td>
                          <td><TypeBadge t={a.type} /></td>
                          <td className="font-semibold text-dark">PKR {Number(a.fee || 0).toLocaleString()}</td>
                          <td><StatusBadge s={a.status} /></td>
                          <td>
                            {['confirmed','pending'].includes(a.status)
                              ? <div className="flex gap-2"><button onClick={() => handleReschedule(a.id)} disabled={actionLoading} className="action-btn action-btn-blue">Reschedule</button><button onClick={() => handleCancel(a.id)} disabled={actionLoading} className="action-btn action-btn-red">Cancel</button></div>
                              : <button className="action-btn action-btn-blue">View Details</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          {/* PROFILE */}
          {tab === 'profile' && (
            <div className="card-static p-7 max-w-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[17px] font-bold text-dark">My Profile</h3>
                <button onClick={editing ? handleProfileSave : () => setEditing(true)}
                  disabled={profileSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-sm text-[13px] font-semibold transition-all ${editing ? 'bg-green text-white' : 'border border-blue text-blue hover:bg-blue-light'}`}>
                  {editing ? <><FloppyDisk size={14}/> {profileSaving ? 'Saving...' : 'Save Changes'}</> : <><PencilSimple size={14}/> Edit Profile</>}
                </button>
              </div>

              <div className="flex items-center gap-5 mb-8 pb-7 border-b border-border">
                <img src={profile.img} alt={profile.name} className="w-16 h-16 rounded-[14px] object-cover border-2 border-border" />
                <div>
                  <p className="font-fraunces text-[20px] font-semibold text-dark">{profile.name}</p>
                  <p className="text-[14px] text-muted">{profile.email}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label:'Full Name', key:'name',   type:'text'  },
                  { label:'Email',     key:'email',  type:'email' },
                  { label:'Phone',     key:'phone',  type:'tel'   },
                  { label:'Date of Birth', key:'dob', type:'date' },
                  { label:'Gender',    key:'gender', type:'text'  },
                ].map(f => (
                  <div key={f.key}>
                    <label className="form-label block mb-1.5">{f.label}</label>
                    {editing
                      ? <input type={f.type} value={profile[f.key]}
                          onChange={e => setProfile({...profile, [f.key]: e.target.value})}
                          className="form-input" />
                      : <p className="text-[15px] text-dark font-medium px-4 py-[11px] bg-bg rounded-sm border border-border">{profile[f.key]}</p>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

