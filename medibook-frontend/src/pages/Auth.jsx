import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Eye, EyeSlash, GoogleLogo } from "@phosphor-icons/react";
// import Logo from '../components/Logo';

function PasswordInput({ value, onChange, name, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="form-input pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-slate transition-colors"
      >
        {show ? <EyeSlash size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

const AuthRight = ({ img, quote }) => (
  <div
    className="hidden lg:flex flex-col items-center justify-center p-[60px] relative overflow-hidden"
    style={{ background: "linear-gradient(145deg, #0F2549 0%, #1A3A6B 100%)" }}
  >
    <div
      className="absolute -top-[100px] -right-[100px] w-[400px] h-[400px] rounded-full pointer-events-none"
      style={{
        background:
          "radial-gradient(circle, rgba(26,110,191,0.3) 0%, transparent 70%)",
      }}
    />
    <img
      src={img}
      alt="Medical"
      className="w-full max-w-[360px] rounded-[20px] shadow-lg relative z-10 object-cover h-[280px]"
    />
    <div className="text-center mt-9 relative z-10">
      <h2 className="font-fraunces text-[28px] font-semibold text-white mb-2.5">
        Your Health, Our Priority
      </h2>
      <p className="text-[15px] text-white/60">{quote}</p>
    </div>
  </div>
);

function SignUpField({ form, errors, onChange, name, label, type = "text", placeholder, half }) {
  return (
    <div className={half ? "" : "col-span-2"}>
      <label className="form-label block mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={onChange}
        placeholder={placeholder}
        className={`form-input ${errors[name] ? "border-red" : ""}`}
      />
      {errors[name] && (
        <p className="text-[12px] text-red mt-1">{errors[name]}</p>
      )}
    </div>
  );
}

const loadGoogleScript = () => {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      return resolve();
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', resolve);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.body.appendChild(script);
  });
};

const initGoogleButton = ({ buttonId, onSuccess }) => {
  if (!window.google?.accounts?.id) return;

  window.google.accounts.id.initialize({
    client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    callback: onSuccess,
  });

  const container = document.getElementById(buttonId);
  if (!container) return;

  container.innerHTML = '';
  window.google.accounts.id.renderButton(container, {
    theme: 'outline',
    size: 'large',
    width: '100%',
    text: 'signin_with',
  });
};

export function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
    phone: "",
    dob: "",
    gender: "Male",
    role: "patient",
    specialty: "",
    hospital: "",
    experience_years: "",
    fee: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [googleUser, setGoogleUser] = useState(null);
  const [googleExtra, setGoogleExtra] = useState({
    role: 'patient',
    dob: '',
    gender: 'Male',
    phone: '',
  });
  const ch = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    if (!googleUser) {
      loadGoogleScript().then(() => {
        if (window.google?.accounts?.id) {
          initGoogleButton({ buttonId: 'google-signup-button', onSuccess: handleGoogleSuccess });
        }
      });
    }
  }, [googleUser]);

  const handleGoogleSuccess = async (response) => {
    const idToken = response?.credential;
    if (!idToken) {
      setApiError('Google sign-in failed.');
      return;
    }

    try {
      setLoading(true);
      setApiError("");

      const data = await api.googleLogin({ idToken });
      if (data.needsProfileCompletion) {
        setGoogleUser(data.user);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.role === "doctor") {
        navigate("/doctor-dashboard");
      } else if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/patient-dashboard");
      }
    } catch (err) {
      setApiError(err.message || "Google sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCompletion = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!googleExtra.dob || !googleExtra.phone) {
      setApiError('Please fill in your date of birth and phone number.');
      return;
    }

    try {
      setLoading(true);
      setApiError("");

      const data = await api.completeGoogleProfile({
        date_of_birth: googleExtra.dob,
        gender: googleExtra.gender,
        role: googleExtra.role,
        phone: googleExtra.phone,
      });

      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.role === "doctor") {
        navigate("/doctor-dashboard");
      } else if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/patient-dashboard");
      }
    } catch (err) {
      setApiError(err.message || 'Unable to complete Google sign-up.');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const err = {};
    if (!form.firstName.trim()) err.firstName = "Required";
    if (!form.lastName.trim()) err.lastName = "Required";
    if (!form.email.includes("@")) err.email = "Enter a valid email";
    if (form.password.length < 8) err.password = "Minimum 8 characters";
    if (form.password !== form.confirm) err.confirm = "Passwords do not match";
    if (!form.phone.trim()) err.phone = "Required";
    if (form.role === 'doctor') {
      if (!form.specialty.trim()) err.specialty = "Required";
      if (!form.hospital.trim()) err.hospital = "Required";
    }
    return err;
  };

  const submit = async (e) => {
    e.preventDefault();

    const err = validate();

    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }

    try {
      setLoading(true);
      setApiError("");

      const payload = {
        full_name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone,
        gender: form.gender,
        date_of_birth: form.dob,
      };

      if (form.role === 'doctor') {
        payload.specialty = form.specialty;
        payload.hospital = form.hospital;
        payload.experience_years = form.experience_years;
        payload.fee = form.fee;
      }

      const data = await api.register(payload);
      setApiError("");

      if (data.user.role === "doctor") {
        navigate("/login", {
          state: {
            info: data.message || 'Your doctor application is pending admin approval.',
          },
        });
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/patient-dashboard");
    } catch (err) {
      setApiError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left */}
      <div className="flex items-center justify-center p-[60px] bg-white overflow-y-auto">
        <div className="w-full max-w-[440px]">
          {/* <div className="mb-10"><Logo /></div> */}
          <h1 className="font-fraunces text-[32px] font-semibold text-dark mb-2">
            Create your account
          </h1>
          <p className="text-[15px] text-muted mb-9">
            Join thousands of patients booking smarter.
          </p>

          <form onSubmit={submit} className="space-y-4">
            {apiError && (
              <div className="bg-red-light border border-red/20 text-red text-[13px] rounded-sm px-4 py-3">
                {apiError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <SignUpField
                form={form}
                errors={errors}
                onChange={ch}
                name="firstName"
                label="First Name"
                placeholder="Muhammad"
                half
              />
              <SignUpField form={form} errors={errors} onChange={ch} name="lastName" label="Last Name" placeholder="Ali" half />
            </div>
            <div>
              <label className="form-label block mb-1.5">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={ch}
                placeholder="you@example.com"
                className={`form-input ${errors.email ? "border-red" : ""}`}
              />
              {errors.email && (
                <p className="text-[12px] text-red mt-1">{errors.email}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label block mb-1.5">Password</label>
                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={ch}
                  placeholder="Min. 8 characters"
                />
                {errors.password && (
                  <p className="text-[12px] text-red mt-1">{errors.password}</p>
                )}
              </div>
              <div>
                <label className="form-label block mb-1.5">
                  Confirm Password
                </label>
                <PasswordInput
                  name="confirm"
                  value={form.confirm}
                  onChange={ch}
                  placeholder="Repeat password"
                />
                {errors.confirm && (
                  <p className="text-[12px] text-red mt-1">{errors.confirm}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label block mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={ch}
                  placeholder="+92 300 0000000"
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label block mb-1.5">Gender</label>

                <select
                  name="gender"
                  value={form.gender}
                  onChange={ch}
                  className="form-input"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label block mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={ch}
                  className="form-input"
                />
              </div>
            </div>

            {/* Role picker */}
            <div>
              <label className="form-label block mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                {["patient", "doctor"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`py-2 rounded-sm text-[13px] font-semibold border capitalize transition-all ${
                      form.role === r
                        ? "bg-blue border-blue text-white"
                        : "border-border text-slate hover:border-blue"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {form.role === 'doctor' && (
              <div className="grid grid-cols-2 gap-4">
                <SignUpField form={form} errors={errors} onChange={ch} name="specialty" label="Specialty" placeholder="Cardiology" half />
                <SignUpField form={form} errors={errors} onChange={ch} name="hospital" label="Hospital / Clinic" placeholder="City Hospital" half />
                <SignUpField form={form} errors={errors} onChange={ch} name="experience_years" label="Experience Years" type="number" placeholder="5" half />
                <SignUpField form={form} errors={errors} onChange={ch} name="fee" label="Consultation Fee" type="number" placeholder="1500" half />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue text-white font-semibold text-[16px] rounded-sm hover:bg-blue-dark transition-all shadow-[0_2px_12px_rgba(26,110,191,0.35)] hover:shadow-[0_4px_20px_rgba(26,110,191,0.45)] hover:-translate-y-px mt-2"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <div className="flex items-center gap-3.5 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[13px] text-muted font-medium">
                or continue with
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {!googleUser ? (
              <div id="google-signup-button" className="w-full" />
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-sm bg-slate-50 border border-border">
                  <p className="text-[14px] font-semibold text-dark">Continue signing up with Google</p>
                  <p className="text-[13px] text-muted mt-1">{googleUser.full_name} ({googleUser.email})</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label block mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={googleExtra.dob}
                      onChange={(e) => setGoogleExtra({ ...googleExtra, dob: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label block mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={googleExtra.phone}
                      onChange={(e) => setGoogleExtra({ ...googleExtra, phone: e.target.value })}
                      placeholder="03xx xxx xxxx"
                      className="form-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label block mb-1.5">Gender</label>
                  <select
                    name="gender"
                    value={googleExtra.gender}
                    onChange={(e) => setGoogleExtra({ ...googleExtra, gender: e.target.value })}
                    className="form-input"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label block mb-1.5">I am a</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['patient', 'doctor'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setGoogleExtra({ ...googleExtra, role: r })}
                        className={`py-2 rounded-sm text-[13px] font-semibold border capitalize transition-all ${
                          googleExtra.role === r
                            ? 'bg-blue border-blue text-white'
                            : 'border-border text-slate hover:border-blue'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleCompletion}
                  disabled={loading}
                  className="w-full py-3.5 bg-blue text-white font-semibold text-[16px] rounded-sm hover:bg-blue-dark transition-all shadow-[0_2px_12px_rgba(26,110,191,0.35)] hover:shadow-[0_4px_20px_rgba(26,110,191,0.45)] hover:-translate-y-px mt-2"
                >
                  {loading ? 'Completing sign up...' : 'Complete sign up'}
                </button>
              </div>
            )}
          </form>

          <p className="text-center text-[14px] text-muted mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <AuthRight
        img="https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=720&h=540&fit=crop"
        quote="Connect with Pakistan's best doctors. Any time. Any place."
      />
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [authFlow, setAuthFlow] = useState('login');
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [googleUser, setGoogleUser] = useState(null);
  const [googleExtra, setGoogleExtra] = useState({
    role: 'patient',
    dob: '',
    gender: 'Male',
    phone: '',
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const ch = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    if (authFlow !== 'login' || googleUser) return;

    loadGoogleScript().then(() => {
      if (window.google?.accounts?.id) {
        initGoogleButton({ buttonId: 'google-login-button', onSuccess: handleGoogleSuccess });
      }
    });
  }, [authFlow, googleUser]);

  const handleGoogleSuccess = async (response) => {
    const idToken = response?.credential;
    if (!idToken) {
      setError('Google sign-in failed.');
      return;
    }

    try {
      setLoading(true);
      setError("");
      setInfo("");

      const data = await api.googleLogin({ idToken });
      if (data.needsProfileCompletion) {
        setGoogleUser(data.user);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.role === "doctor") {
        navigate("/doctor-dashboard");
      } else if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/patient-dashboard");
      }
    } catch (err) {
      setError(err.message || "Google sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCompletion = async (e) => {
    e.preventDefault();
    setError("");

    if (!googleExtra.dob || !googleExtra.phone) {
      setError('Please fill in your date of birth and phone number.');
      return;
    }

    try {
      setLoading(true);
      setError("");
      setInfo("");

      const data = await api.completeGoogleProfile({
        date_of_birth: googleExtra.dob,
        gender: googleExtra.gender,
        role: googleExtra.role,
        phone: googleExtra.phone,
      });

      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.role === "doctor") {
        navigate("/doctor-dashboard");
      } else if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/patient-dashboard");
      }
    } catch (err) {
      setError(err.message || 'Unable to complete Google sign in.');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (authFlow !== 'login') return;

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setInfo("");

      const data = await api.login({
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "doctor") {
        navigate("/doctor-dashboard");
      } else if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/patient-dashboard");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Enter your email to continue.');
      return;
    }

    try {
      setLoading(true);
      setError("");
      setInfo("");

      const data = await api.forgotPassword({ email: forgotEmail });
      setInfo(data.message || 'Check your inbox for reset instructions.');
      if (data.resetToken) {
        setInfo(`${data.message} Use this token to reset your password: ${data.resetToken}`);
      }
      setAuthFlow('reset');
    } catch (err) {
      setError(err.message || 'Unable to process reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      setError('Token and a new password are required.');
      return;
    }

    try {
      setLoading(true);
      setError("");
      setInfo("");

      const data = await api.resetPassword({ token: resetToken, newPassword });
      setInfo(data.message || 'Password reset successful. Sign in now.');
      setAuthFlow('login');
      setForm({ email: forgotEmail || '', password: '' });
      setForgotEmail('');
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-[60px] bg-white">
        <div className="w-full max-w-[400px]">
          {/* <div className="mb-10"><Logo /></div> */}
          <h1 className="font-fraunces text-[32px] font-semibold text-dark mb-2">
            Welcome back 👋
          </h1>
          <p className="text-[15px] text-muted mb-9">
            Sign in to manage your appointments.
          </p>

          {location.state?.info && (
            <div className="bg-blue-light border border-blue/20 text-blue text-[13px] rounded-sm px-4 py-3 mb-5">
              {location.state.info}
            </div>
          )}
          {info && (
            <div className="bg-blue-light border border-blue/20 text-blue text-[13px] rounded-sm px-4 py-3 mb-5">
              {info}
            </div>
          )}
          {error && (
            <div className="bg-red-light border border-red/20 text-red text-[13px] rounded-sm px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form
            onSubmit={authFlow === 'forgot' ? handleForgotSubmit : authFlow === 'reset' ? handleResetSubmit : submit}
            className="space-y-4"
          >
            {authFlow !== 'reset' && (
              <div>
                <label className="form-label block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={authFlow === 'forgot' ? forgotEmail : form.email}
                  onChange={(e) => {
                    if (authFlow === 'forgot') {
                      setForgotEmail(e.target.value);
                    } else {
                      ch(e);
                    }
                  }}
                  placeholder="you@example.com"
                  className="form-input"
                />
              </div>
            )}

            {authFlow === 'login' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setInfo("");
                      setAuthFlow('forgot');
                    }}
                    className="text-[13px] text-blue font-medium hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={ch}
                  placeholder="Your password"
                />
              </div>
            )}

            {authFlow === 'reset' && (
              <>
                <div>
                  <label className="form-label block mb-1.5">Reset Token</label>
                  <input
                    type="text"
                    name="resetToken"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste your reset code"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label block mb-1.5">New Password</label>
                  <PasswordInput
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter a new password"
                  />
                </div>
              </>
            )}

            {authFlow === 'forgot' && (
              <p className="text-[13px] text-muted">
                Enter the email address associated with your account and we'll send a reset token.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue text-white font-semibold text-[16px] rounded-sm hover:bg-blue-dark transition-all shadow-[0_2px_12px_rgba(26,110,191,0.35)] hover:shadow-[0_4px_20px_rgba(26,110,191,0.45)] hover:-translate-y-px mt-2"
            >
              {loading
                ? authFlow === 'forgot'
                  ? 'Sending reset email...'
                  : authFlow === 'reset'
                  ? 'Resetting password...'
                  : 'Signing In...'
                : authFlow === 'forgot'
                ? 'Send reset link'
                : authFlow === 'reset'
                ? 'Reset password'
                : 'Sign In'}
            </button>

            {authFlow !== 'login' && (
              <button
                type="button"
                onClick={() => {
                  setAuthFlow('login');
                  setError("");
                  setInfo("");
                }}
                className="w-full py-3 text-blue text-[14px] font-semibold hover:underline"
              >
                Back to sign in
              </button>
            )}

            <div className="flex items-center gap-3.5 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[13px] text-muted font-medium">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {!googleUser && authFlow === 'login' ? (
              <div id="google-login-button" className="w-full" />
            ) : googleUser ? (
              <div className="space-y-4">
                <div className="p-4 rounded-sm bg-slate-50 border border-border">
                  <p className="text-[14px] font-semibold text-dark">Continue signing in with Google</p>
                  <p className="text-[13px] text-muted mt-1">{googleUser.full_name} ({googleUser.email})</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label block mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={googleExtra.dob}
                      onChange={(e) => setGoogleExtra({ ...googleExtra, dob: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label block mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={googleExtra.phone}
                      onChange={(e) => setGoogleExtra({ ...googleExtra, phone: e.target.value })}
                      placeholder="03xx xxx xxxx"
                      className="form-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label block mb-1.5">Gender</label>
                  <select
                    value={googleExtra.gender}
                    onChange={(e) => setGoogleExtra({ ...googleExtra, gender: e.target.value })}
                    className="form-input"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label block mb-1.5">I am a</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['patient', 'doctor'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setGoogleExtra({ ...googleExtra, role: r })}
                        className={`py-2 rounded-sm text-[13px] font-semibold border capitalize transition-all ${
                          googleExtra.role === r
                            ? 'bg-blue border-blue text-white'
                            : 'border-border text-slate hover:border-blue'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleCompletion}
                  disabled={loading}
                  className="w-full py-3.5 bg-blue text-white font-semibold text-[16px] rounded-sm hover:bg-blue-dark transition-all shadow-[0_2px_12px_rgba(26,110,191,0.35)] hover:shadow-[0_4px_20px_rgba(26,110,191,0.45)] hover:-translate-y-px mt-2"
                >
                  {loading ? 'Completing sign in...' : 'Complete sign in'}
                </button>
              </div>
            ) : null}
          </form>

          <p className="text-center text-[14px] text-muted mt-6">
            New to MediBook?{" "}
            <Link
              to="/signup"
              className="text-blue font-semibold hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>

      <AuthRight
        img="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=720&h=540&fit=crop"
        quote="500+ verified doctors ready to help. Book in under 2 minutes."
      />
    </div>
  );
}
