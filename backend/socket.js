import User from "./models/user.model.js";

export const socketHandler = (io) => {
  io.on("connection", (socket) => {
    socket.on("identity", async ({ userId }) => {
      try {
        if (userId) {
          socket.join(userId.toString());
        }
        const user = await User.findByIdAndUpdate(
          userId,
          { socketId: socket.id, isOnline: true },
          { new: true },
        );
      } catch (error) {
        console.log(error);
      }
    });

    socket.on("updateLocation", async ({ lat, lon, userId }) => {
      try {
        io.emit("updateDeliveryLocation", {
          deliveryBoyId: userId,
          lat: Number(lat),
          lon: Number(lon),
        });

        if (userId && lat != null && lon != null) {
          await User.findByIdAndUpdate(userId, {
            location: {
              type: "Point",
              coordinates: [Number(lon), Number(lat)],
            },
            isOnline: true,
            socketId: socket.id,
          });
        }
      } catch (error) {
        console.log("Error updating location:", error);
      }
    });

    socket.on("disconnect", async () => {
      try {
        await User.findOneAndUpdate(
          { socketId: socket.id },
          { socketId: null, isOnline: false },
        );
      } catch (error) {
        console.log(error);
      }
    });
  });
};
