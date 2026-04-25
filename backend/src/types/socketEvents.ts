export class SocketEvents {
  static readonly JOIN_POST = "joinPost"
  static readonly LEAVE_POST = "leavePost"
  static readonly NEW_COMMENT = "newComment"
  static readonly UPDATED_COMMENT = "updatedComment"
  static readonly DELETED_COMMENT = "deletedComment"

  static readonly OPEN_COMMUNITY = "openCommunity"
  static readonly CLOSE_COMMUNITY = "closeCommunity"
  static readonly NEW_MESSAGE = "newMessage"
  static readonly UPDATED_MESSAGE = "updatedMessage"
  static readonly DELETED_MESSAGE = "deletedMessage"

  // Active users and typing indicators
  static readonly USER_JOINED = "userJoined"
  static readonly USER_LEFT = "userLeft"
  static readonly GET_ACTIVE_USERS = "getActiveUsers"
  static readonly ACTIVE_USERS = "activeUsers"
  static readonly USER_TYPING = "userTyping"
}
