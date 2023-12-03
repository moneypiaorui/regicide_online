let chatInput = document.querySelector(".chat-input-area input");
let chatCardContainor = document.querySelector(".chat-show-area");
document.querySelector(".chat-input-area button").addEventListener("click", () => {
    socket.send(JSON.stringify({
        state: "inRoom",
        type: "chatMessage",
        message:chatInput.value
      }))
      chatInput.value="";
});

function addChatCard(data) {
    let card = document.createElement("div")
    card.classList.add("chat-show-card");
    if(data.isSys==0){
        card.innerText = data.name+":"+data.message;
    }
    chatCardContainor.appendChild(card);
    chatCardContainor.scrollTop=chatCardContainor.scrollHeight;//滚轮自动滑到底部
}

chatCardContainor.addEventListener("click",()=>{
    document.querySelector(".chat-area").classList.toggle("folded")
    // document.querySelector(".chat-input-area").classList.toggle("hide")
})