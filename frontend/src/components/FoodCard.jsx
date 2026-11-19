import React from 'react';
import { FaLeaf } from "react-icons/fa";
import { FaDrumstickBite } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { FaMinus } from "react-icons/fa";
import { useState } from 'react';
import { FaPlus } from "react-icons/fa6";
import { useDispatch } from 'react-redux';
import { FaShoppingCart } from "react-icons/fa";
import { addToCart } from '../redux/userSlice';
import { useSelector } from 'react-redux';


function FoodCard({data}){
    const [quantity,setQuantity] = useState(0);
    const dispatch = useDispatch();
    const {cartItems} = useSelector(state=>state.user);
    const renderStars =(rating)=>{
        const stars = [];
        for(let i=1;i<=5;i++){
            if(i<=Math.floor(rating)){
                stars.push(<span key={i} className='text-yellow-400 text-lg'>&#9733;</span>);
            }
            else if(i===Math.ceil(rating) && !Number.isInteger(rating)){
                stars.push(<span key={i} className='text-yellow-400 text-lg'>&#9734;</span>);
            }
            else{
                stars.push(<span key={i} className='text-gray-300 text-lg'>&#9734;</span>);
            }
        }
        return stars;
    }

    const handleIncrease=()=>{
        const newQuantity = quantity + 1;
        setQuantity(newQuantity);
    }

    const handleDecrease=()=>{
        const newQuantity = quantity - 1;
        if(newQuantity >= 0){
            setQuantity(newQuantity);
        }
    }

    return (
        <div className='w-[250px] rounded-2xl border-2 border-[#ff4d2d] bg-white shadow-md overflow-hidden transition-all duration-300 flex flex-col gap-2 hover:scale-103 hover:shadow-lg'>
            <div className='w-full h-[170px] bg-white relative flex justify-center items-center p-2'>
                <div className='absolute top-3 right-3 bg-white rounded-full p-1 shadow'>{data.foodType == "Veg"?<FaLeaf className='text-green-700 text-lg'/>:<FaDrumstickBite className='text-red-700 text-lg'/>}</div> 
                <img src={data.image} alt={data.name} className='w-full h-full object-contain transition-transform duration-300 hover:scale-100'/>
            </div>
            <div className='w-full flex flex-col gap-1 p-3'>
                <h3 className='text-lg font-semibold text-gray-900 truncate'>{data.name}</h3>
                {/* <p className='text-gray-600'>{data.description}</p> */}
                <div className='flex items-center gap-1'>
                    {renderStars(data.rating.average)}
                    <span className='text-sm text-gray-600'>({data.rating.count})</span>
                </div>
                <div className='flex justify-between items-center mt-1'>
                    <span className='text-xl font-bold text-[#ff4d2d]'>₹{data.price.toFixed(2)}</span>
                    <div className='flex items-center border rounded-full overflow-hidden shadow-sm'>
                        <button className='px-2 py-1 hover:bg-gray-100 transition cursor-pointer' onClick={handleDecrease}>
                            <FaMinus size={12}/>
                        </button>
                        <span>{quantity}</span>
                        <button className='px-2 py-1 hover:bg-gray-100 transition cursor-pointer'  onClick={handleIncrease}><FaPlus size={12}/></button>
                        <button className={`${cartItems.some(i=>i.id==data._id)?'bg-gray-800':'bg-[#ff4d2d]'} text-white px-3 py-2 transition-colors`} onClick={() => {
                            quantity > 0 ?
                            dispatch(addToCart({
                            id: data._id,
                            name: data.name,
                            price: data.price,
                            image: data.image,
                            shop: data.shop,
                            quantity: quantity,
                            foodType: data.foodType
                        })):null}}>
                            <FaShoppingCart size={16}/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FoodCard;