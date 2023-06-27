Table Users {
  id                int [primary key]
  name              string
  email             string
  image             string
  twoFactorEnabled  bool
  onlineStatus      string
  ELOscore          int
}
//--------------------------------------
Table Tfa {
  userId            int [primary key]
  twoFactorCode     string
  isValidated       boolean
}
//--------------------------------------
Table GameRecords {
  userId  int 
  gameId  int   
}

Table Games {
  id                int [primary key]
  player1Id         int
  player2Id         int
  gameStatus        string
  gameType          string
  gameResult        string
  startTime         timestamp
}
//--------------------------------------
Table Follows {
  userId            int
  following         int
  indexes {
    (userId, following) [pk]
  }
}

Table Blocks {
  userId            int
  blocking          int
  indexes {
    (userId, blocking) [pk]
  }
}
//--------------------------------------
enum channelType {
  direct
  private
  protected
  public
}

Table Channels {
  id                int [primary key]
  ownerId           int
  name              string
  password          string
  type              channelType
}

Table Messages {
  userId            int  // == sender
  channelId         int
  content           string
}

Table ChannelMembers {
  channelId         int
  userId            int
  isAdmin           bool
}

Table ChannelMutedMembers {
  channelId         int
  userId            int
  isMuted           bool  // 제한된 시간동안 채팅이 불가능한 거
}

Table ChannelBlockedMembers {
  channelId         int
  userId            int
  isBlocked         bool  // 쫓겨나고 다시 들어오지도 못하는 거
}
//--------------------------------------

Ref: Tfa.userId                       - Users.id

Ref: Follows.userId                   > Users.id
Ref: Follows.following                > Users.id
Ref: Blocks.userId                    > Users.id
Ref: Blocks.blocking                  > Users.id

Ref: Channels.ownerId                 > Users.id
Ref: ChannelMembers.userId            > Users.id
Ref: ChannelMutedMembers.userId       > Users.id
Ref: ChannelBlockedMembers.userId     > Users.id
Ref: ChannelMembers.channelId         > Channels.id
Ref: ChannelMutedMembers.channelId    > Channels.id
Ref: ChannelBlockedMembers.channelId  > Channels.id

Ref: Messages.userId                  > Users.id
Ref: Messages.channelId               > Channels.id

Ref: GameRecords.userId               > Users.id
Ref: GameRecords.gameId               > Games.id


