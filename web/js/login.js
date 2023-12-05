al = document.querySelector("#alert");
showAlert1 = (message) => {
    al.innerText = message;
    al.style.transition = "0s";
    al.style.backgroundColor = "rgba(0, 128, 0,0.4)";
    al.style.color = "green";
    al.style.transform = "translateY(20px)";
    setTimeout(() => {
        al.style.transition = "0.2s";
        al.style.opacity = 1
        al.style.transform = "translateY(0px)";
    }, 1)

    setTimeout(() => {
        al.style.opacity = 0;
        al.style.transform = "translateY(-20px)";
    }, 600)
}
showAlert2 = (message) => {
    al.innerText = message;
    al.style.transition = "0s";
    al.style.backgroundColor = "rgba(255, 0, 0,0.4)";
    al.style.opacity = 1;
    al.style.color = "red";
    al.style.transform = "translateY(0px)";
    setTimeout(() => {
        al.style.transition = "0.05s";
        al.style.transform = "translateX(-10px)";
        setTimeout(() => {
            al.style.transform = "translateX(10px)";
            setTimeout(() => {
                al.style.transform = "translateX(-10px)";
                setTimeout(() => {
                    al.style.transform = "translateX(10px)";
                    setTimeout(() => {
                        al.style.transform = "translateX(-10px)";
                        setTimeout(() => {
                            al.style.transform = "translateX(10px)";
                            setTimeout(() => {
                                al.style.transform = "translateX(-10px)";
                                setTimeout(() => {
                                    al.style.transform = "translateX(0px)";
                                }, 50)
                            }, 50)
                        }, 50)
                    }, 50)
                }, 50)
            }, 50)
        }, 50)
    }, 1)

}