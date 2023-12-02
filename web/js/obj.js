class PokerCard {
  constructor(value, suit) {
    this.value = value;
    this.suit = suit;
    this.imPath = "images/" + ((this.suit - 1) * 13 + this.value) + ".jpg";
    this.element = document.createElement("div");
    this.element.classList.add("card");
    this.element.style.backgroundImage = "url('" + this.imPath + "')";
    this.selected = false;
    this.life = 0;
    this.attack = this.value;
    if (value == 11) {
      this.attack = 10;
      this.life = 20;
    } else if (value == 12) {
      this.attack = 15;
      this.life = 30;
    } else if(value==13) {
      this.attack = 20;
      this.life = 40;
    }
  }
  addClick() {
    this.element.addEventListener("click", this.select);
  }
  removeClick() {
    if (this.selected) this.select();
    this.element.removeEventListener("click", this.select);
  }
  fold() {
    this.element.classList.add("folded");
  }
  removeFold() {
    this.element.classList.remove("folded");
  }
  select = () => {
    this.selected = !this.selected;
    this.element.classList.toggle("select");
  }
  show() {
    this.element.style.backgroundImage = "url('" + this.imPath + "')";
  }

  hide() {
    this.element.style.backgroundImage = "url('images/0.jpg')";
  }
  updateInfo() {
    document.getElementById("life").innerText = "LIFE:" + this.life;
    document.getElementById("attack").innerText = "ATK:" + this.attack;
  }
  json(){
    return JSON.stringify({value:this.value,suit:this.suit});
  }
}



class CardPile {
  constructor(cardList, elementId, showState, foldState) {
    this.cardList = cardList;
    this.element = document.getElementById(elementId);
    this.showState = showState;
    this.foldState = foldState;
    this.clickAllow = 0;
  }
  fold() {
    this.cardList.forEach(card => {
      card.fold();
    })
  }
  addClick() {
    this.cardList.forEach(card => {
      card.addClick();
    })
  }
  removeClick() {
    this.cardList.forEach(card => {
      card.removeClick();
    })
  }
  shuffle() {
    // Knuth洗牌算法
    for (let i = this.cardList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cardList[i], this.cardList[j]] = [this.cardList[j], this.cardList[i]];
    }
  }
  push(array) {
    this.cardList=[];//联机模式加上
    array.forEach(card => {
      if (this.foldState) {
        card.fold();
      } else {
        card.removeFold();
      }
      if (this.clickAllow) {
        card.addClick();
      } else {
        card.removeClick();
      }
      if (this.showState) {
        card.show();
      } else {
        card.hide();
      }
      this.cardList.push(card);
    })
  }
  unshift(array) {
    array.forEach(card => {
      // card.element.classList="card";
      if (this.foldState) {
        card.fold();
      } else {
        card.removeFold();
      }
      if (this.clickAllow) {
        card.addClick();
      } else {
        card.removeClick();
      }
      if (this.showState) {
        card.show();
      } else {
        card.hide();
      }
      this.cardList.unshift(card);
    })
  }
  updateShow() {
    this.element.innerHTML = "";
    this.cardList.forEach(card => {
      this.element.appendChild(card.element);
    })
  }

  hideAll() {
    this.carlist.forEach(card => {
      card.hide();
    });
  }
  showAll() {
    this.carlist.forEach(card => {
      card.show();
    });
  }
  sort() {
    this.cardList.sort((a, b) => a.value - b.value);
  }
}

class Player {
  constructor(clientId, name, playerId,dead) {
    this.clientId = clientId;
    this.playerId = playerId;
    this.name = name;
    this.dead=dead;
    this.DOMlink=null;
  }
  showName(nameTag){
    if(this.DOMlink!=null){
      document.querySelector(this.DOMlink).classList.remove("hide");
      document.querySelector(this.DOMlink+" "+nameTag).innerText=this.name;
    }
    
  }
  addAction(){
    document.querySelector(this.DOMlink+" span").classList.add("player-action")
  }
  removeAction(){
    document.querySelector(this.DOMlink+" span").classList.remove("player-action")
  }
  addDead(){
    document.querySelector(this.DOMlink+" span").classList.add("player-dead")
  }
  removeDead(){
    document.querySelector(this.DOMlink+" span").classList.remove("player-dead")
  }
}
