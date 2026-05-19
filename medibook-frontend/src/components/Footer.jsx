import { Link } from 'react-router-dom';
import { FacebookLogo, TwitterLogo, InstagramLogo, LinkedinLogo } from '@phosphor-icons/react';
// import Logo from './Logo';

const cols = [
  { title: 'Company', links: [{ label: 'About Us', to: '/about' }, { label: 'Our Doctors', to: '/doctors' }, { label: 'Careers', to: '#' }, { label: 'Press', to: '#' }] },
  { title: 'Patients', links: [{ label: 'Find Doctors', to: '/doctors' }, { label: 'Book Appointment', to: '/doctors' }, { label: 'Health Blog', to: '#' }, { label: 'FAQ', to: '#' }] },
  { title: 'Contact', links: [{ label: 'info@medibook.pk', to: '#' }, { label: '+92-300-000-0000', to: '#' }, { label: 'Karachi, Pakistan', to: '#' }, { label: 'Help Center', to: '#' }] },
];

export default function Footer() {
  return (
    <footer className="bg-dark pt-[72px]">
      <div className="border-t-[3px] border-blue">
        <div className="max-w-[1240px] mx-auto px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 pb-12 pt-12">
            <div>
              {/* <Logo dark /> */}
              <p className="text-[14px] text-white/50 leading-[1.7] mt-4 max-w-[280px]">
                Connecting patients with Pakistan's most trusted doctors. Book appointments online, anytime.
              </p>
              <div className="flex gap-2.5 mt-5">
                {[FacebookLogo, TwitterLogo, InstagramLogo, LinkedinLogo].map((Icon, i) => (
                  <a key={i} href="#"
                    className="w-9 h-9 rounded-sm bg-white/[0.08] flex items-center justify-center hover:bg-blue transition-colors duration-200">
                    <Icon size={16} className="text-white/70" weight="fill" />
                  </a>
                ))}
              </div>
            </div>

            {cols.map(col => (
              <div key={col.title}>
                <h4 className="text-[13px] font-bold text-white uppercase tracking-[1px] mb-5">{col.title}</h4>
                <div className="space-y-3">
                  {col.links.map(l => (
                    <Link key={l.label} to={l.to}
                      className="block text-[14px] text-white/50 hover:text-white transition-colors duration-200">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.08] py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[13px] text-white/35">© 2024 MediBook Health Technologies. All rights reserved.</span>
            <div className="flex gap-3">
              {['SSL Secured', 'HIPAA Compliant', 'ISO 27001'].map(c => (
                <span key={c} className="text-[11px] font-semibold text-white/40 border border-white/15 px-[10px] py-1 rounded-full">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
