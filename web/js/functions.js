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

// 出牌事件
play = () => {
    if (attack(handPile.cardList.filter(card => card.selected == 1))) {
        if (Boss.cardList[0].life > 0) {
            if (Boss.cardList[0].attack > 0) {
                //boss没死，并且boss攻击力没有降到0以下，进入支付阶段
                if(handPile.cardList.reduce((acc,card)=>acc+card.attack,0)<Boss.cardList[0].attack){
                    alert("Cannot afford the attack,GAME OVER");
                    location.reload();
                }
                playButton.classList.add("hide");
                skipButton.classList.add("hide");
                payButton.classList.remove("hide");
            }
        } else {
            selectBoss();
        }
    } else {
        alert("不允许");
        handPile.cardList.forEach(card => {
            if (card.selected) card.select();
        });
    }
    refresh();
}

// 支付伤害事件
pay = () => {
    let selectPile = handPile.cardList.filter(card => card.selected == 1)
    let sum = (selectPile.reduce((accumulator, card) => accumulator + card.attack, 0))
    // alert(sum);
    if (sum < Boss.cardList[0].attack) {
        alert("Not enough to defend the attack");
    } else {
        handPile.cardList = handPile.cardList.filter(card => card.selected == 0)
        wastePile.push(selectPile);
        playButton.classList.remove("hide");
        skipButton.classList.remove("hide");
        payButton.classList.add("hide");
    }
    refresh();
}

skip = () => {
    alert("GAMEOVER");
    location.reload();
}

function refresh() {
    wastePile.updateShow();
    handPile.updateShow();
    drawPile.updateShow();
    Boss.updateShow();
    bossPile.updateShow();
    Boss.cardList[0].updateInfo();
}

function selectBoss() {
    if (bossPile.cardList.length != 0) {
        Boss = new CardPile([], "boss-showArea", 1, 1)
        Boss.push([bossPile.cardList.pop()]);
    } else {
        alert("You win!");
        location.reload();
    }
}


//效果结算阶段
function effect(type, value) {
    // alert(type + " " + BossInfo.type);
    if (type == 1 && Boss.cardList[0].suit != 1) {
        reduceAttack(value);
    } else if (type == 2 && Boss.cardList[0].suit != 2) {
        waste2draw(value);
    } else if (type == 3 && Boss.cardList[0].suit != 3) {
        doubleAttack(value);
    } else if (type == 4 && Boss.cardList[0].suit != 4) {
        drawCard(value);
    }
}

//伤害结算阶段,返回值1表示boss已死，0表示boss未死
function hurt(value) {
    Boss.cardList[0].life -= value;
    if (Boss.cardList[0].life <= 0) {
        if (Boss.cardList[0].life == 0) {
            drawPile.push([new PokerCard(Boss.cardList[0].value,Boss.cardList[0].suit) ]);
        }else{
            wastePile.push([new PokerCard(Boss.cardList[0].value,Boss.cardList[0].suit) ]);
        }
        return 1;
    }

    return 0;
}
// 黑桃效果，增加防御,等价于减小攻击
function reduceAttack(value) {
    Boss.cardList[0].attack -= value;
}

// 方片效果，摸牌
function drawCard(value) {
    drawNum = Math.min(value, cardsLimit - handPile.cardList.length, drawPile.cardList.length);
    handPile.push(drawPile.cardList.splice(drawPile.cardList.length - drawNum, drawNum));
    handPile.sort();
}

function doubleAttack(value) {
    Boss.cardList[0].life -= value;
}

//红桃效果，从废牌堆回牌到摸牌堆
function waste2draw(value) {
    returnNum = Math.min(value, wastePile.cardList.length);
    wastePile.shuffle();
    drawPile.unshift(wastePile.cardList.splice(0, returnNum));
}

// 出牌攻击指令
function attack(attackPile) {
    if (attackPile.length == 1) {
        handPile.cardList = handPile.cardList.filter(card => card.selected == 0);//移出手牌
        effect(attackPile[0].suit, attackPile[0].attack);//效果结算
        hurt(attackPile[0].attack);//伤害结算
        wastePile.push(attackPile);//攻击牌堆移入弃牌堆
        return 1;
    } else {
        let numClass = countElements(attackPile.map(card => card.value));
        let typeClass = countElements(attackPile.map(card => card.suit));
        let sumAttack = attackPile.reduce((acc, card) => acc + card.attack, 0);
        if (Object.keys(numClass).length == 1 || attackPile.length - numClass["1"] == 1) {
            handPile.cardList = handPile.cardList.filter(card => card.selected == 0);//移出手牌
            Object.keys(typeClass).forEach(key => {
                effect(key, sumAttack);//效果结算
            })
            hurt(sumAttack);//伤害结算
            wastePile.push(attackPile);//攻击牌堆移入弃牌堆
            return 1;
        }
    }
    return 0;
}

// module.exports={
//     attack,
//     pay
// }