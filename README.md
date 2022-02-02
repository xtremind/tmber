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

## IN PROGRESS

## BLOCKED

## TODO

- [ ] adding intermediary scene to change name between "title" and "waiting" scene
- [ ] add a bot in a game
- [ ] scene "game"
- [ ] bot
- [ ] disconnect a known player inside a running game by replacing by a bot
- [ ] reconnect a known player to a running game
- [ ] don't allow a unknown player to join a running game

- [ ] define starting player
- [ ] define current player
- [ ] initialize deck
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

