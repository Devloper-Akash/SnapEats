import React from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { removeCartItem, updateQuantity } from "../redux/userSlice";

function CartItemCard({ data }) {
  const dispatch = useDispatch();
  const price = Number(data.price || 0);
  const lineTotal = price * Number(data.quantity || 0);

  const changeQuantity = (quantity) => {
    if (quantity > 0) dispatch(updateQuantity({ id: data.id, quantity }));
  };

  return (
    <article className="group flex flex-col gap-4 rounded-[24px] border border-[#f0e2d9] bg-white p-3.5 shadow-[0_8px_24px_-20px_rgba(75,39,23,0.45)] transition hover:border-[#f1c7b5] hover:shadow-[0_18px_34px_-26px_rgba(75,39,23,0.35)] sm:flex-row sm:items-center sm:gap-5 sm:p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-4">
        <div className="size-[82px] shrink-0 overflow-hidden rounded-2xl bg-[#fff2e9] sm:size-24">
          {data.image ? (
            <img src={data.image} alt={data.name} className="size-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex size-full items-center justify-center text-[#dd8a65]"><ShoppingBag size={25} /></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#bd6a49]">Your pick</div>
          <h2 className="truncate text-base font-extrabold text-[#302923] sm:text-lg" title={data.name}>{data.name}</h2>
          <p className="mt-1 text-sm text-[#81766e]">₹{price.toFixed(2)} <span className="px-1 text-[#c7b7ad]">·</span> each</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#f3e9e3] pt-3 sm:w-[220px] sm:shrink-0 sm:justify-end sm:border-0 sm:pt-0">
        <div className="inline-flex h-10 items-center rounded-full border border-[#eadfd7] bg-[#fffaf6] p-1">
          <button
            type="button"
            aria-label={`Remove one ${data.name}`}
            disabled={data.quantity <= 1}
            onClick={() => changeQuantity(data.quantity - 1)}
            className="flex size-7 items-center justify-center rounded-full text-[#635951] transition hover:bg-white hover:text-[#d83e22] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-7 text-center text-sm font-bold text-[#302923]" aria-live="polite">{data.quantity}</span>
          <button
            type="button"
            aria-label={`Add one ${data.name}`}
            onClick={() => changeQuantity(data.quantity + 1)}
            className="flex size-7 items-center justify-center rounded-full text-[#635951] transition hover:bg-white hover:text-[#d83e22]"
          >
            <Plus size={14} />
          </button>
        </div>
        <strong className="min-w-[82px] text-right text-base font-extrabold text-[#df4a2d]">₹{lineTotal.toFixed(2)}</strong>
        <button
          type="button"
          aria-label={`Remove ${data.name} from cart`}
          onClick={() => dispatch(removeCartItem(data.id))}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#f3dfd6] bg-white text-[#bc7760] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}

export default CartItemCard;
