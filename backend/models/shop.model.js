import mongoose, { mongo } from 'mongoose';

const shopSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    image:{
        type:String,
        default:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    city:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    approvalStatus:{
        type:String,
        enum:["pending","approved","rejected"],
        default:"pending",
        index:true
    },
    commissionRate:{
        type:Number,
        min:0,
        max:100,
        default:10
    },
    isSuspended:{
        type:Boolean,
        default:false
    },
    rejectionReason:String,
    items:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Item"
    }]
},{timestamps:true});

const Shop = mongoose.model("Shop",shopSchema);
export default Shop;
