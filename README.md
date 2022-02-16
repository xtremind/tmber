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
- [x] dealing cards (5 cards per player)
- [x] show draw pile
- [x] show discard pile
- [x] pick a card from the draw pile
- [x] pick a card from the discard pile
- [x] validate picked card
- [x] discard 1 or more cards
- [x] validate discarded cards (all from hand and one of : single, double, triple, quadruple, series of 3, series of 4, series of 5)
- [x] next player
- [x] show others
- [x] updates others cards when action
- [x] send "timber"
- [x] add configuration file 
- [x] validate timber (score <= 7)
- [x] compute current score
- [x] next play
- [x] define next starting player
- [x] end game (score > 100)
- [x] display current player with feedback
- [x] compute global score
- [x] display global score
- [x] if no more card in draw => computer score
- [x] render draw depending on the number of cards in it.
- [x] show error message is present
- [x] end game scene
- [x] show rank in end game scene

## IN PROGRESS


## BLOCKED

- [ ] TU for service on server side => TODO : need to improve test with socket. maybe spy could work

## TODO

- [ ] display current score
- [ ] improve reconnect a player (actually : no players' name, and update only when turn change)
- [ ] extra rules : if global score is a multiple to 100 => -50
- [ ] improve error message => in box
- [ ] improve end game scene => a box for each part
- [ ] add button to main menu from end game scene

- [ ] (optional) "reward" scene once game has ended
- [ ] (optional) "achievement" once obtain
- [ ] (optional) improve how others cards are shown
- [ ] (optional) adding intermediary scene to change name between "title" and "waiting" scene
- [ ] (optional) improve security (answering player == current player)
- [ ] (optional) choose difficulty