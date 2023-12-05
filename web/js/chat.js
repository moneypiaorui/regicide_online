let chatInput = document.querySelector(".chat-input-area input");
let chatCardContainor = document.querySelector(".chat-show-area");

function addChatCard(data) {
    let card = document.createElement("div")
    card.classList.add("chat-show-card");
    if (data.isSys == 0) {
        card.innerHTML = "<strong>"+data.name + " : </strong>" + data.message;
    }else{
        card.innerHTML = "<strong>System :</strong> "  + data.message;
        card.classList.add("sys-chat");
    }
    chatCardContainor.appendChild(card);
    chatCardContainor.scrollTop = chatCardContainor.scrollHeight;//滚轮自动滑到底部
}

document.querySelector(".chat-input-area button").addEventListener("click", () => {
    socket.send(JSON.stringify({
        state: "inRoom",
        type: "chatMessage",
        message: chatInput.value
    }))
    chatInput.value = "";
});
chatInput.addEventListener("keydown",event=>{
    if(event.keyCode ==13){
        socket.send(JSON.stringify({
            state: "inRoom",
            type: "chatMessage",
            message: chatInput.value
        }))
        chatInput.value = "";
    }
})
chatCardContainor.addEventListener("click", () => {
    document.querySelector(".chat-area").classList.toggle("folded")
    // document.querySelector(".chat-input-area").classList.toggle("hide")
})