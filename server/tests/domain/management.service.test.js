const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");

const ManagementService = require("../../src/domain/ManagementService");

describe("tmber", () => {
  let sut, io, serverSocket, clientSocket;
  const consoleSpy = jest.spyOn(console, 'debug').mockImplementation()

  beforeAll((done) => {
    //
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      io.on("connection", (socket) => {
        if(typeof serverSocket === 'undefined'){
          serverSocket = socket;
        } else {
          playerSSocket = socket;
        }
      });
      clientSocket = new Client(`http://localhost:${port}`);
      //playerCSocket = new Client(`http://localhost:${port}`);
      clientSocket.on("connect", done);
      //playerCSocket.on("connect", done);
    });
  });
  
  beforeEach(() => {
    //initiate context
    consoleSpy.mockClear()
    sut = new ManagementService(console);
  })

  test("should connect a new player given a non connected player", (done) => {
    //WHEN
    sut.connect(serverSocket);
    //THEN
    expect(console.debug).toBeCalledTimes(1)
    expect(console.debug).toHaveBeenLastCalledWith('['+serverSocket.id+'] connected')
    done();
  });
  
  test("should identify a new player given a player already connected", (done) => {
    //GIVEN
    let data = {'uuid': 'uuid', 'name': 'name'};
    //WHEN
    sut.connect(serverSocket);
    sut.identify(serverSocket.id, data);
    //THEN
    expect(console.debug).toBeCalledTimes(3)
    expect(console.debug).toHaveBeenCalledWith('['+serverSocket.id+'] identified', data)
    expect(console.debug).toHaveBeenLastCalledWith('['+serverSocket.id+'] no known game for this player', data)
    
    done();
  });


  test("should host a game given a player already connected", (done) => {
    //GIVEN
    let identity = {'uuid': 'uuid', 'name': 'name'};
    let game = {'id': 'uuid', 'name': 'name'};

    clientSocket.on("joined", (data) => {
      console.log(data);
      expect(data).toEqual({'id': 'uuid', 'hostname': 'name'});
      done();
    });

    //WHEN
    sut.connect(serverSocket);
    sut.identify(serverSocket.id, identity);
    sut.host(serverSocket.id, game);
    //THEN
    expect(console.debug).toBeCalledTimes(4)
    expect(console.debug).toHaveBeenLastCalledWith('['+serverSocket.id+'] host a game', game)
    
  });
  
  test("should leave a game given a host player", (done) => {
    //GIVEN
    let identity = {'uuid': 'uuid', 'name': 'name'};
    let game = {'id': 'uuid', 'name': 'name'};

    //WHEN
    sut.connect(serverSocket);
    sut.identify(serverSocket.id, identity);
    sut.host(serverSocket.id, game);
    sut.leave(serverSocket.id, game);

    //THEN
    expect(console.debug).toBeCalledTimes(8)
    expect(console.debug).toHaveBeenCalledWith('['+serverSocket.id+'] leaving a game', game)
    expect(console.debug).toHaveBeenCalledWith('['+serverSocket.id+'] leave game')
    expect(console.debug).toHaveBeenCalledWith('['+serverSocket.id+'] leave game as host')
    expect(console.debug).toHaveBeenLastCalledWith('['+serverSocket.id+'] left from game')
    
    done();
  });

  test("should add bot given a player already connected", (done) => {
    //GIVEN
    let identity = {'uuid': 'uuid', 'name': 'name'};
    let game = {'id': 'uuid', 'name': 'name'};

    clientSocket.on("players", data => {
      expect(data.length).toBe(2);
      expect(data[0]).toEqual({'id': 'uuid', 'name': 'name', 'isPlayer': true});
      let uuid = data[1].id;
      expect(data[1].name).toBe('bot_'+uuid.substring(uuid.length-6, uuid.length))
      expect(data[1].isPlayer).toBe(false)
      done();
    });

    //WHEN
    sut.connect(serverSocket);
    sut.identify(serverSocket.id, identity);
    sut.host(serverSocket.id, game);
    
    sut.addBot(serverSocket.id, game)
    //THEN
    expect(console.debug).toBeCalledTimes(5)
    expect(console.debug).toHaveBeenLastCalledWith('['+serverSocket.id+'] add a bot', game)
    
  });

  afterEach(() => {

  })
  
  afterAll(() => {
    io.close();
    clientSocket.close();
    //playerCSocket.close();
  });
});