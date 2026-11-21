import { MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const CustomerFooter = ({ userData }) => {
  const { pathname } = useLocation();
  const role = userData?.role || userData?.user || "user";
  if (["/signup", "/signin", "/register", "/login"].includes(pathname) || role === "owner" || role === "deliveryBoy") return null;

  return (
    <footer id="footer" className="mt-auto w-full border-t border-white/10 bg-[#26221f] text-white">
      <div className="mx-auto grid max-w-7xl gap-9 px-5 py-10 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-12">
        <div>
          <Link to="/" aria-label="SnapEats home" className="inline-flex items-center gap-2.5">
            <span className="logo-smoke text-[1.55rem] font-extrabold tracking-tight">SnapEats</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/60">Good food from neighborhood kitchens, brought closer to your table.</p>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-white/50"><MapPin size={13} /> Made for your neighborhood</p>
        </div>

        <nav aria-label="Explore SnapEats">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/85">Explore</h2>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm text-white/60">
            <Link className="transition hover:text-white" to="/">Home</Link>
            {userData && <Link className="transition hover:text-white" to="/cart">Your cart</Link>}
            {userData && <Link className="transition hover:text-white" to="/my-orders">Your orders</Link>}
          </div>
        </nav>

        <nav aria-label="Your SnapEats account">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/85">Your account</h2>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm text-white/60">
            {userData ? <>
              <Link className="transition hover:text-white" to="/my-orders">Order history</Link>
              <Link className="transition hover:text-white" to="/cart">Go to checkout</Link>
            </> : <>
              <Link className="transition hover:text-white" to="/signin">Log in</Link>
              <Link className="transition hover:text-white" to="/signup">Create an account</Link>
            </>}
          </div>
        </nav>

        <nav aria-label="Partner with SnapEats">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/85">Partner with us</h2>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm text-white/60">
            <Link className="transition hover:text-white" to="/signup">Restaurant partner</Link>
            <Link className="transition hover:text-white" to="/signup">Delivery partner</Link>
          </div>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>© {new Date().getFullYear()} SnapEats. All rights reserved.</span>
          <span>Fresh meals. Friendly delivery. Right around the corner.</span>
        </div>
      </div>
    </footer>
  );
};

export default CustomerFooter;
