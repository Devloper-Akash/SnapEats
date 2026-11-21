import { useEffect, useState } from "react";
import { Check, Copy, TicketPercent } from "lucide-react";
import axios from "axios";

const serverUrl = import.meta.env.VITE_SERVER_URL || "https://snapeats-backend-g91m.onrender.com";

const CouponOffers = () => {
  const [offers, setOffers] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");

  useEffect(() => {
    let active = true;
    axios.get(`${serverUrl}/api/coupon/active`, { timeout: 12000 })
      .then(({ data }) => { if (active) setOffers(data.coupons || []); })
      .catch(() => { if (active) setOffers([]); });
    return () => { active = false; };
  }, []);

  const copyOfferCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(""), 1600);
    } catch {
      setCopiedCode("");
    }
  };

  if (!offers.length) return null;
  return (
    <section aria-label="Available offers" className="w-full min-w-0">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#b85738]"><TicketPercent size={13} /> Offers for you <span className="ml-auto font-medium normal-case tracking-normal text-[#9a8b81]">Swipe to see more</span></div>
      <div className="flex snap-x gap-2 overflow-x-auto pb-1">
        {offers.map((offer) => <article key={offer._id} className="flex min-w-[245px] max-w-[280px] snap-start items-center gap-2.5 rounded-xl border border-[#f0d9cb] bg-gradient-to-r from-[#fff4ea] to-[#fffaf6] p-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#e35a39] shadow-sm"><TicketPercent size={15} /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-extrabold text-[#44352c]">{offer.title}</p>
            <p className="truncate text-[10px] text-[#8b786b]">{offer.code} · {offer.freeDelivery ? "Free delivery" : `${offer.discountType === "percentage" ? `${offer.discountValue}% off` : `₹${offer.discountValue} off`}${offer.maxDiscount ? ` up to ₹${offer.maxDiscount}` : ""}`}</p>
          </div>
          <button type="button" onClick={() => copyOfferCode(offer.code)} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2 py-1.5 text-[10px] font-bold text-[#bd5436] shadow-sm transition hover:bg-[#fff0e7]">{copiedCode === offer.code ? <><Check size={12} />Copied</> : <><Copy size={12} />Copy code</>}</button>
        </article>)}
      </div>
    </section>
  );
};

export default CouponOffers;
