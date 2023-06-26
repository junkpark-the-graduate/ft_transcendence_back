Table Users {
  ftId              int [primary key]
  name              string
  email             string
  image             string
  twoFactorEnabled  bool
  OnlineStatus      string
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
  BlockedUserID     int
}

Table MatchHistory {
  id                int [primary key]
  ftId              int
  OpponentID        int
  Result            string
  MatchType         string
  MatchTime         timestamp
}

Table Channels {
  id                int [primary key]
  ftId              int
  OwnerID           int
  Name              string
  Password          string
  IsPublic          bool
}

Table ChannelMembers {
  id                int [primary key]
  ftId              int
  UserID            int
  ChannelID         int
  IsAdmin           bool
}

Table Messages {
  ftId              int
  SenderID          int
  RecipientID       int
  ChannelID         int
  Content           string
  SentTime          timestamp
}

Table Games {
  id                int [primary key]
  ftId              int
  Player1ID         int
  Player2ID         int
  GameStatus        string
  GameType          string
  GameResult        string
  StartTime         timestamp
}

Ref: Tfa.ftId              - Users.ftId
Ref: Follow.follower       - Users.ftId
Ref: Follow.following      - Users.ftId
Ref: MatchHistory.ftId     - Users.ftId
Ref: MatchHistory.OpponentID - Users.ftId
Ref: Channels.OwnerID      - Users.ftId
Ref: ChannelMembers.UserID - Users.ftId
Ref: ChannelMembers.ChannelID - Channels.ftId
// Ref: Messages.SenderID     - Users.ftId
// Ref: Messages.RecipientID  - Users.ftId
// Ref: Messages.ChannelID    - Channels.ftId
Ref: BlockedUsers.ftId     - Users.ftId
Ref: BlockedUsers.BlockedUserID - Users.ftId
Ref: Games.Player1ID       - Users.ftId
Ref: Games.Player2ID       - Users.ftId
