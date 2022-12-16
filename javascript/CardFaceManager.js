
class CardFaceManager
{
 static position = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
 static populate(number){
    if(number<0 || number > 12){
        throw new Error("Don't think you should be using our functions buddy")
    }
    for(let i = 0; i < number; i ++){
        fetch("/faces/"+position[i]+".html")
            .then(response => response.text())
            .then(content => document.getElementById("card-face "+ position[i]).innerHTML = content)
            .then(() => document.getElementById("card-back "+position[i]).setAttribute("style", "transition: transform 0.5s; transition-timing-function: ease-in; transition-delay: "+(i*0.5)+"s; transform: rotateY(90deg);"))
            .then(() => document.getElementById("card-face "+position[i]).setAttribute("style", "transition: transform 0.5s; transition-timing-function: ease-out; transition-delay: "+(i*0.5 + 0.5)+"s; transform: rotateY(360deg);"))
            .then(()=> console.log("it worked"));
    }
}
}
