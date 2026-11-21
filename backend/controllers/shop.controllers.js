import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const createAndEditShop = async (req, res) => {
  try {
    const { name, city, state, address } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Restaurant name is required" });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ message: "City is required" });
    }
    if (!state || !state.trim()) {
      return res.status(400).json({ message: "State is required" });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ message: "Address is required" });
    }

    let image = null;
    if (req.file) {
      try {
        image = await uploadOnCloudinary(req.file.path);
      } catch (uploadErr) {
        console.error("Cloudinary upload failed:", uploadErr);
      }
    }

    let shop = await Shop.findOne({ owner: req.userId });
    if (!shop) {
      const defaultImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80";
      shop = await Shop.create({
        name: name.trim(),
        city: city.trim(),
        state: state.trim(),
        address: address.trim(),
        image: image || defaultImage,
        owner: req.userId,
      });
    } else {
      const updateData = {
        name: name.trim(),
        city: city.trim(),
        state: state.trim(),
        address: address.trim(),
        owner: req.userId,
      };
      if (image) {
        updateData.image = image;
      }
      shop = await Shop.findByIdAndUpdate(shop._id, updateData, { new: true });
    }

    await shop.populate("owner items");
    return res.status(201).json(shop);
  } catch (error) {
    console.error("Create Shop Error:", error);
    return res.status(500).json({ message: `Create Shop Error: ${error.message || error}` });
  }
};

export const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.userId }).populate(
      "owner"
    ).populate({
      path:"items",
      options:{sort:{"updatedAt":-1}}
    });
    if (!shop) {
      return res.status(200).json(null);
    }
    return res.status(200).json(shop);
  } catch (error) {
    return res.status(500).json({ message: `Get My Shop Error ${error}` });
  }
};

export const getShopByCity = async(req,res)=>{
  try{
    const {city} = req.params;
    const shops = await Shop.find({
      city:{$regex:new RegExp(`^${city}`,"i")}
    }).populate("items");
    if(!shops){
      return res.status(400).json({ message: "No shops found in this city" });
    }
    return res.status(200).json(shops);
  }catch(error){
    return res.status(500).json({ message: `Get Shop by City Error ${error}` });
  }
}

export const getFeaturedShops = async (_req, res) => {
  try {
    const shops = await Shop.find({
      approvalStatus: "approved",
      isSuspended: { $ne: true },
      items: { $exists: true, $ne: [] },
    })
      .select("name city image items")
      .sort({ updatedAt: -1 })
      .limit(8)
      .populate({
        path: "items",
        select: "name image category",
        options: { sort: { updatedAt: -1 } },
        perDocumentLimit: 1,
      });

    return res.status(200).json({ shops: shops.filter((shop) => shop.items.length) });
  } catch (error) {
    return res.status(500).json({ message: `Get Featured Shops Error ${error.message || error}` });
  }
};
