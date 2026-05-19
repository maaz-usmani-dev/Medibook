import { useState, useEffect, useMemo } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DoctorCard from '../components/DoctorCard';
import { api } from '../services/api';
import { normalizeDoctor } from '../utils/normalizeDoctor';

const genders = ['Any', 'Male', 'Female'];
const ratings = [{ label: '★★★★★ 4+', val: 4 }, { label: '★★★★ 3+', val: 3 }];
const avail   = [{ label: 'Available Today', key: 'today' }, { label: 'This Week', key: 'week' }, { label: 'Video Consult', key: 'video' }];

export default function DoctorListing() {
  const [search, setSearch]   = useState('');
  const [spec, setSpec]       = useState('');
  const [gender, setGender]   = useState('Any');
  const [minRating, setRating]= useState(0);
  const [sortBy, setSort]     = useState('Relevance');
  const [feeMin, setFeeMin]   = useState('');
  const [feeMax, setFeeMax]   = useState('');
  const [doctorsData, setDoctorsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filtered = doctorsData.filter(d => {
    const q = search.toLowerCase();
    if (q && !d.name?.toLowerCase().includes(q) && !d.specialty?.toLowerCase().includes(q)) return false;
    if (spec && d.specialty !== spec) return false;
    if (gender !== 'Any' && d.gender !== gender) return false;
    if (minRating && d.rating < minRating) return false;
    if (feeMin && d.fee < parseInt(feeMin)) return false;
    if (feeMax && d.fee > parseInt(feeMax)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Rating (High to Low)') return b.rating - a.rating;
    if (sortBy === 'Fee (Low to High)')   return a.fee - b.fee;
    if (sortBy === 'Experience')          return b.experience - a.experience;
    return 0;
  });

  const reset = () => { setSpec(''); setGender('Any'); setRating(0); setFeeMin(''); setFeeMax(''); setSearch(''); };

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getDoctors();
        const mapped = (Array.isArray(data) ? data : data.doctors || []).map(normalizeDoctor);
        setDoctorsData(mapped);
      } catch (err) {
        setError(err.message || 'Failed to fetch doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const specialties = useMemo(() => {
    const set = new Set();
    doctorsData.forEach(d => d.specialty && set.add(d.specialty));
    return Array.from(set).map(name => ({ name }));
  }, [doctorsData]);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <div className="bg-bg py-10 border-b border-border">
        <div className="max-w-[1240px] mx-auto px-10">
          <p className="text-[13px] text-muted mb-2">
            Home &nbsp;/&nbsp; <span className="text-blue font-medium">Find Doctors</span>
          </p>
          <h1 className="font-fraunces text-[32px] font-semibold text-dark mb-5">Find Your Doctor</h1>

          <div className="flex items-center gap-3 bg-white border border-border rounded-[14px] px-4 py-3">
            <div className="flex-1 flex items-center gap-3 border-r border-border pr-4">
              <MagnifyingGlass size={18} className="text-muted flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-muted uppercase tracking-[0.6px]">Specialty / Doctor</p>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="e.g. Cardiologist..." className="text-[14px] text-dark outline-none w-full bg-transparent mt-0.5" />
              </div>
              {search && <button onClick={() => setSearch('')}><X size={14} className="text-muted hover:text-dark" /></button>}
            </div>
            <div className="border-r border-border pr-4">
              <p className="text-[11px] font-bold text-muted uppercase tracking-[0.6px]">City</p>
              <select className="text-[14px] text-dark outline-none bg-transparent mt-0.5">
                <option>All Cities</option>
                <option>Karachi</option><option>Lahore</option><option>Islamabad</option><option>Rawalpindi</option>
              </select>
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted uppercase tracking-[0.6px]">Availability</p>
              <select className="text-[14px] text-dark outline-none bg-transparent mt-0.5">
                <option>Any Date</option><option>Today</option><option>This Week</option>
              </select>
            </div>
            <button className="flex items-center gap-2 bg-blue text-white px-5 py-3 rounded-[8px] text-[15px] font-bold hover:bg-blue-dark transition-colors ml-2">
              <MagnifyingGlass size={18} weight="bold" /> Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-10 py-9">
        <div className="grid grid-cols-[280px_1fr] gap-8">
          {/* Sidebar filters */}
          <aside>
            <div className="card-static p-6 sticky top-[88px]">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[16px] font-bold text-dark">Filters</h3>
                <button onClick={reset} className="text-[13px] text-blue font-medium hover:underline">Reset All</button>
              </div>

              {/* Specialty */}
              <div className="mb-6 pb-6 border-b border-border">
                <p className="text-[13px] font-bold text-slate uppercase tracking-[0.6px] mb-3.5">Specialty</p>
                <select value={spec} onChange={e => setSpec(e.target.value)} className="form-input text-[14px]">
                  <option value="">All Specialties</option>
                  {specialties.map(s => <option key={s.name}>{s.name}</option>)}
                </select>
              </div>

              {/* Gender */}
              <div className="mb-6 pb-6 border-b border-border">
                <p className="text-[13px] font-bold text-slate uppercase tracking-[0.6px] mb-3.5">Gender</p>
                {genders.map(g => (
                  <label key={g} className="flex items-center gap-2.5 mb-2.5 cursor-pointer">
                    <div onClick={() => setGender(g)}
                      className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        gender === g ? 'bg-blue border-blue' : 'border-border'
                      }`}>
                      {gender === g && <span className="text-white text-[11px] font-bold leading-none">✓</span>}
                    </div>
                    <span className="text-[14px] text-dark">{g}</span>
                  </label>
                ))}
              </div>

              {/* Rating */}
              <div className="mb-6 pb-6 border-b border-border">
                <p className="text-[13px] font-bold text-slate uppercase tracking-[0.6px] mb-3.5">Minimum Rating</p>
                {ratings.map(r => (
                  <label key={r.val} className="flex items-center gap-2.5 mb-2.5 cursor-pointer">
                    <div onClick={() => setRating(minRating === r.val ? 0 : r.val)}
                      className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        minRating === r.val ? 'bg-blue border-blue' : 'border-border'
                      }`}>
                      {minRating === r.val && <span className="text-white text-[11px] font-bold leading-none">✓</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="stars text-[15px]">{r.label.split(' ')[0]}</span>
                      <span className="text-[13px] text-muted">{r.label.split(' ')[1]}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Fee */}
              <div className="mb-6 pb-6 border-b border-border">
                <p className="text-[13px] font-bold text-slate uppercase tracking-[0.6px] mb-3.5">Fee Range (PKR)</p>
                <div className="flex gap-2">
                  <input value={feeMin} onChange={e => setFeeMin(e.target.value)} placeholder="Min" className="form-input w-1/2 text-[14px]" />
                  <input value={feeMax} onChange={e => setFeeMax(e.target.value)} placeholder="Max" className="form-input w-1/2 text-[14px]" />
                </div>
              </div>

              {/* Availability */}
              <div>
                <p className="text-[13px] font-bold text-slate uppercase tracking-[0.6px] mb-3.5">Availability</p>
                {avail.map(a => (
                  <label key={a.key} className="flex items-center gap-2.5 mb-2.5 cursor-pointer">
                    <div className="w-[18px] h-[18px] rounded-[5px] border-2 border-border flex items-center justify-center flex-shrink-0" />
                    <span className="text-[14px] text-dark">{a.label}</span>
                  </label>
                ))}
              </div>

              <button className="w-full mt-5 py-3 bg-blue text-white rounded-sm text-[14px] font-bold hover:bg-blue-dark transition-colors">
                Apply Filters
              </button>
            </div>
          </aside>

          {/* Results */}
          <main>
            <div className="flex justify-between items-center mb-5">
              <p className="text-[15px] text-slate">
                Showing <strong className="text-dark">{filtered.length} doctors</strong>
                {spec && <> in <strong className="text-dark">{spec}</strong></>}
              </p>
              <select value={sortBy} onChange={e => setSort(e.target.value)}
                className="px-3.5 py-2 border border-border rounded-sm text-[14px] text-dark bg-white font-dm">
                {['Relevance', 'Rating (High to Low)', 'Fee (Low to High)', 'Experience'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-4">
              {filtered.map(d => <DoctorCard key={d.id} doctor={d} horizontal />)}
              {filtered.length === 0 && (
                <div className="card p-16 text-center">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="font-fraunces text-[22px] font-semibold text-dark mb-2">No doctors found</p>
                  <p className="text-muted text-[15px]">Try adjusting your filters or search term.</p>
                  <button onClick={reset} className="btn-ghost mt-5">Clear Filters</button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="flex justify-center gap-1.5 mt-9">
                {['←', '1', '2', '3', '4', '→'].map((p, i) => (
                  <button key={i}
                    className={`w-[38px] h-[38px] rounded-sm border text-[14px] font-semibold transition-all duration-200 ${
                      p === '1' ? 'bg-blue border-blue text-white' : 'border-border text-slate hover:border-blue hover:text-blue bg-white'
                    }`}>{p}</button>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
