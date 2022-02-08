# tmber

https://fr.wikipedia.org/wiki/Yaniv_(jeu_de_cartes)

## DONE

### RELEASE x.x.x

- [x] skeleton
- [x] _webpack_
- [x] _express_
- [x] _live reload_
- [x] _winston_
- [x] _phaser3_
- [x] scene "boot"
- [x] scene "preload"
- [x] scene "title"
- [x] connect a player from client to server with socket.io
- [x] identify a player
- [x] disconnect a player
- [x] name a player
- [x] stage "waiting"
- [x] a player host a game
- [x] list joinable games
- [x] add a player in a game
- [x] remove a player in waiting
- [x] remove a host in waiting
- [x] add link to game
- [x] add hostname in waiting game
- [x] join a waiting game given a link with id
- [x] leaving a game join by url didn"t rejoin th game
- [x] if join an nonexisting game, go to title with error message
- [x] disconnect will remove player from game
- [x] add a bot in a waiting game
- [x] remove a bot in a waiting game
- [x] if too many player/bot a game, refresh game list without it
- [x] scene "game"
- [x] start game
- [x] disconnect a known player inside a running game by replacing by a bot
- [x] reconnect a known player to a running game
- [x] end game when last player disconnect
- [x] don't allow a unknown player to join a running game
- [x] git tag => template for multiplayer
- [x] define starting player
- [x] define current player
- [x] adding cards atlas
- [x] initialize deck
- [x] randomize deck
- [x] initiate score

## IN PROGRESS


## BLOCKED

- [ ] TU for service on server side => TODO : need to improve test with socket. maybe spy could work

## TODO

- [ ] dealing cards (5 cards per player)

- [ ] pick a card from the draw pile
- [ ] pick a card from the discard pile
- [ ] validate picked card
  
- [ ] discard 1 or more cards
- [ ] validate discarded cards

- [ ] next player

- [ ] "timber"
- [ ] validate timber (score < 7)

- [ ] compute current score
- [ ] display current score

- [ ] compute global score

- [ ] next play
- [ ] define next starting player
- [ ] end game (score > 100)
- [ ] "score" scene
- [ ] "achievement" scene
- [ ] 

- [ ] (optional) adding intermediary scene to change name between "title" and "waiting" scene