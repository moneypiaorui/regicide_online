[originalCards,cardsLimit] = [[10,20],[7,8],[6,7],[5,6],[5,5]][0];

bossPile = new CardPile([], "bossPile", 0, 0);
handPile = new CardPile([], "handPile", 1, 0);
handPile.clickAllow = 1;
wastePile = new CardPile([], "wastePile", 1, 1);
drawPile = new CardPile([], "drawPile", 1, 1);

for (let i = 1; i <= 4; i++) {
    for (let j = 1; j <= 10; j++) {
        drawPile.push([new PokerCard(j, i)]);
    }
}
drawPile.shuffle();
handPile.push(drawPile.cardList.splice(0, originalCards));
handPile.sort();

// boss牌堆洗牌
for (let j = 13; j >= 11; j--) {
    temPile = new CardPile([], "wastePile", 1, 1);
    for (let i = 1; i <= 4; i++) {
        temPile.push([new PokerCard(j, i)]);
    }
    temPile.shuffle();
    bossPile.push(temPile.cardList);
}
selectBoss();
refresh();

// 绑定按钮点击事件
playButton.addEventListener("click", play);
payButton.addEventListener("click", pay);
payButton.classList.add("hide");
skipButton.addEventListener("click", skip);


