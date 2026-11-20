import { createSlice } from "@reduxjs/toolkit";

const mapSlice = createSlice({
    name:"user",
    initialState:{
       location:{
        lat:null,
        lon:null
       },
       address:null,
       manualSelection:false,

    },
    reducers:{
       setLocation:(state,action)=>{
        const {lat,lon} = action.payload;
        state.location.lat = lat;
        state.location.lon = lon;
       },
        setAddress:(state,action)=>{
            state.address = action.payload;
        },
        setManualSelection:(state,action)=>{
            state.manualSelection = action.payload;
        }

    }
})

export const { setLocation, setAddress, setManualSelection } = mapSlice.actions;
export default mapSlice.reducer;
