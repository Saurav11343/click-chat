let io;

export const setSocketServer = (socketServer) => {
  io = socketServer;
};

export const getSocketServer = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};
