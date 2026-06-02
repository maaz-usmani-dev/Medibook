import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DoctorCard from '../components/DoctorCard';
import { api } from '../services/api';
import { normalizeDoctor } from '../utils/normalizeDoctor';

const genders = ['Any', 'Male', 'Female'];
const ratings = [{ label: '★★★★★ 4+', val: 4 }, { label: '★★★★ 3+', val: 3 }];
const avail   = [{ label: 'Any Date', key: 'any' }, { label: 'Available Today', key: 'today' }, { label: 'This Week', key: 'week' }];

export default function DoctorListing() {
  const [searchParams] = useSearchParams();
  const [search, setSearch]   = useState('');
  const [city, setCity]       = useState('');
  const [available, setAvailable] = useState('any');
  const [spec, setSpec]       = useState('');
  const [gender, setGender]   = useState('Any');
  const [minRating, setRating]= useState(0);
  const [sortBy, setSort]     = useState('Relevance');
  const [feeMin, setFeeMin]   = useState('');
  const [feeMax, setFeeMax]   = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [doctorsData, setDoctorsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buildQuery = (overrides = {}) => {
    const params = {};
    const searchValue = overrides.search ?? search;
    const cityValue = overrides.city ?? city;
    const specialtyValue = overrides.specialty ?? spec;
    const availableValue = overrides.available ?? available;

    if (searchValue) params.q = searchValue;
    if (cityValue) params.city = cityValue;
    if (specialtyValue) params.specialty = specialtyValue;
    if (gender !== 'Any') params.gender = gender;
    if (availableValue !== 'any') params.available = 'true';
    params.page = overrides.page ?? page;
    params.limit = limit;
    return params;
  };

  const fetchDoctors = async (overrides = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.getDoctors(buildQuery(overrides));
      const doctors = Array.isArray(result) ? result : result.doctors || [];
      setDoctorsData(doctors.map(normalizeDoctor));
      setTotalDoctors(result.total ?? doctors.length);
      setPage(result.page ?? overrides.page ?? page);
    } catch (err) {
      setError(err.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const cityParam = searchParams.get('city') || '';
    const specialtyParam = searchParams.get('specialty') || '';

    setSearch(q);
    setCity(cityParam);
    setSpec(specialtyParam);
    setPage(1);
    fetchDoctors({ search: q, city: cityParam, specialty: specialtyParam, page: 1 });
  }, [searchParams]);

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

  const reset = () => {
    setSpec('');
    setGender('Any');
    setRating(0);
    setFeeMin('');
    setFeeMax('');
    setAvailable('any');
    setSearch('');
    setCity('');
    setPage(1);
    fetchDoctors({ search: '', city: '', specialty: '', available: 'any', page: 1 });
  };

  const specialties = useMemo(() => {
    const set = new Set();
    doctorsData.forEach(d => d.specialty && set.add(d.specialty));
    return Array.from(set).map(name => ({ name }));
  }, [doctorsData]);

  const totalPages = Math.max(1, Math.ceil(totalDoctors / limit));
  const shouldShowPagination = totalPages > 1 && !(page === 1 && filtered.length <= limit);

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
              <select value={city} onChange={e => setCity(e.target.value)} className="text-[14px] text-dark outline-none bg-transparent mt-0.5">
                <option value="">All Cities</option>
                <option value="Karachi">Karachi</option>
                <option value="Lahore">Lahore</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Rawalpindi">Rawalpindi</option>
              </select>
            </div>
            <div className="border-r border-border pr-4">
              <p className="text-[11px] font-bold text-muted uppercase tracking-[0.6px]">Specialty</p>
              <select value={spec} onChange={e => setSpec(e.target.value)} className="text-[14px] text-dark outline-none bg-transparent mt-0.5">
                <option value="">All Specialties</option>
                {specialties.map(s => <option key={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted uppercase tracking-[0.6px]">Availability</p>
              <select value={available} onChange={e => setAvailable(e.target.value)} className="text-[14px] text-dark outline-none bg-transparent mt-0.5">
                {avail.map(option => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </div>
            <button onClick={fetchDoctors} className="flex items-center gap-2 bg-blue text-white px-5 py-3 rounded-[8px] text-[15px] font-bold hover:bg-blue-dark transition-colors ml-2">
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
                <select value={available} onChange={e => setAvailable(e.target.value)} className="form-input text-[14px] w-full">
                  {avail.map(a => (
                    <option key={a.key} value={a.key}>{a.label}</option>
                  ))}
                </select>
              </div>

              <button onClick={fetchDoctors} className="w-full mt-5 py-3 bg-blue text-white rounded-sm text-[14px] font-bold hover:bg-blue-dark transition-colors">
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
              {loading && (
                <div className="card p-10 text-center text-muted">Loading doctors...</div>
              )}
              {!loading && error && (
                <div className="card p-10 text-center">
                  <p className="font-fraunces text-[22px] font-semibold text-dark mb-2">Unable to load doctors</p>
                  <p className="text-red text-[15px]">{error}</p>
                </div>
              )}
              {!loading && !error && filtered.map(d => <DoctorCard key={d.id} doctor={d} horizontal />)}
              {!loading && !error && filtered.length === 0 && (
                <div className="card p-16 text-center">
                  <p className="font-fraunces text-[22px] font-semibold text-dark mb-2">No doctors found</p>
                  <p className="text-muted text-[15px]">Try adjusting your filters or search term.</p>
                  <button onClick={reset} className="btn-ghost mt-5">Clear Filters</button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {shouldShowPagination && (
              <div className="flex flex-col items-center gap-3 mt-9">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (page > 1) fetchDoctors({ page: page - 1 });
                    }}
                    disabled={page === 1}
                    className="btn-ghost px-4 py-2 disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <span className="text-[14px] text-slate">
                    Page <strong className="text-dark">{page}</strong> of <strong className="text-dark">{totalPages}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (page < totalPages) fetchDoctors({ page: page + 1 });
                    }}
                    disabled={page >= totalPages}
                    className="btn-ghost px-4 py-2 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="text-[13px] text-muted">
                  Showing {filtered.length} of {totalDoctors} doctors
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
