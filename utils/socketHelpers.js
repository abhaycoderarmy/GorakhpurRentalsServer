// utils/socketHelpers.js
export const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

export const emitToAdmins = (io, event, data) => {
  io.to('admin_room').emit(event, data);
};

export const emitToContactRoom = (io, contactId, event, data) => {
  io.to(`contact_${contactId}`).emit(event, data);
};

export const getUsersInRoom = (io, roomName) => {
  const room = io.sockets.adapter.rooms.get(roomName);
  return room ? Array.from(room) : [];
};