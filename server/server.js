// const functions = require('./js/functions.js')



class PokerCard {
  constructor(value, suit) {
    this.value = value;
    this.suit = suit;
    this.life = 0;
    this.attack = this.value;
    if (value == 11) {
      this.attack = 10;
      this.life = 20;
    } else if (value == 12) {
      this.attack = 15;
      this.life = 30;
    } else if (value == 13) {
      this.attack = 20;
      this.life = 40;
    }
  }
  json() {
    return JSON.stringify({ value: this.value, suit: this.suit });
  }
}



class CardPile {
  constructor(cardList) {
    this.cardList = cardList;
  }
  shuffle() {
    // Knuth洗牌算法
    for (let i = this.cardList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cardList[i], this.cardList[j]] = [this.cardList[j], this.cardList[i]];
    }
  }
  push(array) {
    array.forEach(card => {
      this.cardList.push(card);
    })
  }
  unshift(array) {
    array.forEach(card => {
      this.cardList.unshift(card);
    })
  }
  sort() {
    this.cardList.sort((a, b) => a.value - b.value);
  }
}

class Player {
  constructor(client, clientId, name) {
    this.client = client;
    this.clientId = clientId;
    this.name = name;
    this.dead = 0
  }
}


class Room {
  constructor(player) {
    // this.clients = [ws];
    this.players = [player]
    this.roomId = player.roomId;
    this.state = "waiting"
    this.skipTimes = 0;
  }
  runGame() {
    this.piles = {
      bossPile: new CardPile([]),
      handPiles: [],
      wastePile: new CardPile([]),
      drawPile: new CardPile([]),
      Boss: new CardPile([]),
    }
    this.alivePlayerNum = this.players.length
    this.state = "gaming";
    [this.originalCards, this.cardsLimit] = [[10, 20], [7, 8], [6, 7], [5, 6], [5, 5]][this.players.length];
    for (let i = 1; i <= 4; i++) {
      for (let j = 1; j <= 10; j++) {
        this.piles.drawPile.push([new PokerCard(j, i)]);
      }
    }
    this.piles.drawPile.shuffle();
    for (let i = 0; i < this.players.length; i++) {
      this.piles.handPiles[i] = new CardPile([]);
      this.piles.handPiles[i].push(this.piles.drawPile.cardList.splice(0, this.originalCards));
    }

    // boss牌堆洗牌
    for (let j = 13; j >= 11; j--) {
      let temPile = new CardPile([]);
      for (let i = 1; i <= 4; i++) {
        temPile.push([new PokerCard(j, i)]);
      }
      temPile.shuffle();
      this.piles.bossPile.push(temPile.cardList);
    }
    this.selectBoss();
    this.sendPilesStates();
    // 广播通知P1开始攻击
    this.nextAttacker(0);
  }
  selectBoss() {
    if (this.piles.bossPile.cardList.length != 0) {
      this.piles.Boss = new CardPile([])
      this.piles.Boss.push([this.piles.bossPile.cardList.pop()]);
    } else {
      //胜利
      this.broadcastMessage(JSON.stringify({ type: "win" }))
    }
  }
  broadcastMessage(message) {
    this.players.forEach(player => {
      player.client.send(message);
    });
  }
  sendPilesStates() {
    this.broadcastMessage(JSON.stringify({
      type: "updatePiles",
      piles: this.piles
    }))
  }
  sendPlayersState() {
    this.broadcastMessage(JSON.stringify({
      type: "updatePlayers",
      players: this.players.map(player => { return { name: player.name, clientId: player.clientId, playerId: player.playerId, dead: player.dead } })
    }));
  }
  setHost() {
    this.broadcastMessage(JSON.stringify({ type: "setHost" }));
    this.broadcastMessage(JSON.stringify({ type: "chatMessage", isSys: 1, message: "现在 " + this.players[0].name + " 是房主" }));
  }
  gameover(message) {
    this.state = "waiting";
    this.skipTimes = 0;
    this.players.forEach(player => {
      player.dead = 0;
    })
    this.broadcastMessage(JSON.stringify({
      type: "gameover",
      message: message
    }))
  }
  updatePlayerId() {//先广播每个player，让他们再回传"updatePlayerId"信息，更新server的每个玩家的playerId
    this.broadcastMessage(JSON.stringify({
      type: "updatePlayerId"
    }))
  }
  nextAttacker(playerId) {
    let it = ((playerId % this.players.length) + 1);
    while (1) {
      if (this.players[it - 1].dead == 0) {
        this.broadcastMessage(JSON.stringify({
          type: "action",
          action: "attack",
          playerId: it
        }))
        this.broadcastMessage(JSON.stringify({
          type: " ",
          message: "轮到 " + this.players[it - 1].name + " 攻击BOSS"
        }))
        break;
      }
      if (it == playerId) {
        //所有人都死亡，游戏结束
        this.gameover("所有人都死亡");
        this.setHost();
        break;
      }
      it = it % this.players.length + 1;
    }
  }
}

