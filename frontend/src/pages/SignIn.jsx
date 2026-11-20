import React, { useState } from "react";
import { ArrowRight, Bike, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Link } from "react-router-dom";
import axios from "axios";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { serverUrl } from "../App";
import { Button } from "../components/ui/button";
import signinFood from "../assets/image5.jpg";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSignIn = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signin`,
        { email, password },
        { withCredentials: true },
      );
      dispatch(setUserData(result.data));
      setErr("");
    } catch (error) {
      setErr(error?.response?.data?.message || "We couldn’t sign you in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { data } = await axios.post(
        `${serverUrl}/api/auth/google-auth`,
        { fullName: result.user.displayName, email: result.user.email },
        { withCredentials: true },
      );
      dispatch(setUserData(data));
      setErr("");
    } catch (error) {
      if (error?.code === "auth/unauthorized-domain") {
        setErr("This domain is not authorized for Google Sign-In in Firebase Console. Please add snapeats-fjjn.onrender.com to Firebase Authentication -> Settings -> Authorized Domains.");
      } else {
        setErr(error?.response?.data?.message || error?.message || "Google sign in didn’t finish. Please try again.");
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#fff1e8] p-3 text-[#26221f] sm:p-5 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-[0_24px_80px_-44px_rgba(94,48,27,0.36)] sm:min-h-[calc(100vh-2.5rem)] sm:grid-cols-[0.82fr_1fr] sm:rounded-[2rem] lg:min-h-[calc(100vh-4rem)]">
        <aside className="relative min-h-[210px] overflow-hidden bg-[#e8b889] sm:min-h-[740px]">
          <img
            src={signinFood}
            alt="Freshly made burger ready to enjoy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#21150f]/85 via-[#21150f]/15 to-[#21150f]/10" />
          <div className="relative flex h-full min-h-[210px] flex-col justify-between p-5 text-white sm:min-h-[740px] sm:p-7 lg:p-9">
            <Link to="/" className="inline-flex w-fit items-center gap-2.5 rounded-full bg-white/15 px-3 py-2 backdrop-blur-md sm:hidden">
              <span className="logo-smoke-mark flex size-8 items-center justify-center rounded-xl text-white">
                <Bike size={18} strokeWidth={2.5} />
              </span>
              <span className="text-lg font-extrabold tracking-tight">SnapEats</span>
            </Link>

            <div className="max-w-sm">
              <span className="mb-3 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm sm:mb-4 sm:text-xs">
                Welcome back to the table
              </span>
              <h2 className="text-3xl font-black leading-[1.02] tracking-tight sm:text-4xl lg:text-5xl">
                Your next favorite is waiting.
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-6 text-white/80 sm:mt-4 sm:text-base">
                Pick up where your cravings left off with neighborhood favorites made fresh for you.
              </p>
            </div>
          </div>
        </aside>

        <section className="bg-gradient-to-br from-[#fffdfb] via-[#fff8f3] to-[#ffefe5] flex items-center justify-center px-5 py-8 sm:px-7 sm:py-10 lg:px-12 lg:py-12">
          <div className="w-full max-w-md">
            <Link to="/" aria-label="SnapEats home" className="mb-8 hidden items-center gap-2.5 sm:inline-flex lg:mb-10">
              <span className="logo-smoke-mark flex size-9 items-center justify-center rounded-xl text-white">
                <Bike size={19} strokeWidth={2.5} />
              </span>
              <span className="logo-smoke text-xl font-extrabold tracking-tight">SnapEats</span>
            </Link>

            <div className="mb-7">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#a35a38]">Good to see you</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#26221f] sm:text-4xl">Welcome back</h1>
              <p className="mt-2 text-sm leading-6 text-[#746b64] sm:text-base">
                Sign in to find your next favorite meal.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSignIn}>
              <div>
                <label htmlFor="signin-email" className="mb-1.5 block text-sm font-semibold text-[#433c37]">
                  Email
                </label>
                <input
                  id="signin-email"
                  autoComplete="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-[#eadfd8] bg-[#fffdfb] px-3.5 text-sm outline-none transition placeholder:text-[#a39a93] focus:border-[#ff4d2d] focus:ring-4 focus:ring-[#ff4d2d]/10"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="signin-password" className="block text-sm font-semibold text-[#433c37]">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-[#e94325] underline-offset-4 hover:underline sm:text-sm">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="signin-password"
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-11 w-full rounded-xl border border-[#eadfd8] bg-[#fffdfb] px-3.5 pr-11 text-sm outline-none transition placeholder:text-[#a39a93] focus:border-[#ff4d2d] focus:ring-4 focus:ring-[#ff4d2d]/10"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#827971] transition hover:text-[#26221f]"
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {err && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {err}
                </p>
              )}

              <Button type="submit" variant="destructive" size="lg" className="h-11 w-full rounded-xl px-5" loading={loading}>
                Sign in <ArrowRight size={16} />
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs font-medium text-[#a39a93]">
              <span className="h-px flex-1 bg-[#eee4de]" />
              or continue with
              <span className="h-px flex-1 bg-[#eee4de]" />
            </div>

            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[#eadfd8] bg-white text-sm font-semibold text-[#433c37] transition hover:bg-[#fff9f6]"
              onClick={handleGoogleAuth}
            >
              <FcGoogle size={19} />
              Sign in with Google
            </button>

            <p className="mt-6 text-center text-sm text-[#746b64]">
              New to SnapEats?{" "}
              <Link to="/signup" className="font-bold text-[#e94325] underline-offset-4 hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default SignIn;
