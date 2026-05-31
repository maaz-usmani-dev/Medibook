const API = "http://localhost:5000/api";

const handleResponse = async (res) => {
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || "Something went wrong");
  }

  return data;
};

const request = async (url, options = {}) => {
  const { credentials = false, headers = {}, body, ...rest } = options;
  const config = {
    credentials: credentials ? 'include' : 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(url, config);
  return handleResponse(res);
};

const uploadRequest = async (url, formData, options = {}) => {
  const res = await fetch(url, {
    method: 'PUT',
    credentials: options.credentials ? 'include' : 'same-origin',
    body: formData,
  });
  return handleResponse(res);
};

export const api = {
  // AUTH

  register: async (body) =>
    request(`${API}/auth/register`, {
      method: 'POST',
      credentials: true,
      body,
    }),

  login: async (body) =>
    request(`${API}/auth/login`, {
      method: 'POST',
      credentials: true,
      body,
    }),

  logout: async () =>
    request(`${API}/auth/logout`, {
      method: 'POST',
      credentials: true,
    }),

  forgotPassword: async (body) =>
    request(`${API}/auth/forgot-password`, {
      method: 'POST',
      body,
    }),

  resetPassword: async (body) =>
    request(`${API}/auth/reset-password`, {
      method: 'POST',
      body,
    }),

  googleLogin: async (body) =>
    request(`${API}/auth/google-login`, {
      method: 'POST',
      credentials: true,
      body,
    }),

  completeGoogleProfile: async (body) =>
    request(`${API}/auth/google-complete-profile`, {
      method: 'PUT',
      credentials: true,
      body,
    }),

  getMe: async () =>
    request(`${API}/auth/me`, {
      credentials: true,
    }),

  updateMe: async (body) =>
    request(`${API}/auth/me`, {
      method: 'PUT',
      credentials: true,
      body,
    }),

  updateAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return uploadRequest(`${API}/auth/me/avatar`, formData, { credentials: true });
  },

  // DOCTORS

  getDoctors: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return request(`${API}/doctors?${params.toString()}`);
  },

  getDoctorById: async (id) => request(`${API}/doctors/${id}`),

  getMyDoctorProfile: async () =>
    request(`${API}/doctors/me`, {
      credentials: true,
    }),

  getDoctorAvailability: async (id, date) => {
    const query = date ? `?date=${date}` : '';
    return request(`${API}/doctors/${id}/availability${query}`);
  },

  getAllDoctors: async () => request(`${API}/doctors`),

  addDoctor: async (body) =>
    request(`${API}/admin/doctors`, {
      method: 'POST',
      credentials: true,
      body,
    }),

  // APPOINTMENTS

  bookAppointment: async (body) =>
    request(`${API}/appointments`, {
      method: 'POST',
      credentials: true,
      body,
    }),

  getMyAppointments: async () =>
    request(`${API}/appointments/my`, {
      credentials: true,
    }),

  getAppointmentById: async (id) =>
    request(`${API}/appointments/${id}`, {
      credentials: true,
    }),

  updateAppointmentStatus: async (id, status) =>
    request(`${API}/appointments/${id}/status`, {
      method: 'PUT',
      credentials: true,
      body: { status },
    }),

  rescheduleAppointment: async (id, appointment_date, time_slot) =>
    request(`${API}/appointments/${id}/reschedule`, {
      method: 'PUT',
      credentials: true,
      body: { appointment_date, time_slot },
    }),

  // AVAILABILITY

  getSlots: async (doctorId, date) => {
    const query = date ? `?date=${date}` : '';
    return request(`${API}/availability/${doctorId}${query}`);
  },

  addSlot: async (body) =>
    request(`${API}/availability`, {
      method: 'POST',
      credentials: true,
      body,
    }),

  deleteSlot: async (id) =>
    request(`${API}/availability/${id}`, {
      method: 'DELETE',
      credentials: true,
    }),

  // ADMIN

  getAdminStats: async () =>
    request(`${API}/admin/stats`, {
      credentials: true,
    }),

  getUsers: async () =>
    request(`${API}/admin/users`, {
      credentials: true,
    }),

  toggleBlockUser: async (id) =>
    request(`${API}/admin/users/${id}/block`, {
      method: 'PUT',
      credentials: true,
    }),

  getAllAppointments: async () =>
    request(`${API}/admin/appointments`, {
      credentials: true,
    }),

  getPendingDoctors: async () =>
    request(`${API}/admin/doctors/pending`, {
      credentials: true,
    }),

  updateDoctorStatus: async (doctorId, status) =>
    request(`${API}/admin/doctors/${doctorId}/status`, {
      method: 'PUT',
      credentials: true,
      body: { status },
    }),
};
