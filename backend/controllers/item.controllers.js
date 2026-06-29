import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import Item from "../models/item.model.js";


export const addItem = async (req, res) => {
  try {
    const { name, category, foodType, price } = req.body;
    let image;
    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }
    const shop = await Shop.findOne({ owner: req.userId })
    if (!shop) {
      return res.status(400).json({ message: "Shop Not Found" });
    }
    const item = await Item.create({
      name,
      category,
      foodType,
      price,
      image,
      shop: shop._id,
    });

    shop.items.push(item._id);
    await shop.save();
    await shop.populate([
      { path: "owner" },
      { path: "items", options: { sort: { "updatedAt": -1 } } }
    ]);
    return res.status(200).json(shop);
  } catch (error) {
    return res.status(500).json({ message: `Add Item Error ${error}` });
  }
};

export const editItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { name, category, foodType, price } = req.body;
    let image;
    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }
    const item = await Item.findByIdAndUpdate(
      itemId,
      {
        name,
        category,
        foodType,
        price,
        image,
      },
      { new: true },
    );
    if (!item) {
      return res.status(500).json({ message: "Item Not Found" });
    }
    const shop = await Shop.findOne({ owner: req.userId }).populate({
      path:"items",
      options:{sort:{"updatedAt":-1}}
    });
    return res.status(200).json(shop);
  } catch (error) {
    return res.status(500).json({ message: `Edit Item Error ${error}` });
  }
};

export const getItemById = async(req,res)=>{
  try{
    const itemId = req.params.itemId;
    const item = await Item.findById(itemId).populate("shop");
    if(!item){
      return res.status(500).json({message:"Item Not Found"});
    }
    return res.status(200).json(item);
  }catch(error){
    return res.status(500).json({message:`Get Item By Id Error ${error}`});
  }
}

export const deleteItem = async(req,res)=>{
  try{
    const itemId = req.params.itemId;
    const item = await Item.findByIdAndDelete(itemId);
    if(!item){
      return res.status(500).json({message:"Item Not Found"});
    }
    const shop = await Shop.findOne({owner:req.userId});
    shop.items = shop.items.filter((id) => id.toString() !== itemId);
    await shop.save();
    await shop.populate({
      path:"items",
      options:{sort:{"updatedAt":-1}}
    });
    return res.status(200).json({message:"Item Deleted Successfully"});
  }catch(error){
    return res.status(500).json({message:`Delete Item Error ${error}`});
  }
}
