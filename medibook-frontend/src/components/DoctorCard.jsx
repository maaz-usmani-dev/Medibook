import { Link, useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin } from '@phosphor-icons/react';
import Avatar from './Avatar';

export default function DoctorCard({ doctor, horizontal = false }) {
  const navigate = useNavigate();

  const handleBookClick = (e) => {
    // If user not logged in, redirect to login.
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (!user) {
        navigate('/login', { state: { next: `/doctors/${doctor.id}` } });
        return;
      }
    } catch {
      navigate('/login', { state: { next: `/doctors/${doctor.id}` } });
      return;
    }

    navigate(`/doctors/${doctor.id}`);
  };

  if (horizontal) {
    return (
      <article className="card flex overflow-hidden cursor-pointer group">
        <Avatar src={doctor.photo} name={doctor.name} className="w-[180px] h-[200px] flex-shrink-0" textClassName="text-3xl" rounded={false} />
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[18px] font-bold text-dark">{doctor.name}</h3>
                <p className="text-[14px] text-muted mt-1">{doctor.title}</p>
              </div>
              <span className={`badge ${doctor.available ? 'badge-green' : 'badge-amber'}`}>
                {doctor.available ? '● Available Today' : `Next: ${doctor.nextSlot}`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {doctor.tags.map(t => (
                <span key={t} className={`badge badge-${doctor.tagColor}`}>{t}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-6 mt-3">
              <span className="flex items-center gap-1.5 text-[14px] text-slate">
                <Star size={15} weight="fill" className="text-amber" />
                {doctor.rating} ({doctor.reviews} reviews)
              </span>
              <span className="flex items-center gap-1.5 text-[14px] text-slate">
                <Clock size={15} className="text-muted" />
                {doctor.experience} years experience
              </span>
              <span className="flex items-center gap-1.5 text-[14px] text-slate">
                <MapPin size={15} className="text-muted" />
                {doctor.hospital}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
            <div className="text-[20px] font-bold text-blue">
              PKR {doctor.fee.toLocaleString()} <span className="text-[13px] font-normal text-muted">/ consultation</span>
            </div>
            <div className="flex gap-2.5">
              <Link to={`/doctors/${doctor.id}`} className="btn-ghost py-[9px] px-[18px] text-[13px]">View Profile</Link>
              <button onClick={handleBookClick} className="btn-primary py-[9px] px-[18px] text-[13px]">Book Appointment</button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Grid card (homepage)
  return (
    <article className="card overflow-hidden group">
      <Avatar src={doctor.photo} name={doctor.name} className="w-full h-[220px]" textClassName="text-3xl" rounded={false} />
      <div className="p-[22px]">
        <h3 className="text-[17px] font-bold text-dark">{doctor.name}</h3>
        <p className="text-[14px] text-muted mt-1 mb-3">{doctor.title}</p>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-1.5 text-[14px] font-semibold text-dark">
            <span className="stars">★★★★★</span> {doctor.rating}
            <span className="text-muted font-normal">({doctor.reviews})</span>
          </div>
          <span className="text-[13px] text-muted">{doctor.experience} yrs exp.</span>
        </div>
        <div className="flex items-center justify-between pt-3.5 border-t border-border">
          <span className="text-[16px] font-bold text-blue">
            PKR {doctor.fee.toLocaleString()} <span className="text-[12px] font-normal text-muted">/ visit</span>
          </span>
          <button onClick={handleBookClick} className="btn-primary py-2 px-5 text-[13px]">Book Now</button>
        </div>
      </div>
    </article>
  );
}
