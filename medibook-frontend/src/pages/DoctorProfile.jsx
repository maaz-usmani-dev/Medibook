import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock, MapPin, Users, GraduationCap, Globe, Video
} from '@phosphor-icons/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Avatar from '../components/Avatar';
import { api } from '../services/api';
import { normalizeDoctor } from '../utils/normalizeDoctor';

const calDays = ['S','M','T','W','T','F','S'];

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => null);
  const todayKey = toDateKey(new Date());

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = toDateKey(date);
    cells.push({ day, date, key, past: key < todayKey, today: key === todayKey });
  }

  return cells;
};

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [tab, setTab]           = useState('About');
  const [selectedSlot, setSlot] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0,10));
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const calendarDays = buildCalendarDays(calendarMonth);
  const todayKey = toDateKey(new Date());

  const changeMonth = (offset) => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const selectDate = (dateKey) => {
    setSelectedDate(dateKey);
    setSlot('');
    setBookingError(null);
  };

  const handleBook = async () => {
    if (!selectedSlot || !doctor) return;
    setBookingLoading(true);
    setBookingError(null);

    try {
      const payload = {
        doctor_id: doctor.id || doctor.user_id,
        appointment_date: selectedDate,
        time_slot: selectedSlot,
        type: 'In-person',
        reason: '',
      };

      const appointment = await api.bookAppointment(payload);
      const prettyDate = new Date(selectedDate).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      navigate(`/booking-confirmation/${appointment.id}`, {
        state: {
          appointment,
          doctor,
          date: prettyDate,
          slot: selectedSlot,
          type: payload.type,
          status: 'Confirmed',
        },
      });
    } catch (err) {
      setBookingError(err.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    const loadDoctor = async () => {
      setLoadingDoc(true);
      setError(null);
      try {
        const data = await api.getDoctorById(id);
        setDoctor(normalizeDoctor(data));
      } catch (err) {
        setError(err.message || 'Failed to load doctor');
      } finally {
        setLoadingDoc(false);
      }
    };

    loadDoctor();
  }, [id]);

  useEffect(() => {
    if (!id || !selectedDate) return;
    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const data = await api.getDoctorAvailability(id, selectedDate);
        setSlots(Array.isArray(data) ? data : []);
      } catch (err) {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [id, selectedDate]);

  const reviews = [
    { name: 'Ali Hassan',   rating: 5, date: '2 weeks ago', text: 'Excellent doctor, very thorough and patient. Explained everything clearly.' },
    { name: 'Nadia B.',     rating: 5, date: '1 month ago', text: 'Best consultation I have had. She truly listens and provides detailed advice.' },
    { name: 'Kamran A.',    rating: 4, date: '2 months ago',text: 'Very professional and knowledgeable. Appointment was on time.' },
  ];

  if (loadingDoc) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-[1240px] mx-auto px-10 py-20 text-center text-muted">Loading doctor profile...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-[720px] mx-auto px-10 py-20 text-center">
          <p className="font-fraunces text-[24px] font-semibold text-dark mb-3">Unable to load doctor</p>
          <p className="text-red mb-6">{error}</p>
          <Link to="/doctors" className="btn-primary">Back to doctors</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Profile hero */}
      <div className="bg-bg py-12 border-b border-border">
        <div className="max-w-[1240px] mx-auto px-10">
          <div className="text-[13px] text-muted mb-6">
            Home &nbsp;/&nbsp;
            <Link to="/doctors" className="text-blue font-medium hover:underline">Find Doctors</Link>
            &nbsp;/&nbsp; {doctor?.name || 'Doctor'}
          </div>

          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Photo */}
            <Avatar src={doctor?.photo} name={doctor?.name || 'Doctor'} className="w-[200px] h-[220px] rounded-[14px] shadow-md flex-shrink-0" textClassName="text-4xl" rounded={false} />

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={slots.length > 0 ? "badge badge-green" : "badge badge-amber"}>
                  {selectedDate === todayKey
                    ? slots.length > 0 ? 'Available today' : 'No slots today'
                    : slots.length > 0 ? 'Slots available' : 'No slots for selected date'}
                </span>
                <span className="badge badge-blue"><Video size={12} /> Video Consult</span>
              </div>
              <h1 className="font-fraunces text-[36px] font-semibold text-dark leading-tight mb-2">{doctor?.name || ''}</h1>
              <p className="text-[17px] text-muted mb-3">
                {[doctor?.education?.[0]?.degree || doctor?.qualification, doctor?.specialty].filter(Boolean).join(' - ')}
              </p>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="stars text-[18px]">★★★★★</span>
                <span className="text-[18px] font-bold text-dark">{doctor?.rating}</span>
                <span className="text-[14px] text-muted">({doctor?.reviews} reviews)</span>
              </div>
              <div className="flex flex-wrap gap-7 mb-5">
                {[
                  { Icon: Clock,   text: `${doctor?.experience || 0} years experience` },
                  { Icon: MapPin,  text: doctor?.hospital || '' },
                  { Icon: Users,   text: '1,200+ patients served' },
                  { Icon: Globe,   text: (doctor?.languages || []).join(', ') },
                ].map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-[14px] text-slate">
                    <Icon size={18} className="text-blue flex-shrink-0" weight="duotone" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Booking widget */}
            <div className="w-full lg:w-[320px] flex-shrink-0">
              <div className="card-static p-7 sticky top-[88px]">
                <p className="font-fraunces text-[28px] font-bold text-blue">
                  PKR {doctor?.fee ? doctor.fee.toLocaleString() : '—'} <span className="text-[14px] font-normal text-muted">/ consultation</span>
                </p>

                <p className="text-[13px] font-semibold text-slate mt-5 mb-2.5">Select Date</p>
                {/* Mini calendar */}
                <div className="border border-border rounded-sm overflow-hidden mb-5">
                  <div className="flex justify-between items-center px-4 py-3 bg-blue text-white text-[14px] font-semibold">
                    <button type="button" onClick={() => changeMonth(-1)} className="w-7 h-7 rounded-sm bg-white/20 text-white text-[16px] leading-none">&lt;</button>
                    {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    <button type="button" onClick={() => changeMonth(1)} className="w-7 h-7 rounded-sm bg-white/20 text-white text-[16px] leading-none">&gt;</button>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-7 gap-1 mb-1.5">
                      {calDays.map(d => <div key={d} className="text-[11px] font-bold text-muted text-center py-1 uppercase">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((c, i) => (
                        <button
                          key={c?.key || `empty-${i}`}
                          type="button"
                          disabled={!c || c.past}
                          onClick={() => selectDate(c.key)}
                          className={`text-[13px] text-center py-[7px] rounded-sm font-medium relative transition-all
                          ${!c ? 'cursor-default' : 'cursor-pointer'}
                          ${c?.past ? 'text-border cursor-not-allowed' : ''}
                          ${c?.key === selectedDate ? 'bg-blue text-white font-bold' : ''}
                          ${c?.today && c.key !== selectedDate ? 'ring-1 ring-blue text-blue' : ''}
                          ${c && !c.past && c.key !== selectedDate ? 'text-slate hover:bg-blue-light hover:text-blue' : ''}
                        `}>
                          {c?.day || ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-[13px] font-semibold text-slate mb-2.5">Available Slots — {new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {loadingSlots && <div className="col-span-3 text-center text-muted">Loading slots…</div>}
                  {!loadingSlots && slots.length === 0 && <div className="col-span-3 text-center text-muted">No slots available for this date.</div>}
                  {slots.map(slot => {
                    const slotTime = slot.time_slot || slot.time;
                    const slotAvailable = slot.is_active ?? slot.available ?? true;

                    return (
                    <button key={slotTime} disabled={!slotAvailable}
                      onClick={() => setSlot(slotTime)}
                      className={`py-2.5 text-center rounded-sm text-[13px] font-semibold border transition-all duration-200 ${
                        !slotAvailable
                          ? 'border-border text-border bg-bg cursor-not-allowed'
                          : selectedSlot === slotTime
                            ? 'bg-green border-green text-white'
                            : 'border-green text-green bg-green-light hover:bg-green hover:text-white'
                      }`}>
                      {slotTime}
                    </button>
                  )})}
                </div>

                {bookingError && (
                  <div className="bg-red-light border border-red/20 text-red text-[13px] rounded-sm px-4 py-3 mb-4">
                    {bookingError}
                  </div>
                )}

                <button onClick={handleBook} disabled={!selectedSlot || bookingLoading}
                  className="w-full py-4 bg-green text-white font-semibold text-[16px] rounded-full hover:bg-[#0d9a70] transition-colors shadow-[0_2px_12px_rgba(17,176,128,0.35)] disabled:opacity-60">
                  {bookingLoading ? 'Booking Appointment...' : 'Confirm Appointment'}
                </button>
                <p className="text-center text-[12px] text-muted mt-3">Free cancellation up to 24h before</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="max-w-[1240px] mx-auto px-10 py-10 pb-20">
        <div className="flex border-b-2 border-border mb-9">
          {['About', 'Education & Experience', `Reviews (${doctor?.reviews})`].map(t => (
            <button key={t} onClick={() => setTab(t.split(' (')[0])}
              className={`px-7 py-4 text-[15px] font-semibold transition-all duration-200 border-b-2 -mb-0.5 ${
                tab === t.split(' (')[0]
                  ? 'text-blue border-blue'
                  : 'text-muted border-transparent hover:text-dark'
              }`}>{t}</button>
          ))}
        </div>

        <div className="max-w-[720px]">
          {tab === 'About' && (
            <div>
              <h3 className="text-[18px] font-bold text-dark mb-3">About {doctor?.name || ''}</h3>
              <p className="text-[15px] text-slate leading-[1.75] mb-4">{doctor?.bio || ''}</p>
              <h3 className="text-[18px] font-bold text-dark mb-3 mt-7">Languages</h3>
              <p className="text-[15px] text-slate">{(doctor?.languages || []).join(' • ')}</p>
              <h3 className="text-[18px] font-bold text-dark mb-3 mt-7">Hospital Affiliations</h3>
              <p className="text-[15px] text-slate">{doctor?.hospital || ''}</p>
            </div>
          )}

          {tab === 'Education' && (
            <div>
              <h3 className="text-[18px] font-bold text-dark mb-5">Education &amp; Training</h3>
              {(doctor?.education || []).map((edu, i) => (
                <div key={i} className="flex gap-4 mb-5 pb-5 border-b border-border last:border-b-0">
                  <div className="w-11 h-11 bg-blue-light rounded-sm flex items-center justify-center flex-shrink-0">
                    <GraduationCap size={22} className="text-blue" weight="duotone" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-dark">{edu.degree}</p>
                    <p className="text-[14px] text-muted mt-0.5">{edu.school}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'Reviews' && (
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={i} className="card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-blue text-white text-sm font-bold flex items-center justify-center">
                        {r.name[0]}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-dark">{r.name}</p>
                        <p className="text-[12px] text-muted">{r.date}</p>
                      </div>
                    </div>
                    <div className="stars text-[13px]">{'★'.repeat(r.rating)}</div>
                  </div>
                  <p className="text-[14px] text-slate leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
