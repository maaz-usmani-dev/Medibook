import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SquaresFour, CalendarBlank, Clock, User, Bell, Plus, Check, X } from '@phosphor-icons/react';
import Sidebar from '../components/Sidebar';
import { api } from '../services/api';

const doc = {
  name: 'Dr. Sarah Ahmed', initials: 'SA', role: 'Cardiologist',
};

const sidebarLinks = [
  { label: 'Main', items: [
    { label: 'Dashboard',          to: '/doctor-dashboard', icon: SquaresFour },
    { label: 'My Appointments',    to: '/doctor-dashboard', icon: CalendarBlank, badge: '5' },
    { label: 'Calendar',           to: '/doctor-dashboard', icon: CalendarBlank },
    { label: 'Manage Availability',to: '/doctor-dashboard', icon: Clock },
  ]},
  { label: 'Account', items: [
    { label: 'My Profile',         to: '/doctor-dashboard', icon: User },
  ]},
];

const days = ['Mon','Tue','Wed','Thu','Fri','Sat'];

const formatTime12h = (time) => {
  if (!time) return '';
  const [hourStr, minute] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  if (hour === 0) hour = 12;
  if (hour > 12) hour -= 12;
  return `${hour.toString().padStart(2, '0')}:${minute} ${period}`;
};

const StatusBadge = ({ s }) => ({
  confirmed: <span className="badge badge-green">Confirmed</span>,
  pending:   <span className="badge badge-amber">Pending</span>,
}[s] || <span className="badge badge-grey">{s}</span>);

