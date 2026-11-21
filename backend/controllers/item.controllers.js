import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import Item from "../models/item.model.js";

export const addItem = async (req, res) => {
  try {
    const { name, category, foodType, price } = req.body;
    let image;
    if (req.file) {
      try {
        image = await uploadOnCloudinary(req.file.path);
      } catch (uploadErr) {
        console.error("Item image upload error:", uploadErr);
      }
    }
    const shop = await Shop.findOne({ owner: req.userId });
    if (!shop) {
      return res.status(400).json({ message: "Shop Not Found" });
    }
    const defaultItemImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80";
    const item = await Item.create({
      name,
      category,
      foodType,
      price,
      image: image || defaultItemImage,
      shop: shop._id,
    });

    shop.items.push(item._id);
    await shop.save();
    await shop.populate([
      { path: "owner" },
      { path: "items", options: { sort: { updatedAt: -1 } } },
    ]);
    return res.status(200).json(shop);
  } catch (error) {
    console.error("Add Item Error:", error);
    return res.status(500).json({ message: `Add Item Error: ${error.message || error}` });
  }
};

export const editItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { name, category, foodType, price } = req.body;
    let image;
    if (req.file) {
      try {
        image = await uploadOnCloudinary(req.file.path);
      } catch (uploadErr) {
        console.error("Edit item image upload error:", uploadErr);
      }
    }
    const updateData = {
      name,
      category,
      foodType,
      price,
    };
    if (image) {
      updateData.image = image;
    }
    const item = await Item.findByIdAndUpdate(itemId, updateData, { new: true });
    if (!item) {
      return res.status(404).json({ message: "Item Not Found" });
    }
    const shop = await Shop.findOne({ owner: req.userId }).populate({
      path: "items",
      options: { sort: { updatedAt: -1 } },
    });
    return res.status(200).json(shop);
  } catch (error) {
    console.error("Edit Item Error:", error);
    return res.status(500).json({ message: `Edit Item Error: ${error.message || error}` });
  }
};

export const getItemById = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const item = await Item.findById(itemId).populate("shop");
    if (!item) {
      return res.status(500).json({ message: "Item Not Found" });
    }
    return res.status(200).json(item);
  } catch (error) {
    return res.status(500).json({ message: `Get Item By Id Error ${error}` });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const item = await Item.findByIdAndDelete(itemId);
    if (!item) {
      return res.status(500).json({ message: "Item Not Found" });
    }
    const shop = await Shop.findOne({ owner: req.userId });
    shop.items = shop.items.filter((id) => id.toString() !== itemId);
    await shop.save();
    await shop.populate({
      path: "items",
      options: { sort: { updatedAt: -1 } },
    });
    return res.status(200).json({ message: "Item Deleted Successfully" });
  } catch (error) {
    return res.status(500).json({ message: `Delete Item Error ${error}` });
  }
};

export const getItemByCity = async (req, res) => {
  try {
    const { city } = req.params;
    if (!city) {
      return res.status(400).json({ message: "City Not Provided" });
    }
    const shops = await Shop.find({
      city: { $regex: new RegExp(`^${city}`, "i") },
    }).populate("items");
    if (!shops) {
      return res.status(400).json({ message: "No shops found in this city" });
    }
    const shopIds = shops.map((shop) => shop._id);

    const items = await Item.find({ shop: { $in: shopIds } });
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: `Get Item by City Error ${error}` });
  }
};

export const getItemByShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findById(shopId).populate("items");
    if (!shop) {
      return res.status(400).json({ message: "Shop Not Found" });
    }
    return res.status(200).json({ shop, items: shop.items });
  } catch (error) {
    return res.status(500).json({ message: `Get Item by Shop Error ${error}` });
  }
};

export const searchItems = async (req, res) => {
  try {
    const { query, city } = req.query;
    if (!query || !city) {
      return res.status(400).json({ message: "Query or City Not Provided" });
    }
    const shops = await Shop.find({
      city: { $regex: new RegExp(`^${city}`, "i") },
    }).populate("items");
    if (!shops) {
      return res.status(400).json({ message: "No shops found in this city" });
    }
    const shopIds = shops.map(s=>s._id);
    const items = await Item.find({
      shop: { $in: shopIds },
      $or: [
        { name: { $regex: new RegExp(query, "i") } },
        { category: { $regex: new RegExp(query, "i") } },

      ]
    
    }).populate("shop","name image");
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: `Search Items Error ${error}` });
  }
};


export const rating = async(req,res)=>{
    try{
        const {itemId,rating} = req.body;
        if(!itemId || !rating){
            return res.status(400).json({message:"itemId and rating are required"});
        }
        if(rating<1 || rating>5){
            return res.status(400).json({message:"Rating must be between 1 and 5"});
        }
        const item = await Item.findById(itemId);
        if(!item){
            return res.status(404).json({message:"Item not found"});
        }

        const newCount = item.rating.count + 1;
        const newAverage = (item.rating.average * item.rating.count + rating) / newCount;

        item.rating = {
            count: newCount,
            average: newAverage
        };

        await item.save();

        return res.status(200).json({ message: "Item rated successfully", item });
    }catch(err){
        res.status(500).json({message:"Error rating item"});
    }
}