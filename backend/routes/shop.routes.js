import express from "express";
import { createAndEditShop, getFeaturedShops, getMyShop, getShopByCity } from "../controllers/shop.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import {upload} from "../middlewares/multer.js";


const shopRouter = express.Router();

shopRouter.post("/create-edit",isAuth,upload.single("image"),createAndEditShop);
shopRouter.get("/get-my",isAuth,getMyShop);
shopRouter.get("/featured",getFeaturedShops);
shopRouter.get("/get-by-city/:city",getShopByCity);


export default shopRouter 