export default function DoctorDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [newSlot, setNewSlot] = useState({ day: 'Mon', time: '' });
  const [doctorId, setDoctorId] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const doctorName = doctorProfile?.full_name || storedUser.full_name || doc.name;
  const doctorRoleLabel = doctorProfile?.specialty || (storedUser.role === 'doctor' ? 'Doctor' : doc.role);
  const doctorFirstName = doctorName.split(' ')[1] || doctorName.split(' ')[0];
  const doctorInitials = doctorName.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || doc.initials;

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    setError(null);

    try {
      const data = await api.getMyAppointments();
      const list = Array.isArray(data) ? data : [];
      setAppointments(list);
      if (!doctorId && list.length > 0) {
        setDoctorId(list[0].doctor_id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchAvailability = async (id) => {
    if (!id) return;
    setLoadingSlots(true);
    try {
      const data = await api.getSlots(id);
      setAvailability(Array.isArray(data) ? data : []);
    } catch (err) {
      setAvailability([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    api.getMyDoctorProfile()
      .then(data => {
        setDoctorProfile(data);
        setDoctorId(data.id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (doctorId) {
      fetchAvailability(doctorId);
    }
  }, [doctorId]);

  const handleAppointmentStatus = async (id, status) => {
    const confirmed = window.confirm(`Mark this appointment as ${status}?`);
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await api.updateAppointmentStatus(id, status);
      await fetchAppointments();
    } catch (err) {
      window.alert(err.message || 'Unable to update appointment status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSlot = async () => {
    if (!doctorId || !newSlot.time) return;
    const timeString = formatTime12h(newSlot.time);
    setLoadingSlots(true);

    try {
      const data = await api.addSlot({
        doctor_id: doctorId,
        day_of_week: newSlot.day,
        time_slot: timeString,
      });
      setAvailability(prev => [
        ...prev,
        { id: data.id, doctor_id: doctorId, day_of_week: newSlot.day, time_slot: timeString },
      ]);
      setNewSlot({ day: 'Mon', time: '' });
    } catch (err) {
      window.alert(err.message || 'Failed to add slot.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleRemoveSlot = async (slotId) => {
    if (!slotId) return;
    const confirmed = window.confirm('Remove this available slot?');
    if (!confirmed) return;
    setLoadingSlots(true);
    try {
      await api.deleteSlot(slotId);
      setAvailability(prev => prev.filter(slot => slot.id !== slotId));
    } catch (err) {
      window.alert(err.message || 'Failed to remove slot.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const upcomingAppointments = useMemo(
    () => appointments.filter(a => ['confirmed', 'pending'].includes(a.status)),
    [appointments]
  );

  const dashboardLinks = useMemo(() => sidebarLinks.map(group => ({
    ...group,
    items: group.items.map(item => item.label === 'Dashboard'
      ? { ...item, onClick: () => setTab('dashboard'), active: tab === 'dashboard' }
      : item.label === 'My Appointments' || item.label === 'Calendar'
      ? { ...item, onClick: () => setTab('appointments'), active: tab === 'appointments', badge: item.label === 'My Appointments' ? String(upcomingAppointments.length) : undefined }
      : item.label === 'Manage Availability'
      ? { ...item, onClick: () => setTab('availability'), active: tab === 'availability' }
      : item)
  })), [tab, upcomingAppointments.length]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todays = appointments.filter(a => a.appointment_date === today).length;
    const totalPatients = new Set(appointments.map(a => a.patient_name)).size;
    const pending = appointments.filter(a => a.status === 'pending').length;
    const revenue = appointments.reduce((sum, a) => sum + Number(a.fee || 0), 0);

    return [
      { label: "Today's Appointments", val: todays, color:'bg-blue-light', textColor:'text-blue', change:'Live schedule', up:true },
      { label: 'Total Patients', val: totalPatients, color:'bg-green-light', textColor:'text-green', change:'Unique patients', up:true },
      { label: 'Pending Requests', val: pending, color:'bg-amber-light', textColor:'text-amber', change:'Needs your review', up:false },
      { label: 'Earnings (MTD)', val: `PKR ${revenue.toLocaleString()}`, color:'bg-purple-light', textColor:'text-purple', change:'Updated live', up:true },
    ];
  }, [appointments]);

  const notifications = useMemo(() => {
    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = appointments.filter(a => String(a.appointment_date).slice(0, 10) === today).length;
    const hasSlots = availability.length > 0;

    return [
      pendingCount > 0 ? `${pendingCount} appointment request${pendingCount === 1 ? '' : 's'} need review` : null,
      todayCount > 0 ? `${todayCount} appointment${todayCount === 1 ? '' : 's'} scheduled today` : null,
      !hasSlots ? 'Add availability slots so patients can book you' : null,
    ].filter(Boolean);
  }, [appointments, availability]);

  const groupedSlots = useMemo(() => {
    return availability.reduce((acc, slot) => {
      acc[slot.day_of_week] = acc[slot.day_of_week] || [];
      acc[slot.day_of_week].push(slot);
      return acc;
    }, {});
  }, [availability]);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar links={dashboardLinks} role={doctorRoleLabel} user={{ name: doctorName, initials: doctorInitials }} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-border px-8 h-[68px] flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-[18px] font-bold text-dark">Doctor Dashboard</h2>
          <div className="flex items-center gap-3.5">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative w-[38px] h-[38px] border border-border rounded-sm flex items-center justify-center">
              <Bell size={18} className="text-slate" />
              {notifications.length > 0 && <span className="absolute top-[7px] right-[7px] w-2 h-2 bg-red rounded-full border-2 border-white" />}
            </button>
            {showNotifications && (
              <div className="absolute right-8 top-[58px] w-[320px] bg-white border border-border rounded-sm shadow-lg p-4 z-20">
                <h4 className="text-[14px] font-bold text-dark mb-3">Notifications</h4>
                {notifications.length === 0 ? (
                  <p className="text-[13px] text-muted">No new notifications.</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((note) => (
                      <button key={note} onClick={() => setTab(note.includes('availability') || note.includes('slots') ? 'availability' : 'appointments')} className="w-full text-left text-[13px] text-slate bg-bg hover:bg-blue-light rounded-sm px-3 py-2">
                        {note}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2.5 cursor-pointer px-2.5 py-1.5 rounded-sm hover:bg-bg transition-colors">
              <div className="w-9 h-9 rounded-full bg-blue-light text-blue grid place-items-center font-semibold text-sm">{doctorInitials}</div>
              <span className="text-[14px] font-semibold text-dark">{doctorName} ▾</span>
            </div>
          </div>
        </div>

        <div className="p-8 flex-1">
          <div className="mb-7">
            <h1 className="font-fraunces text-[28px] font-semibold text-dark">Good morning, {doctorFirstName} 👋</h1>
            <p className="text-[15px] text-muted mt-1">You have {appointments.filter(a => ['confirmed','pending'].includes(a.status)).length} active appointments.</p>
          </div>

          <div className="flex gap-1 bg-white border border-border rounded-sm p-1 w-fit mb-7">
            {[['dashboard','Dashboard'],['appointments','Appointments'],['availability','Availability']].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-sm text-[14px] font-medium transition-all ${t===tab?'bg-blue text-white shadow-sm':'text-slate hover:text-dark'}`}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'dashboard' && (
            <div className="space-y-7 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map(s => (
                  <div key={s.label} className="card-static p-6">
                    <div className={`w-[52px] h-[52px] ${s.color} rounded-sm flex items-center justify-center mb-3`}>
                      <CalendarBlank size={26} className={s.textColor} weight="duotone" />
                    </div>
                    <p className={`text-[28px] font-bold leading-none ${s.textColor}`}>{s.val}</p>
                    <p className="text-[13px] text-muted mt-1">{s.label}</p>
                    <p className={`text-[12px] mt-1.5 font-semibold ${s.up ? 'text-green' : 'text-amber'}`}>{s.change}</p>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[17px] font-bold text-dark">Today's Appointments</h3>
                  <button className="text-[14px] text-blue font-semibold hover:underline">View Calendar</button>
                </div>
                <table className="data-table">
                  <thead><tr><th>Patient</th><th>Time</th><th>Type</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {upcomingAppointments.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-[38px] h-[38px] rounded-full bg-blue-light text-blue grid place-items-center font-semibold text-sm">
                              {a.patient_name?.[0] || 'P'}
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-dark">{a.patient_name}</p>
                              <p className="text-[12px] text-muted">{a.type || 'In-person'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="font-medium text-dark">{new Date(a.appointment_date).toLocaleDateString()} {a.time_slot}</td>
                        <td>
                          {a.type === 'Video'
                            ? <span className="badge badge-purple">Video</span>
                            : <span className="badge badge-blue">In-person</span>}
                        </td>
                        <td className="text-slate">{a.reason || 'General consultation'}</td>
                        <td><StatusBadge s={a.status} /></td>
                        <td>
                          {a.status === 'pending'
                            ? <div className="flex gap-2">
                                <button onClick={() => handleAppointmentStatus(a.id, 'confirmed')} className="action-btn action-btn-green flex items-center gap-1"><Check size={12} weight="bold"/>Confirm</button>
                                <button onClick={() => handleAppointmentStatus(a.id, 'cancelled')} className="action-btn action-btn-red flex items-center gap-1"><X size={12} weight="bold"/>Cancel</button>
                              </div>
                            : <button onClick={() => handleAppointmentStatus(a.id, 'completed')} className="action-btn action-btn-blue">Start</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'appointments' && (
            <div className="animate-fade-in">
              <table className="data-table">
                <thead><tr><th>ID</th><th>Patient</th><th>Time</th><th>Type</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td className="font-mono text-[12px] text-muted">{a.id}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-[38px] h-[38px] rounded-full bg-blue-light text-blue grid place-items-center font-semibold text-sm">
                            {a.patient_name?.[0] || 'P'}
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-dark">{a.patient_name}</p>
                            <p className="text-[12px] text-muted">{a.type || 'In-person'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate">{new Date(a.appointment_date).toLocaleDateString()}</td>
                      <td className="font-medium text-dark">{a.time_slot}</td>
                      <td>{a.type === 'Video' ? <span className="badge badge-purple">Video</span> : <span className="badge badge-blue">In-person</span>}</td>
                      <td className="text-slate">{a.reason || 'General consultation'}</td>
                      <td><StatusBadge s={a.status} /></td>
                      <td>
                        {a.status === 'pending'
                          ? <div className="flex gap-2">
                              <button onClick={() => handleAppointmentStatus(a.id, 'confirmed')} className="action-btn action-btn-green">Confirm</button>
                              <button onClick={() => handleAppointmentStatus(a.id, 'cancelled')} className="action-btn action-btn-red">Cancel</button>
                            </div>
                          : <button onClick={() => handleAppointmentStatus(a.id, 'completed')} className="action-btn action-btn-blue">Start</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'availability' && (
            <div className="space-y-5 animate-fade-in">
              <div className="card-static p-6">
                <h3 className="text-[16px] font-bold text-dark mb-4">Add New Slot</h3>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="form-label block mb-1.5">Day</label>
                    <select value={newSlot.day} onChange={e => setNewSlot({...newSlot, day: e.target.value})} className="form-input w-32">
                      {days.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label block mb-1.5">Time</label>
                    <input type="time" value={newSlot.time} onChange={e => setNewSlot({...newSlot, time: e.target.value})} className="form-input w-36" />
                  </div>
                  <button onClick={handleAddSlot} className="btn-success"><Plus size={15} weight="bold" /> Add Slot</button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {days.map(day => {
                  const daySlots = groupedSlots[day] || [];
                  return (
                    <div key={day} className="card-static p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-dark">{day}</h4>
                        <span className="text-[12px] text-muted">{daySlots.length} slots</span>
                      </div>
                      {daySlots.length === 0
                        ? <p className="text-[13px] text-muted py-2">No slots — click Add to schedule</p>
                        : <div className="flex flex-wrap gap-2">
                            {daySlots.map(slot => (
                              <div key={slot.id} className="flex items-center gap-1.5 bg-blue-light text-blue text-[12px] font-semibold px-3 py-1.5 rounded-sm">
                                {slot.time_slot}
                                <button onClick={() => handleRemoveSlot(slot.id)} className="hover:text-red transition-colors">
                                  <X size={11} weight="bold" />
                                </button>
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
