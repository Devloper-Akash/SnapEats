import { useEffect, useState } from "react";
import { ArrowUpRight, Copy, TicketPercent } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const serverUrl = import.meta.env.VITE_SERVER_URL || "https://snapeats-backend-g91m.onrender.com";

const CouponOffers = () => {
  const [offers, setOffers] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");
  const navigate = useNavigate();

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
    <section className="w-full rounded-[28px] border border-[#f1dfd4] bg-gradient-to-br from-[#fff6ef] via-white to-[#fff0e6] p-4 shadow-[0_14px_36px_-30px_rgba(94,48,27,0.35)] sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
        <div><div className="mb-2 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#c66a42]"><TicketPercent size={14} /> Fresh offers</div><h2 className="text-xl font-extrabold tracking-tight text-[#302923] sm:text-2xl">A little extra on your next order</h2><p className="mt-1 text-xs text-[#81766e] sm:text-sm">Use a code at checkout and enjoy something delicious for less.</p></div>
        <button type="button" onClick={() => navigate("/checkout")} className="hidden shrink-0 items-center gap-1 rounded-full border border-[#efd8ca] bg-white px-3 py-2 text-xs font-bold text-[#bb593b] transition hover:bg-[#fff7f1] sm:inline-flex">Use an offer <ArrowUpRight size={14} /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => <article key={offer._id} className="relative overflow-hidden rounded-[20px] border border-[#f0e1d8] bg-white p-4 shadow-[0_8px_22px_-18px_rgba(75,39,23,0.4)]">
          <span className="pointer-events-none absolute -right-4 -top-7 size-20 rounded-full border-[12px] border-[#fff2e9]" />
          <p className="relative text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#c66a42]">{offer.fundingSource === "shop" ? "Restaurant offer" : "SnapEats offer"}</p>
          <h3 className="relative mt-1.5 text-base font-extrabold text-[#352c27]">{offer.title}</h3>
          <p className="relative mt-1 min-h-8 text-xs leading-5 text-[#8d8077]">{offer.description || (offer.freeDelivery ? "Save on delivery with your next order." : "A tasty deal for your next order.")}</p>
          <div className="relative mt-3 flex items-center justify-between gap-2"><span className="rounded-lg border border-dashed border-[#e7bda8] bg-[#fff7f1] px-2.5 py-1.5 font-mono text-xs font-extrabold tracking-wider text-[#bd5436]">{offer.code}</span><button type="button" onClick={() => copyOfferCode(offer.code)} className="inline-flex items-center gap-1.5 rounded-full bg-[#34231b] px-3 py-2 text-[10px] font-bold text-white transition hover:bg-[#553526]"><Copy size={12} />{copiedCode === offer.code ? "Copied" : "Copy code"}</button></div>
          <div className="relative mt-3 flex items-center justify-between gap-2 border-t border-[#f4ece7] pt-2.5 text-[10px] text-[#988a80]"><span>{offer.freeDelivery ? "Free delivery" : `${offer.discountType === "percentage" ? `${offer.discountValue}% off` : `₹${offer.discountValue} off`}${offer.maxDiscount ? ` up to ₹${offer.maxDiscount}` : ""}`}{offer.minOrderAmount > 0 ? ` · min ₹${offer.minOrderAmount}` : ""}</span><span>Ends {new Date(offer.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></div>
        </article>)}
      </div>
    </section>
  );
};

export default CouponOffers;
