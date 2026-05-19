export const doctors = [
  {
    id: 1, name: 'Dr. Sarah Ahmed', title: 'Senior Cardiologist — City Hospital, Karachi',
    specialty: 'Cardiology', experience: 8, rating: 4.9, reviews: 124, fee: 1500,
    gender: 'Female', hospital: 'City Hospital, Karachi', available: true, nextSlot: 'Today',
    tags: ['Cardiology', 'Echocardiography', 'Heart Failure'], tagColor: 'blue',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=400&fit=crop&crop=top',
    initials: 'SA', color: '#1A6EBF',
    bio: 'Dr. Sarah Ahmed is a board-certified cardiologist with over 8 years of clinical experience. She completed her fellowship at Aga Khan University Hospital and specializes in preventive cardiology, heart failure management, and interventional procedures.',
    education: [
      { degree: 'FCPS — Cardiology', school: 'College of Physicians & Surgeons Pakistan, 2019' },
      { degree: 'MBBS', school: 'Aga Khan University, Karachi — 2014' },
    ],
    languages: ['English', 'Urdu', 'Sindhi'],
  },
  {
    id: 2, name: 'Dr. Omar Farooq', title: 'Consultant Neurologist — Aga Khan University Hospital',
    specialty: 'Neurology', experience: 12, rating: 4.8, reviews: 98, fee: 2000,
    gender: 'Male', hospital: 'Aga Khan Hospital, Karachi', available: false, nextSlot: 'Tomorrow',
    tags: ['Neurology', 'Epilepsy', 'Migraine'], tagColor: 'purple',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=400&fit=crop&crop=top',
    initials: 'OF', color: '#7C3AED',
    bio: 'Dr. Omar Farooq is a leading neurologist with 12 years of experience treating epilepsy, migraines, and neurodegenerative diseases. He completed his fellowship at the University of Toronto.',
    education: [
      { degree: 'MRCP Neurology', school: 'Royal College of Physicians, UK — 2016' },
      { degree: 'MBBS', school: 'King Edward Medical University — 2011' },
    ],
    languages: ['English', 'Urdu', 'Punjabi'],
  },
  {
    id: 3, name: 'Dr. Ayesha Khan', title: 'Consultant Pediatrician — Children\'s Hospital, Lahore',
    specialty: 'Pediatrics', experience: 10, rating: 4.9, reviews: 203, fee: 1200,
    gender: 'Female', hospital: "Children's Hospital, Lahore", available: true, nextSlot: 'Today',
    tags: ['Pediatrics', 'Neonatology', 'Child Nutrition'], tagColor: 'blue',
    photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&h=400&fit=crop&crop=top',
    initials: 'AK', color: '#11B080',
    bio: 'Dr. Ayesha Khan is a dedicated pediatrician with a passion for child health. She specializes in neonatal care, vaccination programs, and childhood developmental disorders.',
    education: [
      { degree: 'FCPS Paediatrics', school: 'CPSP Pakistan — 2015' },
      { degree: 'MBBS', school: 'University of Health Sciences — 2010' },
    ],
    languages: ['English', 'Urdu'],
  },
  {
    id: 4, name: 'Dr. Usman Raza', title: 'Senior Orthopedic Surgeon — CMH Rawalpindi',
    specialty: 'Orthopedics', experience: 15, rating: 4.9, reviews: 421, fee: 3500,
    gender: 'Male', hospital: 'CMH Rawalpindi', available: false, nextSlot: 'Monday',
    tags: ['Orthopedics', 'Joint Replacement', 'Sports Injuries'], tagColor: 'amber',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&h=400&fit=crop&crop=top',
    initials: 'UR', color: '#F59E0B',
    bio: 'Dr. Usman Raza is a senior orthopedic surgeon with 15 years of experience in joint replacement, sports injuries, and spinal surgeries.',
    education: [
      { degree: 'FRCS Orthopaedics', school: 'Royal College of Surgeons, UK — 2012' },
      { degree: 'MBBS', school: 'Army Medical College — 2005' },
    ],
    languages: ['English', 'Urdu'],
  },
  {
    id: 5, name: 'Dr. Fatima Siddiqui', title: 'Consultant Dermatologist — LUMS Hospital',
    specialty: 'Dermatology', experience: 7, rating: 4.7, reviews: 178, fee: 2000,
    gender: 'Female', hospital: 'LUMS Hospital, Lahore', available: true, nextSlot: 'Today',
    tags: ['Dermatology', 'Acne', 'Laser Treatment'], tagColor: 'green',
    photo: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=600&h=400&fit=crop&crop=top',
    initials: 'FS', color: '#E53935',
    bio: 'Dr. Fatima Siddiqui is a dermatologist with expertise in medical and cosmetic dermatology including acne, psoriasis, eczema, and laser treatments.',
    education: [
      { degree: 'FCPS Dermatology', school: 'CPSP Pakistan — 2018' },
      { degree: 'MBBS', school: 'Fatima Jinnah Medical University — 2013' },
    ],
    languages: ['English', 'Urdu'],
  },
  {
    id: 6, name: 'Dr. Bilal Chaudhry', title: 'ENT Specialist — Jinnah Hospital, Karachi',
    specialty: 'ENT', experience: 8, rating: 4.6, reviews: 134, fee: 2200,
    gender: 'Male', hospital: 'Jinnah Hospital, Karachi', available: true, nextSlot: 'Today',
    tags: ['ENT', 'Rhinology', 'Head & Neck'], tagColor: 'blue',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&h=400&fit=crop&crop=top',
    initials: 'BC', color: '#1A6EBF',
    bio: 'Dr. Bilal Chaudhry is an ENT specialist with expertise in rhinology, otology, and head & neck surgeries. He has performed over 2000 successful procedures.',
    education: [
      { degree: 'FCPS ENT', school: 'CPSP Pakistan — 2017' },
      { degree: 'MBBS', school: 'Dow University of Health Sciences — 2012' },
    ],
    languages: ['English', 'Urdu', 'Sindhi'],
  },
];

