Table Users {
  ftId              int [primary key]
  name              string
  email             string
  image             string
  twoFactorEnabled  bool
  onlineStatus      string
  mmr               int
  // Wins              int
  // Losses            int
  // LadderLevel       int
  // Achievements      string
}

Table Tfa {
  ftId              int [primary key]
  twoFactorCode     string
  isValidated       boolean
}

Table Follow {
  id                int [primary key]
  ftId              int
  follower          int
  following         int
}

Table BlockedUsers {
  id                int [primary key]
  ftId              int
  blockedUserId     int
}

Table MatchHistory {
  id                int [primary key]
  ftId              int
  opponentId        int
  result            string
  matchType         string
  matchTime         timestamp
}

Table Channels {
  id                int [primary key]
  ftId              int
  ownerId           int
  name              string
  password          string
  isPublic          bool
}

Table ChannelMembers {
  id                int [primary key]
  ftId              int
  userId            int
  channelId         int
  IsAdmin           bool
}

Table Messages {
  ftId              int
  senderId          int
  recipientId       int
  channelId         int
  content           string
  sentTime          timestamp
}

Table Games {
  id                int [primary key]
  player1Id         int
  player2Id         int
  gameType          string
  gameResult        string
  startTime         timestamp
}

Ref: Tfa.ftId                   - Users.ftId
Ref: Follow.follower            - Users.ftId
Ref: Follow.following           - Users.ftId
Ref: MatchHistory.ftId          - Users.ftId
Ref: MatchHistory.opponentId    - Users.ftId
Ref: Channels.ownerId           - Users.ftId
Ref: ChannelMembers.userId      - Users.ftId
Ref: ChannelMembers.channelId   - Channels.ftId
Ref: BlockedUsers.ftId          - Users.ftId
Ref: BlockedUsers.blockedUserId - Users.ftId
Ref: Games.player1Id            - Users.ftId
Ref: Games.player2Id            - Users.ftId
