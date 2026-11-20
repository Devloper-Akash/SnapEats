import React, { useState } from "react";
import { Check, Drumstick, Leaf, Minus, Plus, ShoppingCart, Star, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/userSlice";

function FoodCard({ data, shopName: providedShopName }) {
  const [quantity, setQuantity] = useState(0);
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.user.cartItems);
  const rating = Number(data.rating?.average || 0);
  const ratingCount = Number(data.rating?.count || 0);
  const price = Number(data.price || 0);
  const isVeg = data.foodType === "Veg";
  const alreadyInCart = cartItems.some((item) => String(item.id) === String(data._id));
  const shopId = typeof data.shop === "object" ? data.shop?._id : data.shop;
  const shopName = providedShopName || (typeof data.shop === "object" ? data.shop?.name : null);

  const addItem = () => {
    const quantityToAdd = quantity || 1;
    dispatch(addToCart({
      id: data._id,
      name: data.name,
      price,
      image: data.image,
      shop: shopId,
      quantity: quantityToAdd,
      foodType: data.foodType,
    }));
    setQuantity(0);
  };

  return (
    <article className="group flex min-w-0 w-full max-w-[360px] flex-col overflow-hidden rounded-[26px] border border-[#f0e2d9] bg-white shadow-[0_8px_24px_-20px_rgba(75,39,23,0.45)] transition duration-300 hover:-translate-y-1 hover:border-[#f3c9b7] hover:shadow-[0_22px_38px_-24px_rgba(75,39,23,0.38)]">
      <div className="relative aspect-[1.55] overflow-hidden bg-[#fff5ee]">
        {data.image ? (
          <img
            src={data.image}
            alt={data.name}
            loading="lazy"
            className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#fff1e5] to-[#f7ded0] text-[#d98662]">
            <ShoppingCart size={34} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#25160f]/25 to-transparent" />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-2.5 py-1 text-[11px] font-bold shadow-sm ${isVeg ? "text-[#2d7a46]" : "text-[#c43c32]"}`}>
          <span className={`flex size-4 items-center justify-center rounded-full border ${isVeg ? "border-[#2d7a46]" : "border-[#c43c32]"}`}>
            {isVeg ? <Leaf size={10} /> : <Drumstick size={10} />}
          </span>
          {isVeg ? "Veg" : "Non-veg"}
        </span>
        {data.category && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#655950] shadow-sm">
            {data.category}
          </span>
        )}
        {alreadyInCart && (
          <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white text-[#32804c] shadow-md" aria-label="Already in cart">
            <Check size={17} strokeWidth={2.5} />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="truncate text-[17px] font-bold tracking-tight text-[#302923] sm:text-lg" title={data.name}>{data.name}</h3>
        {shopName && (
          <Link
            to={shopId ? `/shop/${shopId}` : "#"}
            onClick={(event) => !shopId && event.preventDefault()}
            className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate text-xs font-semibold text-[#b45a38] transition hover:text-[#e64b2e]"
          >
            <Store size={13} className="shrink-0" />
            <span className="truncate">{shopName}</span>
          </Link>
        )}
        <div className="mt-2 flex min-h-5 items-center gap-1.5 text-xs">
          {ratingCount > 0 ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-md bg-[#edf7ef] px-1.5 py-0.5 font-bold text-[#287343]">
                <Star size={12} fill="currentColor" /> {rating.toFixed(1)}
              </span>
              <span className="text-[#958a82]">({ratingCount} reviews)</span>
            </>
          ) : (
            <span className="font-medium text-[#958a82]">A neighborhood favorite</span>
          )}
        </div>

        <div className="mt-3 border-t border-[#f2e8e1] pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-extrabold tracking-tight text-[#e64b2e] sm:text-xl">₹{price.toFixed(2)}</span>
            {alreadyInCart && <span className="text-[10px] font-semibold text-[#32804c]">In your cart</span>}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex h-9 items-center rounded-full border border-[#eadfd7] bg-[#fffaf6] p-1">
              <button
                type="button"
                aria-label={`Remove one ${data.name}`}
                disabled={quantity === 0}
                className="flex size-6 items-center justify-center rounded-full text-[#635951] transition hover:bg-white hover:text-[#d83e22] disabled:cursor-not-allowed disabled:opacity-35"
                onClick={() => setQuantity((value) => Math.max(0, value - 1))}
              >
                <Minus size={14} />
              </button>
              <span className="min-w-5 text-center text-sm font-bold text-[#302923]" aria-live="polite">{quantity}</span>
              <button
                type="button"
                aria-label={`Add one ${data.name}`}
                className="flex size-6 items-center justify-center rounded-full text-[#635951] transition hover:bg-white hover:text-[#d83e22]"
                onClick={() => setQuantity((value) => value + 1)}
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              type="button"
              aria-label={`Add ${quantity || 1} ${data.name} to cart`}
              onClick={addItem}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#ff4d2d] px-3 text-xs font-bold text-white shadow-[0_5px_14px_-8px_rgba(255,77,45,0.8)] transition hover:-translate-y-0.5 hover:bg-[#e94325] active:translate-y-0"
            >
              <ShoppingCart size={15} /> <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default FoodCard;