export const specialties = [
  { name: 'Cardiology',    count: 48, iconColor: '#1A6EBF', bg: '#EBF5FF' },
  { name: 'Neurology',     count: 32, iconColor: '#7C3AED', bg: '#F3EEFF' },
  { name: 'Dermatology',   count: 29, iconColor: '#11B080', bg: '#E6F9F4' },
  { name: 'Orthopedics',   count: 41, iconColor: '#B45309', bg: '#FEF3C7' },
  { name: 'Pediatrics',    count: 38, iconColor: '#1A6EBF', bg: '#EBF5FF' },
  { name: 'ENT',           count: 22, iconColor: '#11B080', bg: '#E6F9F4' },
  { name: 'Ophthalmology', count: 19, iconColor: '#7C3AED', bg: '#F3EEFF' },
  { name: 'General',       count: 87, iconColor: '#B45309', bg: '#FEF3C7' },
];

export const testimonials = [
  {
    text: "MediBook changed how I manage my health. I found a cardiologist near me within minutes and had a confirmed slot the same morning. No more waiting on hold.",
    name: 'Fatima Malik', role: 'Patient since 2023, Karachi',
    photo: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=96&h=96&fit=crop&crop=face',
  },
  {
    text: "Managing my diabetes requires frequent visits. MediBook shows real-time availability and lets me book recurring slots. The reminders are genuinely lifesaving.",
    name: 'Ahmed Raza', role: 'Diabetes Patient, Lahore',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face',
  },
  {
    text: "As a mother of three, scheduling appointments used to be chaos. Now I manage all profiles in one dashboard, track prescriptions, and never miss a follow-up.",
    name: 'Sara Qureshi', role: 'Mother of 3, Islamabad',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=face',
  },
];

export const timeSlots = [
  { time: '9:00 AM', available: true }, { time: '10:00 AM', available: false },
  { time: '11:00 AM', available: true }, { time: '12:00 PM', available: false },
  { time: '2:00 PM',  available: true }, { time: '3:00 PM',  available: true },
  { time: '4:00 PM',  available: false }, { time: '5:00 PM', available: true },
];

export const patientAppointments = [
  { id: '#MED-0091', doctor: 'Dr. Sarah Ahmed', specialty: 'Cardiology', date: 'May 15, 2024', time: '10:00 AM', type: 'In-person', status: 'confirmed', fee: 1500, photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=76&h=76&fit=crop&crop=face', hospital: 'City Hospital' },
  { id: '#MED-0087', doctor: 'Dr. Omar Farooq', specialty: 'Neurology',   date: 'May 20, 2024', time: '2:00 PM',  type: 'Video',     status: 'pending',   fee: 2000, photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=76&h=76&fit=crop&crop=face', hospital: 'Aga Khan Hospital' },
  { id: '#MED-0082', doctor: 'Dr. Ayesha Khan', specialty: 'Pediatrics',  date: 'June 1, 2024',  time: '11:00 AM', type: 'In-person', status: 'confirmed', fee: 1200, photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=76&h=76&fit=crop&crop=face', hospital: "Children's Hospital" },
  { id: '#MED-0074', doctor: 'Dr. Sarah Ahmed', specialty: 'Cardiology',  date: 'Apr 10, 2024',  time: '9:00 AM',  type: 'In-person', status: 'completed', fee: 1500, photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=76&h=76&fit=crop&crop=face', hospital: 'City Hospital' },
  { id: '#MED-0063', doctor: 'Dr. Ayesha Khan', specialty: 'Pediatrics',  date: 'Mar 28, 2024',  time: '11:00 AM', type: 'In-person', status: 'completed', fee: 1200, photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=76&h=76&fit=crop&crop=face', hospital: "Children's Hospital" },
];

export const doctorSchedule = [
  { id: '#MED-0091', patient: 'Muhammad Maaz', type: 'First visit',      time: '9:00 AM',  apptType: 'In-person', reason: 'Chest Pain Check',   status: 'confirmed', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=76&h=76&fit=crop&crop=face' },
  { id: '#MED-0092', patient: 'Sara Qureshi',  type: 'Follow-up',        time: '10:30 AM', apptType: 'Video',     reason: 'ECG Review',          status: 'pending',   photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=76&h=76&fit=crop&crop=face' },
  { id: '#MED-0093', patient: 'Fatima Malik',  type: 'Returning patient', time: '12:00 PM', apptType: 'In-person', reason: 'Blood Pressure',      status: 'confirmed', photo: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=76&h=76&fit=crop&crop=face' },
  { id: '#MED-0094', patient: 'Ahmed Raza',    type: 'First visit',       time: '2:00 PM',  apptType: 'In-person', reason: 'Annual Checkup',      status: 'confirmed', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=76&h=76&fit=crop&crop=face' },
];
