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
  }
}


class Room {
  constructor(player) {
    // this.clients = [ws];
    this.players = [player]
    this.roomId = player.roomId;
    this.state = "waiting"
    this.piles = {
      bossPile: new CardPile([]),
      handPiles: [],
      wastePile: new CardPile([]),
      drawPile: new CardPile([]),
      Boss: new CardPile([]),
    }

  }
  runGame() {
    this.playerNum = this.players.length
    this.state = "gaming";
    [this.originalCards, this.cardsLimit] = [[10, 20], [7, 8], [6, 7], [5, 6], [5, 5]][this.playerNum];
    for (let i = 1; i <= 4; i++) {
      for (let j = 1; j <= 10; j++) {
        this.piles.drawPile.push([new PokerCard(j, i)]);
      }
    }
    this.piles.drawPile.shuffle();
    for (let i = 0; i < this.playerNum; i++) {
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
    this.broadcastMessage(JSON.stringify({
      type: "action",
      action: "attack",
      playerId: 1
    }))
  }
  selectBoss() {
    if (this.piles.bossPile.cardList.length != 0) {
      this.piles.Boss = new CardPile([])
      this.piles.Boss.push([this.piles.bossPile.cardList.pop()]);
    } else {
      //胜利
      this.broadcastMessage(JSON.stringify({ state: "win" }))
      // alert("You win!");
      // location.reload();
    }
  }
  broadcastMessage(message) {
    this.players.forEach(player => {
      player.client.send(message);
    });
  }
  sendPilesStates() {
    this.broadcastMessage(JSON.stringify({
      type: "updataPiles",
      piles: this.piles
    }))
  }

}






const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8013 });
const rooms = {};

wss.on('connection', ws => {
  const clientId = Math.random().toString(36).substring(7);///随机生成客户端ID
  ws.send(JSON.stringify({
    type: "connected",
    state: "succeed",
    clientId: clientId
  }))
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
    while (count < rooms[roomId].playerNum) {//如果所有玩家都跳过了摸牌，摸牌结束
      if (drawNum < value && rooms[roomId].piles.drawPile.cardList.length > 0) {
        if (rooms[roomId].piles.handPiles[index].cardList.length < rooms[roomId].cardsLimit) {
          rooms[roomId].piles.handPiles[index].push([rooms[roomId].piles.drawPile.cardList.pop()]);
          drawNum++;
          count = 0;
        } else {
          count++;//跳过一个玩家，即表示一个玩家牌满了
        }
      } else {
        break;
      }
      index = (index + 1) % rooms[roomId].playerNum;
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
              rooms[roomId].broadcastMessage(JSON.stringify({ type: 'newJoiner', clientId: clientId, name: name }))
              rooms[roomId].players.push(new Player(ws, clientId, name));
              playerId = rooms[roomId].players.length;
              ws.send(JSON.stringify({ type: 'joinRoom', state: "succeed", message: "房间加入成功", isHost: 0, players: rooms[roomId].players.map(player => { return { name: player.name, clientId: player.clientId } }) }));
            } else {
              ws.send(JSON.stringify({ type: 'joinRoom', state: "fail", message: "房间人数已满" }));
            }
          } else if (rooms[roomId].state == "gaming") {
            ws.send(JSON.stringify({ type: 'joinRoom', state: "fail", message: "房间已开始游戏" }));
          }

        } else {
          rooms[roomId] = new Room(new Player(ws, clientId, name));
          playerId = 1;
          console.log(clientId + " join room " + roomId)
          ws.send(JSON.stringify({ type: 'joinRoom', state: "succeed", message: "房间创建成功", isHost: 1, players: rooms[roomId].players.map(player => { return { name: player.name, clientId: player.clientId } }) }));
        }

      }

    } else if (data.state == "inRoom") {//在房间内
      if (data.type === 'chatMessage') {
        // 处理聊天信息and系统信息
        const message = data.message;
        rooms[roomId].broadcastMessage(JSON.stringify({ type: 'chatMessage', message }));
      }
      if (rooms[roomId].state == "waiting") {//房间处于等待状态
        if (data.type == "startGame") {//开始游戏 的路由
          rooms[roomId].broadcastMessage(JSON.stringify({
            type: "gameStart",
            players: rooms[roomId].players.map(player => { return { name: player.name, clientId: player.clientId } })
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
          rooms[roomId].sendPilesStates();//广播更新牌堆

          //攻击后根据血量和攻击判断是否进入支付模式
          if (rooms[roomId].piles.Boss.cardList[0].life > 0) {
            if (rooms[roomId].piles.Boss.cardList[0].attack > 0) {
              //boss没死，并且boss攻击力没有降到0以下，进入支付阶段
              if (rooms[roomId].piles.handPiles[playerId - 1].cardList.reduce((acc, card) => acc + card.attack, 0) < rooms[roomId].piles.Boss.cardList[0].attack) {
                console.log("player:" + playerId + " cannot afford the attack,died");
                // 广播死亡信息

              }
              //广播通知下一步action
              rooms[roomId].broadcastMessage(JSON.stringify({
                type: "action",
                action: "pay",
                playerId: playerId
              }))
            } else {
              //boss攻击力降到了0及以下，跳过支付，广播下个人进入攻击
              rooms[roomId].broadcastMessage(JSON.stringify({
                type: "action",
                action: "attack",
                playerId: ((playerId % rooms[roomId].playerNum) + 1)
              }))
            }
          } else {//如果死了，换一个boss，并广播下一个人继续攻击
            rooms[roomId].selectBoss();
            rooms[roomId].sendPilesStates();
            rooms[roomId].broadcastMessage(JSON.stringify({
              type: "action",
              action: "attack",
              playerId: ((playerId % rooms[roomId].playerNum) + 1)
            }))
          }
        }
        //支付路由
        else if (data.command == "pay") {
          console.log("player:" + name + " pay")
          rooms[roomId].piles.wastePile.push(data.payPile);
          rooms[roomId].piles.handPiles[playerId - 1].cardList = data.leftPile;
          // 支付完毕，通知下一个人攻击
          rooms[roomId].sendPilesStates();
          rooms[roomId].broadcastMessage(JSON.stringify({
            type: "action",
            action: "attack",
            playerId: ((playerId % rooms[roomId].playerNum) + 1)
          }))
        }
      }
    }
    // Handle other game logic here
  });

  ws.on('close', () => {
    console.log(clientId + " loss connect")
    if (roomId != null) {
      if (rooms[roomId].players.length > 0) {
        rooms[roomId].players = rooms[roomId].players.filter(player => player.client != ws);
        if (rooms[roomId].players.length == 0) delete rooms[roomId]
      }
    }
  });
});