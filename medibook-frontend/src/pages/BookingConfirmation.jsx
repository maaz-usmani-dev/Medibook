import { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, CalendarBlank, Clock, MapPin, CurrencyCircleDollar, Envelope, ArrowRight } from '@phosphor-icons/react';
import { api } from '../services/api';
// import Logo from '../components/Logo';

export default function BookingConfirmation() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointmentData, setAppointmentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!state?.appointment || !state?.doctor) {
      if (!id) {
        navigate('/doctors', { replace: true });
        return;
      }

      const loadAppointment = async () => {
        setLoading(true);
        setFetchError('');

        try {
          const appointment = await api.getAppointmentById(id);
          setAppointmentData(appointment);
        } catch (err) {
          setFetchError(err.message || 'Unable to load appointment details.');
        } finally {
          setLoading(false);
        }
      };

      loadAppointment();
    }
  }, [id, navigate, state]);

  const appointment = state?.appointment || appointmentData;
  const doctor = state?.doctor || appointmentData?.doctor || {
    name: 'Dr. Sarah Ahmed', specialty: 'Cardiology',
    hospital: 'City Hospital, Karachi', fee: 1500, photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=76&h=76&fit=crop&crop=face',
  };
  const date = state?.date || (appointmentData?.appointment_date
    ? new Date(appointmentData.appointment_date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Wednesday, May 8, 2024');
  const slot = state?.slot || appointmentData?.time_slot || '11:00 AM';
  const type = state?.type || appointmentData?.type || 'In-person';
  const status = state?.status || appointmentData?.status || 'Confirmed';
  const apptId = appointment?.id
    ? `#MED-${String(appointment.id).padStart(6, '0')}`
    : '#MED-2024-' + Math.floor(10000 + Math.random() * 90000);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 text-center text-muted">
        Loading appointment details…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center gap-4">
        <p className="text-red text-[16px] font-semibold">{fetchError}</p>
        <Link to="/doctors" className="btn-primary">
          Back to doctors
        </Link>
      </div>
    );
  }

  const rows = [
    { label: 'Doctor',    val: doctor.name },
    { label: 'Specialty', val: doctor.specialty },
    { label: 'Hospital',  val: doctor.hospital },
    { label: 'Date',      val: date },
    { label: 'Time',      val: slot },
    { label: 'Type',      val: null, badge: <span className="badge badge-blue">{type}</span> },
    { label: 'Fee',       val: null, fee: `PKR ${doctor.fee?.toLocaleString()}` },
    { label: 'Status',    val: null, badge: <span className="badge badge-green">● {status}</span> },
  ];

  return (
    <div>
      {/* Minimal navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-[12px] border-b border-border">
        <div className="max-w-[1240px] mx-auto px-10 h-[72px] flex items-center">
          {/* <Link to="/"><Logo /></Link> */}
        </div>
      </header>

      <div className="min-h-[calc(100vh-72px)] bg-bg flex items-center justify-center p-10">
        <div className="w-full max-w-[560px]">
          <div className="card-static p-[48px] text-center">
            {/* Check icon */}
            <div className="w-20 h-20 bg-green-light rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green" weight="fill" />
            </div>

            <h1 className="font-fraunces text-[30px] font-semibold text-dark mb-2">Appointment Confirmed!</h1>
            <p className="text-[15px] text-muted mb-8">Your appointment has been successfully booked. A confirmation has been sent to your email.</p>

            <p className="text-[13px] text-muted mb-2">
              Appointment ID: <code className="font-mono text-blue bg-blue-light px-2 py-0.5 rounded text-[13px]">{apptId}</code>
            </p>

            {/* Summary */}
            <div className="bg-bg rounded-sm p-5 mb-6 text-left">
              {rows.map((r, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0">
                  <span className="text-[13px] text-muted font-medium">{r.label}</span>
                  {r.val   && <span className="text-[14px] font-bold text-dark">{r.val}</span>}
                  {r.badge && r.badge}
                  {r.fee   && <span className="text-blue font-bold text-[18px]">{r.fee}</span>}
                </div>
              ))}
            </div>

            {/* Email notice */}
            <div className="flex items-center justify-center gap-2 text-[13px] text-muted mb-7">
              <Envelope size={16} className="text-green" weight="duotone" />
              Confirmation sent to your registered email address
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button className="btn-ghost">
                <CalendarBlank size={15} weight="duotone" /> Add to Calendar
              </button>
              <Link to="/patient-dashboard" className="btn-primary">
                View Dashboard <ArrowRight size={14} weight="bold" />
              </Link>
              <Link to="/doctors" className="btn-success">
                Book Another
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