function showRooms(ws) {
  let roomsData = Object.keys(rooms).map(roomId => {
    return { roomId, playerNum: rooms[roomId].players.length, state: rooms[roomId].state }
  })
  ws.send(JSON.stringify({
    type: "roomsData",
    rooms: roomsData
  }))
}


const port = 8013;
const rooms = {};
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: port });
console.log('WebSocket 服务器已在端口' + port + '启动');
let interval = null;
wss.on('connection', ws => {
  const clientId = Math.random().toString(36).substring(7);///随机生成客户端ID
  ws.send(JSON.stringify({
    type: "connected",
    state: "succeed",
    clientId: clientId
  }))
  // 计入房间前定时更新房间信息
  interval = setInterval(() => {
    showRooms(ws);
  }, 300)
  console.log("客户端" + clientId + "接入")

  let roomId = null;
  let name = null;
  let playerId = null;


  // 将数组变为键值对
  function countElements(arr) {
    let counts = {};
    for (let i = 0; i < arr.length; i++) {
      let element = arr[i];
      if (counts[element]) {
        counts[element] += 1;
      } else {
        counts[element] = 1;
      }
    }
    return counts;
  }

  //效果结算阶段
  function effect(type, value) {
    // alert(type + " " + BossInfo.type);
    if (type == 1 && rooms[roomId].piles.Boss.cardList[0].suit != 1) {
      reduceAttack(value);
    } else if (type == 2 && rooms[roomId].piles.Boss.cardList[0].suit != 2) {
      waste2draw(value);
    } else if (type == 3 && rooms[roomId].piles.Boss.cardList[0].suit != 3) {
      doubleAttack(value);
    } else if (type == 4 && rooms[roomId].piles.Boss.cardList[0].suit != 4) {
      drawCard(value);
    }
  }

  //伤害结算阶段,返回值1表示boss已死，0表示boss未死
  function hurt(value) {
    rooms[roomId].piles.Boss.cardList[0].life -= value;
    if (rooms[roomId].piles.Boss.cardList[0].life <= 0) {
      if (rooms[roomId].piles.Boss.cardList[0].life == 0) {
        rooms[roomId].piles.drawPile.push([new PokerCard(rooms[roomId].piles.Boss.cardList[0].value, rooms[roomId].piles.Boss.cardList[0].suit)]);
      } else {
        rooms[roomId].piles.wastePile.push([new PokerCard(rooms[roomId].piles.Boss.cardList[0].value, rooms[roomId].piles.Boss.cardList[0].suit)]);
      }
      return 1;
    }

    return 0;
  }
  // 黑桃效果，增加防御,等价于减小攻击
  function reduceAttack(value) {
    rooms[roomId].piles.Boss.cardList[0].attack -= value;
  }

  // 方片效果，摸牌
  function drawCard(value) {
    let index = playerId - 1;
    let drawNum = 0;
    let count = 0;
    while (count < rooms[roomId].players.length) {//如果所有玩家都跳过了摸牌，摸牌结束
      if (drawNum < value && rooms[roomId].piles.drawPile.cardList.length > 0) {//如果摸牌次数还有剩余and摸牌堆还有牌
        if (rooms[roomId].players[index].dead == 0) {
          if (rooms[roomId].piles.handPiles[index].cardList.length < rooms[roomId].cardsLimit) {//如果手牌没满
            rooms[roomId].piles.handPiles[index].push([rooms[roomId].piles.drawPile.cardList.pop()]);
            drawNum++;
            count = 0;
          } else {
            count++;//跳过一个玩家，即表示一个玩家牌满了
          }
        } else {
          count++;//跳过一个死亡玩家
        }
      } else {
        break;
      }
      index = (index + 1) % rooms[roomId].players.length;
    }
  }

  function doubleAttack(value) {
    rooms[roomId].piles.Boss.cardList[0].life -= value;
  }

  //红桃效果，从废牌堆回牌到摸牌堆
  function waste2draw(value) {
    let returnNum = Math.min(value, rooms[roomId].piles.wastePile.cardList.length);
    rooms[roomId].piles.wastePile.shuffle();
    rooms[roomId].piles.drawPile.unshift(rooms[roomId].piles.wastePile.cardList.splice(0, returnNum));
  }

  // 出牌攻击指令
  function attack(attackPile, leftPile) {//card数组
    if (attackPile.length == 1) {
      rooms[roomId].piles.handPiles[playerId - 1].cardList = leftPile;//移出手牌
      effect(attackPile[0].suit, attackPile[0].attack);//效果结算
      hurt(attackPile[0].attack);//伤害结算
      rooms[roomId].piles.wastePile.push(attackPile);//攻击牌堆移入弃牌堆
      return 1;
    } else {
      let numClass = countElements(attackPile.map(card => card.value));
      let typeClass = countElements(attackPile.map(card => card.suit));
      let sumAttack = attackPile.reduce((acc, card) => acc + card.attack, 0);
      if (Object.keys(numClass).length == 1 || attackPile.length - numClass["1"] == 1) {
        rooms[roomId].piles.handPiles[playerId - 1].cardList = leftPile;//移出手牌
        Object.keys(typeClass).forEach(key => {
          effect(key, sumAttack);//效果结算
        })
        hurt(sumAttack);//伤害结算
        rooms[roomId].piles.wastePile.push(attackPile);//攻击牌堆移入弃牌堆
        return 1;
      }
    }
    return 0;
  }






  ws.on('message', message => {
    const data = JSON.parse(message);
    if (data.state == "outRoom") {
      if (data.type === 'joinRoom') {
        roomId = data.roomId;
        name = data.name;
        if (rooms[roomId]) {
          if (rooms[roomId].state == "waiting") {
            if (rooms[roomId].players.length <= 3) {
              rooms[roomId].broadcastMessage(JSON.stringify({ type: 'sysMessage', message: name + "加入了房间" }))//广播系统通知
              rooms[roomId].players.push(new Player(ws, clientId, name));
              playerId = rooms[roomId].players.length;
              // 广播更新玩家列表
              console.log(clientId + " join room " + roomId)
              rooms[roomId].sendPlayersState();
              clearInterval(interval);//加入房间停止更新房间信息
              ws.send(JSON.stringify({ type: "chatMessage", isSys: 1, message: "现在 " + rooms[roomId].players[0].name + " 是房主" }));
              ws.send(JSON.stringify({ type: 'joinRoom', state: "succeed", message: "房间加入成功" }));
            } else {
              roomId = null;
              name = null;
              ws.send(JSON.stringify({ type: 'joinRoom', state: "fail", message: "房间人数已满" }));
            }

          } else if (rooms[roomId].state == "gaming") {
            roomId = null;
            name = null;
            ws.send(JSON.stringify({ type: 'joinRoom', state: "fail", message: "房间已开始游戏" }));
          }

        } else {
          rooms[roomId] = new Room(new Player(ws, clientId, name));
          playerId = 1;
          rooms[roomId].sendPlayersState();
          rooms[roomId].setHost();
          console.log(clientId + " create room " + roomId)
          clearInterval(interval);//加入房间停止更新房间信息
          ws.send(JSON.stringify({ type: 'joinRoom', state: "succeed", message: "房间创建成功" }));
        }

      }

    } else if (data.state == "inRoom") {//在房间内
      if (data.type == "updatePlayerId") {
        // 有玩家退出，更新playerId
        rooms[roomId].players.forEach((player, index) => {
          if (player.client == ws) {
            playerId = index + 1
          }
        })
      }
      else if (data.type === 'chatMessage') {
        // 处理聊天信息and系统信息
        const message = data.message;
        rooms[roomId].broadcastMessage(JSON.stringify({ type: 'chatMessage', message, name: name, isSys: 0 }));
      }
      if (rooms[roomId].state == "waiting") {//房间处于等待状态
        if (data.type == "startGame") {//开始游戏 的路由
          // rooms[roomId].sendPlayersState();
          rooms[roomId].broadcastMessage(JSON.stringify({
            type: "gameStart",

          }));
          rooms[roomId].broadcastMessage(JSON.stringify({
            type: "sysMessage",
            message: "游戏开始"
          }));
          rooms[roomId].broadcastMessage(JSON.stringify({
            type: "chatMessage",
            isSys: 1,
            message: "游戏开始"
          }));
          rooms[roomId].runGame();
          console.log("room:" + roomId + ",game started")//控制台打印
        }
      } else if (rooms[roomId].state == "gaming") {//游戏中的路由

        //攻击和支付处理
        if (data.command == "attack") {
          console.log("player:" + name + " attack")
          console.log("Boss state:" + rooms[roomId].piles.Boss.cardList[0].life + "   " + rooms[roomId].piles.Boss.cardList[0].attack)
          attack(data.attackPile, data.leftPile);
          rooms[roomId].skipTimes = 0;//跳过次数归零
          rooms[roomId].sendPilesStates();//广播更新牌堆
          rooms[roomId].broadcastMessage(JSON.stringify({
            type: "sysMessage",
            message: name + " 攻击BOSS：" + data.attackPile.map(card => (["♠️", "♥️", "♣️", "♦️"][card.suit - 1] + ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][card.value - 1])).join(" ")
          }));
          rooms[roomId].broadcastMessage(JSON.stringify({
            type: "chatMessage",
            isSys: 1,
            message: name + " 攻击BOSS：" + data.attackPile.map(card => (["♠️", "♥️", "♣️", "♦️"][card.suit - 1] + ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][card.value - 1])).join(" ")
          }));
          //广播更新牌堆
          setTimeout(() => {
            //攻击后根据血量和攻击判断是否进入支付模式
            if (rooms[roomId].piles.Boss.cardList[0].life > 0) {
              if (rooms[roomId].piles.Boss.cardList[0].attack > 0) {
                //boss没死，并且boss攻击力没有降到0以下，进入支付阶段
                if (rooms[roomId].piles.handPiles[playerId - 1].cardList.reduce((acc, card) => acc + card.attack, 0) < rooms[roomId].piles.Boss.cardList[0].attack) {
                  console.log("player:" + playerId + " cannot afford the attack,died");
                  // 广播死亡信息
                  rooms[roomId].players[playerId - 1].dead = 1;
                  rooms[roomId].alivePlayerNum--;
                  rooms[roomId].broadcastMessage(JSON.stringify({
                    type: "sysMessage",
                    message: name + " 无法支付而死亡"
                  }))
                  rooms[roomId].broadcastMessage(JSON.stringify({
                    type: "chatMessage",
                    isSys: 1,
                    message: name + " 无法支付而死亡"
                  }))
                  rooms[roomId].broadcastMessage(JSON.stringify({
                    type: "playerDie",
                    playerId: playerId
                  }))
                  rooms[roomId].nextAttacker(playerId);
                } else {
                  //如果当前玩家能够支付伤害，广播通知下一步action
                  rooms[roomId].broadcastMessage(JSON.stringify({
                    type: "action",
                    action: "pay",
                    playerId: playerId
                  }))
                  rooms[roomId].broadcastMessage(JSON.stringify({
                    type: "sysMessage",
                    message: "轮到 " + name + " 支付BOSS的攻击"
                  }))
                }
              } else {
                //boss攻击力降到了0及以下，跳过支付，广播下个人进入攻击
                rooms[roomId].nextAttacker(playerId);
              }
            } else {//如果死了，换一个boss，并广播下一个人继续攻击
              let dieMessage = "Boss" + (["♠️", "♥️", "♣️", "♦️"][rooms[roomId].piles.Boss.cardList[0].suit - 1] + ["J", "Q", "K"][rooms[roomId].piles.Boss.cardList[0].value - 11]) + "死亡 ";
              //广播更新牌堆
              rooms[roomId].selectBoss();
              rooms[roomId].broadcastMessage(JSON.stringify({
                type: "sysMessage",
                message: dieMessage + (["♠️", "♥️", "♣️", "♦️"][rooms[roomId].piles.Boss.cardList[0].suit - 1] + ["J", "Q", "K"][rooms[roomId].piles.Boss.cardList[0].value - 11]) + "加入战斗"
              }));//广播更新牌堆
              rooms[roomId].broadcastMessage(JSON.stringify({
                type: "chatMessage",
                isSys: 1,
                message: dieMessage + (["♠️", "♥️", "♣️", "♦️"][rooms[roomId].piles.Boss.cardList[0].suit - 1] + ["J", "Q", "K"][rooms[roomId].piles.Boss.cardList[0].value - 11]) + "加入战斗"
              }));//广播更新牌堆
              rooms[roomId].sendPilesStates();
              setTimeout(() => {
                rooms[roomId].nextAttacker(playerId);
              }, 200)
            }
          }, 300)
        }
        //支付路由
        else if (data.command == "pay") {
          console.log("player:" + name + " pay")
          rooms[roomId].broadcastMessage(JSON.stringify({
            type: "sysMessage",
            message: name + " 支付：" + data.payPile.map(card => (["♠️", "♥️", "♣️", "♦️"][card.suit - 1] + ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][card.value - 1])).join(" ")
          }));
          rooms[roomId].broadcastMessage(JSON.stringify({
            type: "chatMessage",
            isSys: 1,
            message: name + " 支付：" + data.payPile.map(card => (["♠️", "♥️", "♣️", "♦️"][card.suit - 1] + ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][card.value - 1])).join(" ")
          }));
          rooms[roomId].piles.wastePile.push(data.payPile);
          rooms[roomId].piles.handPiles[playerId - 1].cardList = data.leftPile;
          // 支付完毕，通知下一个人攻击
          rooms[roomId].sendPilesStates();
          setTimeout(() => {
            rooms[roomId].nextAttacker(playerId);
          }, 300)
        }

        // 跳过路由
        else if (data.command == "skip") {
          rooms[roomId].skipTimes++;
          if (rooms[roomId].skipTimes == rooms[roomId].alivePlayerNum) {
            // 一轮中所有人都跳过，GAMEOVER
            rooms[roomId].gameover("存活玩家都跳过");
            rooms[roomId].setHost();
          } else {
            rooms[roomId].broadcastMessage(JSON.stringify({
              type: "sysMessage",
              message: name + " 跳过"
            }));
            rooms[roomId].broadcastMessage(JSON.stringify({
              type: "chatMessage",
              isSys: 1,
              message: name + " 跳过"
            }));
            setTimeout(() => {
              rooms[roomId].nextAttacker(playerId);
            }, 300)
          }
        }
      }
    }
    // Handle other game logic here
  });

  ws.on('close', () => {
    console.log(clientId + " loss connect")
    if (roomId != null) {//如果加入了房间，离开时更新房间玩家，广播玩家状态
      if (rooms[roomId].players.length > 0) {
        rooms[roomId].players = rooms[roomId].players.filter(player => player.client != ws);

        rooms[roomId].updatePlayerId();// 离开时必须、必须更改所有玩家的playerId

        if (rooms[roomId].players.length == 0) delete rooms[roomId]
        else {
          if (rooms[roomId].state == "waiting") {
            rooms[roomId].broadcastMessage(JSON.stringify({
              type: "sysMessage",
              message: name + "离开了房间"
            }))
            rooms[roomId].sendPlayersState();
            if (playerId == 1)
              rooms[roomId].setHost();
          } else if (rooms[roomId].state == "gaming") {
            // 一定要先通知GAMEOVER，再更新玩家列表，不然浏览器显示的牌堆没法全部清除
            rooms[roomId].gameover(name + " 离开游戏");
            rooms[roomId].sendPlayersState();
            rooms[roomId].setHost();
          }
        }
      }
    }
  });
});