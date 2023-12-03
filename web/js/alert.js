alertArea = document.querySelector(".alert-area");
function addAlert(message,isWarn) {
    let alertbubble = document.createElement("div");
    alertbubble.innerText = message
    alertbubble.classList.add("alert-card");
    if(isWarn)alertbubble.classList.add("alert-warn");
    alertArea.appendChild(alertbubble);
    setTimeout(()=> {
        alertbubble.classList.add("alert-card-show");
    }, 50)

    setTimeout(() => {
        alertbubble.classList.add("alert-card-hide")
        setTimeout(() => {
            alertArea.removeChild(alertbubble);
        }, 500)
    }, 2000)
}