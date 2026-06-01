import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass, Star, Heart, Brain,
  Bone, Baby, Ear, Eye, Stethoscope, Bandaids
} from '@phosphor-icons/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DoctorCard from '../components/DoctorCard';

import { api } from '../services/api';
import { normalizeDoctor } from '../utils/normalizeDoctor';

const specIcons = {
  Cardiology:   Heart,
  Neurology:    Brain,
  Dermatology:  Bandaids,
  Orthopedics:  Bone,
  Pediatrics:   Baby,
  ENT:          Ear,
  Ophthalmology:Eye,
  General:      Stethoscope,
};

const steps = [
  {
    n: '01', title: 'Search & Filter', color: '#1A6EBF', bg: '#EBF5FF',
    icon: MagnifyingGlass,
    desc: 'Browse 500+ verified doctors by specialty, location, language, or insurance. Read real patient reviews before deciding.',
  },
  {
    n: '02', title: 'Pick a Time Slot', color: '#11B080', bg: '#E6F9F4',
    icon: null,
    desc: "See real-time availability on each doctor's calendar. No phone calls — pick the date and time that works for you.",
  },
  {
    n: '03', title: 'Confirm & Attend', color: '#F59E0B', bg: '#FEF3C7',
    icon: null,
    desc: 'Get instant email confirmation. Receive reminders 24h before. Show up at the clinic or join a video call — your choice.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ q: '', city: '', date: '' });
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState({
    verifiedDoctors: 0,
    happyPatients: 0,
    satisfactionRate: 98,
    onlineBooking: 24,
  });

  const fallbackTestimonials = [
    {
      full_name: 'Amina Khan',
      rating: 5,
      text: 'Quick booking and a friendly doctor. The platform made it easy to compare specialties and schedule an appointment.',
      avatar_url: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=96&h=96&fit=crop&crop=face'
    },
    {
      full_name: 'Bilal Ahmed',
      rating: 4,
      text: 'Great selection of trusted doctors. I found an excellent cardiologist in my city within minutes.',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face'
    },
    {
      full_name: 'Sara Ali',
      rating: 5,
      text: 'The review system helped me choose the best doctor. The appointment confirmation arrived instantly.',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&crop=face'
    },
  ];

  const shownTestimonials = testimonials.length > 0 ? testimonials : fallbackTestimonials;

  useEffect(() => {
    let active = true;

    const loadDoctors = async () => {
      try {
        const data = await api.getDoctors();
        if (!active) return;
        const mapped = (Array.isArray(data) ? data : data.doctors || []).map(normalizeDoctor);
        setFeaturedDoctors(mapped.slice(0, 3));

        const counts = mapped.reduce((acc, doctor) => {
          const key = doctor.specialty || 'General';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        const specialtyList = Object.entries(counts)
          .slice(0, 8)
          .map(([name, count], index) => ({
            name,
            count,
            iconColor: ['#1A6EBF', '#7C3AED', '#11B080', '#B45309', '#F59E0B', '#0F766E', '#9333EA', '#1D4ED8'][index % 8],
            bg: ['#EBF5FF', '#F3EEFF', '#E6F9F4', '#FEF3C7', '#FEF3C7', '#E0F2FE', '#F5F3FF', '#E7F0FF'][index % 8],
          }));
        setSpecialties(specialtyList);

        const reviewCount = mapped.reduce((sum, doctor) => sum + (doctor.reviews || 0), 0);
        const avgRating = mapped.length > 0
          ? Math.round((mapped.reduce((sum, doctor) => sum + (doctor.rating || 0), 0) / mapped.length) * 10) / 10
          : 0;

        setStats({
          verifiedDoctors: mapped.length,
          happyPatients: reviewCount,
          satisfactionRate: avgRating || 98,
          onlineBooking: 24,
        });
      } catch (err) {
        setFeaturedDoctors([]);
        setSpecialties([]);
      }
    };

    const loadTestimonials = async () => {
      try {
        const data = await api.getReviews();
        if (!active) return;
        setTestimonials(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setTestimonials([]);
      }
    };

    loadDoctors();
    loadTestimonials();

    return () => {
      active = false;
    };
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search.q) params.set('q', search.q);
    if (search.city) params.set('city', search.city);
    if (search.date) params.set('date', search.date);
    navigate(`/doctors?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-0"
        style={{ background: 'linear-gradient(135deg, #0F2549 0%, #1A3A6B 55%, #1e4a8a 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute -top-[120px] -right-[120px] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(26,110,191,0.25) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[60px] -left-[80px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(10,191,188,0.12) 0%, transparent 70%)' }} />

        <div className="relative max-w-[1240px] mx-auto px-10 py-20 lg:py-28 grid lg:grid-cols-[1.5fr_1fr] gap-[60px] items-center">
          {/* Left */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold text-[#7EC8F5] mb-6"
              style={{ background: 'rgba(26,110,191,0.25)', border: '1px solid rgba(26,110,191,0.4)' }}>
              <Star size={14} weight="fill" />
              Pakistan's #1 Doctor Appointment Platform
            </div>

            <h1 className="font-fraunces text-[58px] font-semibold leading-[1.1] text-white tracking-[-1px] mb-5">
              Find &amp; Book<br />
              Trusted <em className="text-[#7EC8F5] not-italic">Doctors</em><br />
              Instantly
            </h1>
            <p className="text-[17px] text-white/68 leading-[1.7] mb-9 max-w-[480px]" style={{color: "white"}}>
              Skip the waiting room. Search verified specialists, check real-time availability, and confirm your appointment in under 60 seconds.
            </p>

            {/* Search box */}
            <div className="bg-white rounded-[14px] p-2.5 flex flex-col sm:flex-row gap-0 items-center shadow-[0_8px_32px_rgba(0,0,0,0.2)] mb-5">
              <div className="flex-1 px-4 py-2.5 border-r border-border">
                <p className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-1">Specialty / Doctor</p>
                <input value={search.q} onChange={e => setSearch({ ...search, q: e.target.value })}
                  placeholder="e.g. Cardiologist, Dr. Sara..." className="text-[14px] text-dark font-medium outline-none w-full placeholder:text-muted placeholder:font-normal bg-transparent" />
              </div>
              <div className="px-4 py-2.5 border-r border-border">
                <p className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-1">City</p>
                <input value={search.city} onChange={e => setSearch({ ...search, city: e.target.value })}
                  placeholder="Karachi, Lahore..." className="text-[14px] text-dark font-medium outline-none w-32 placeholder:text-muted placeholder:font-normal bg-transparent" />
              </div>
              <div className="px-4 py-2.5">
                <p className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-1">Date</p>
                <input type="date" value={search.date} onChange={e => setSearch({ ...search, date: e.target.value })}
                  className="text-[14px] text-dark font-medium outline-none w-36 bg-transparent" />
              </div>
              <button onClick={() => navigate('/doctors')}
                className="flex items-center gap-2 bg-blue text-white px-6 py-[14px] rounded-[10px] text-[15px] font-bold whitespace-nowrap hover:bg-blue-dark transition-colors ml-2">
                <MagnifyingGlass size={18} weight="bold" /> Search
              </button>
            </div>

            <div className="flex items-center gap-4 text-white/55 text-[13px]">
              <div className="flex">
                {['A', 'S', 'M', 'H'].map((initial, i) => (
                  <div key={initial}
                    className="w-8 h-8 rounded-full border-2 border-navy bg-blue-light text-blue grid place-items-center text-[12px] font-bold"
                    style={{ marginLeft: i > 0 ? '-8px' : '0' }}>
                    {initial}
                  </div>
                ))}
              </div>
              <span>Trusted by <strong className="text-[#7EC8F5]">50,000+</strong> patients across Pakistan</span>
            </div>
          </div>

          {/* Right — hero image with floating cards */}
          <div className="hidden lg:flex justify-center relative animate-fade-up delay-200">
            <div className="w-full max-w-[520px] rounded-[20px_20px_0_0] overflow-hidden relative">
              <img src="https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=800&h=700&fit=crop&crop=top"
                alt="Doctor consulting with patient" className="w-full h-[480px] object-cover object-top" fetchpriority="high" decoding="async" />
            </div>
            {/* Float card 1 */}
            <div className="absolute top-8 -right-5 bg-white rounded-[14px] px-[18px] py-3.5 shadow-lg min-w-[180px]">
              <p className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-1">Today's Appointments</p>
              <p className="text-[24px] font-bold text-green">48</p>
              <p className="text-[12px] text-muted">Confirmed &amp; ready</p>
            </div>
            {/* Float card 2 */}
            <div className="absolute bottom-20 -left-6 bg-white rounded-[14px] px-[18px] py-3.5 shadow-lg min-w-[180px]">
              <p className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-1">Avg. Wait Time</p>
              <p className="text-[24px] font-bold text-dark">2 mins</p>
              <p className="text-[12px] text-muted">To confirm booking</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24">
        <div className="max-w-[1240px] mx-auto px-10">
          <div className="text-center mb-14">
            <span className="section-eyebrow">Simple Process</span>
            <h2 className="section-title">Book in <em>3 Easy Steps</em></h2>
            <p className="section-sub mx-auto max-w-[560px]">From search to confirmed — it takes less than 2 minutes, any time of day.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="card p-9">
                <p className="font-fraunces text-[56px] font-bold leading-none mb-4 tracking-[-2px]"
                  style={{ color: s.bg }}>{s.n}</p>
                <div className="w-[52px] h-[52px] rounded-sm flex items-center justify-center mb-5"
                  style={{ background: s.bg }}>
                  {s.n === '01' && <MagnifyingGlass size={26} style={{ color: s.color }} weight="bold" />}
                  {s.n === '02' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" className="w-[26px] h-[26px]">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  )}
                  {s.n === '03' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" className="w-[26px] h-[26px]">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  )}
                </div>
                <h3 className="text-[19px] font-bold text-dark mb-2.5">{s.title}</h3>
                <p className="text-[15px] text-muted leading-[1.65]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPECIALTIES ── */}
      <section className="py-24 bg-bg">
        <div className="max-w-[1240px] mx-auto px-10">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="section-eyebrow">Explore</span>
              <h2 className="section-title">Browse by <em>Specialty</em></h2>
            </div>
            <Link to="/doctors" className="btn-ghost hidden sm:inline-flex">View All Specialties</Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {specialties.length > 0 ? specialties.map(spec => {
              const Icon = specIcons[spec.name] || Stethoscope;
              return (
                <Link key={spec.name} to={`/doctors?specialty=${encodeURIComponent(spec.name)}`}
                  className="card p-7 text-center cursor-pointer hover:-translate-y-1">
                  <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-4"
                    style={{ background: spec.bg }}>
                    <Icon size={30} style={{ color: spec.iconColor }} weight="duotone" />
                  </div>
                  <p className="text-[12px] font-semibold text-dark mb-1">{spec.name}</p>
                  <p className="text-[13px] text-muted">{spec.count} doctors</p>
                </Link>
              );
            }) : (
              <div className="col-span-full card p-8 text-center text-muted">No specialties available yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{ background: 'linear-gradient(90deg, #0F2549 0%, #1A3A6B 100%)' }} className="py-12">
        <div className="max-w-[1240px] mx-auto px-10">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { val: stats.verifiedDoctors, sfx: '+', label: 'Verified Doctors', accent: '#0ABFBC' },
              { val: stats.happyPatients,  sfx: '+', label: 'Patient Reviews', accent: '#0ABFBC' },
              { val: stats.satisfactionRate, sfx: '%', label: 'Avg. Rating', accent: '#0ABFBC' },
              { val: stats.onlineBooking, sfx: '/7', label: 'Online Booking', accent: '#0ABFBC' },
            ].map((s, i) => (
              <div key={s.label} className={`text-center py-2 ${i < 3 ? 'border-r border-white/10' : ''}`}>
                <p className="font-fraunces text-[44px] font-bold text-white leading-none">
                  <span style={{ color: s.accent }}>{s.val}</span>{s.sfx}
                </p>
                <p className="text-[14px] text-white/60 mt-2 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURED DOCTORS ── */}
      <section className="py-24">
        <div className="max-w-[1240px] mx-auto px-10">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="section-eyebrow">Top Rated</span>
              <h2 className="section-title">Meet Our <em>Doctors</em></h2>
            </div>
            <Link to="/doctors" className="btn-ghost hidden sm:inline-flex">View All Doctors</Link>
          </div>
          {featuredDoctors.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredDoctors.map(d => <DoctorCard key={d.id} doctor={d} />)}
            </div>
          ) : (
            <div className="card p-10 text-center text-muted">No doctors are available yet.</div>
          )}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-bg">
        <div className="max-w-[1240px] mx-auto px-10">
          <div className="text-center mb-12">
            <span className="section-eyebrow">Patient Stories</span>
            <h2 className="section-title">What Our <em>Patients</em> Say</h2>
            <p className="section-sub mx-auto max-w-[560px]">Real experiences from patients who booked through MediBook.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {shownTestimonials.map((t, i) => (
              <div key={i} className="card p-8">
                <div className="stars mb-3">{'★'.repeat(Math.min(5, t.rating || 5))}</div>
                <p className="font-fraunces text-[48px] font-bold leading-none text-blue-light mb-1">"</p>
                <p className="text-[15px] text-slate leading-[1.7] italic mb-6">{t.text}</p>
                <div className="flex items-center gap-3.5">
                  <img src={t.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face'}
                    alt={t.full_name} className="w-[46px] h-[46px] rounded-full object-cover" />
                  <div>
                    <p className="text-[15px] font-bold text-dark">{t.full_name || 'Patient'}</p>
                    <p className="text-[13px] text-muted">{t.doctor_id ? 'Doctor review' : 'Patient review'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16">
        <div className="max-w-[1240px] mx-auto px-10">
          <div className="relative overflow-hidden rounded-[20px] px-[72px] py-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8"
            style={{ background: 'linear-gradient(135deg, #1A6EBF 0%, #115091 100%)' }}>
            <div className="absolute -top-[60px] -right-[60px] w-[300px] h-[300px] rounded-full bg-white/[0.06] pointer-events-none" />
            <div className="absolute -bottom-[80px] right-[160px] w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
            <div className="relative">
              <h2 className="font-fraunces text-[34px] font-semibold text-white mb-3 leading-[1.2]">
                Ready to take control<br />of your health?
              </h2>
              <p className="text-[16px] text-white max-w-[500px]">
                Join 50,000+ patients who book smarter with MediBook. Free to sign up — no insurance required.
              </p>
            </div>
            <div className="relative flex gap-3.5 flex-shrink-0">
              <Link to="/signup" className="btn-white">Book Appointment</Link>
              <button className="btn-outline-white">Learn More</button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
