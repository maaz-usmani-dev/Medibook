import { CheckCircle, Clock, ShieldCheck, UsersThree } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const values = [
  { icon: ShieldCheck, title: 'Verified care', text: 'Doctor profiles are reviewed before they appear for booking.' },
  { icon: Clock, title: 'Less waiting', text: 'Patients can compare availability and reserve a slot without phone calls.' },
  { icon: UsersThree, title: 'Built for both sides', text: 'Doctors manage schedules while patients track appointments from one place.' },
];

export default function About() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="bg-bg border-b border-border">
        <div className="max-w-[1240px] mx-auto px-10 py-16 lg:py-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <span className="section-eyebrow">About MediBook</span>
            <h1 className="font-fraunces text-[46px] font-semibold text-dark leading-[1.12] mb-5">
              A simpler way to find and book trusted doctors.
            </h1>
            <p className="text-[17px] text-slate leading-[1.75] max-w-[620px]">
              MediBook connects patients with verified doctors, live availability, appointment tracking, and clear profile information so healthcare access feels organized instead of uncertain.
            </p>
          </div>

          <div className="card-static p-7">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['500+', 'Verified doctors'],
                ['24/7', 'Online booking'],
                ['2 min', 'Average booking time'],
                ['Live', 'Appointment status'],
              ].map(([value, label]) => (
                <div key={label} className="bg-blue-pale rounded-sm p-5">
                  <p className="font-fraunces text-[32px] font-bold text-blue leading-none">{value}</p>
                  <p className="text-[13px] text-slate mt-2 font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[1240px] mx-auto px-10">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12">
            <div>
              <span className="section-eyebrow">How We Help</span>
              <h2 className="section-title">Designed around real appointment workflows.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {values.map(({ icon: Icon, title, text }) => (
                <div key={title} className="card-static p-6">
                  <div className="w-12 h-12 rounded-sm bg-green-light text-green grid place-items-center mb-4">
                    <Icon size={24} weight="duotone" />
                  </div>
                  <h3 className="text-[17px] font-bold text-dark mb-2">{title}</h3>
                  <p className="text-[14px] text-muted leading-[1.65]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-dark py-16">
        <div className="max-w-[1240px] mx-auto px-10 grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <h2 className="font-fraunces text-[32px] font-semibold text-white mb-3">Ready to book with confidence?</h2>
            <p className="text-white/60 text-[16px]">Search verified doctors and choose a time that works for you.</p>
          </div>
          <Link to="/doctors" className="btn-white">
            <CheckCircle size={18} weight="duotone" /> Find Doctors
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
