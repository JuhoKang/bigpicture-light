/* global
  $:true
  socket:true*/

let name = "비회원";
let imgPath = null;

// on / off chatting room
$("#chatting-btn").click(function(){
  if($(this).val()=="off"){
    $(this).val("on");
    let fullWidth = window.innerWidth;
    let w;
    if(fullWidth/3 > 300){
      w = fullWidth/3;
    }
    else{
      w = 300;
    }
    $("#sidebar").animate({"width":w},{duration:700,
      complete: function(){
        $(".chatting").removeClass("white-space-nowrap")
      }});
    $(".chatting-count").text("0");
    $(".chatting-count").addClass("d-none");
  }else{
    $(this).val("off");
    $(".chatting").addClass("white-space-nowrap");
    $("#sidebar").animate({"width":0},700);
  }
});

// i need to move somewhere below.
$("#play").click(function() {
  if($("#nickname").val() !== ""){
    if($("#nickname").val().length > 8){
      alert("닉네임은 최대 7글자까지 가능합니다.");
      return;
    }
    name = $("#nickname").val();
    $(".my-nick-name").text(name);
    $("#init-modal").modal("hide");
  }
});

// click add button (img)
$("#msgplus").click((event) => {
  $("#msgimgfile").click();
});

// check image file
$("#msgimgfile").on("change", function() {
  let file = this.files[0];
  let fileType = file["type"];
  let validImageTypes = ["image/jpeg","image/png"];

  if ($.inArray(fileType, validImageTypes) < 0) {
    alert("jpeg,png 확장자의 파일만 가능합니다.");
    return false;
  }
  if(file.size>1048576) {
    alert("파일 사이즈는 최대 1MB까지 가능합니다.");
    return false;
  }
  let xhr = new XMLHttpRequest();
  let formData = new FormData();
  formData.append("image", file);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
        imgPath = xhr.responseText;
    }
  }
  xhr.open("POST", "/chatImageUploader/");
  xhr.send(formData);
})

// push enter key or click enter button
$("#msgbox").keyup((event) => {
  if(event.keyCode == 13) messageEvent();
});
$("#msgenter").click((event) => {
  messageEvent();
});

// recieve data from socket
socket.on("toclient", function (data) {
  messageCounter($(".chatting-count"));
  appendMessageOnLeft(data);
});

// cleaning chatting room
$(".all-chatting").click(function (event) {
  $("#msgs").empty();
});

// functions

function messageEvent() {
  // send image data
  if($("#msgimgfile").val()){
    let usermsg = {
      img : imgPath
    };
    sendMessage(name, usermsg);
    appendMessageOnRight(usermsg);
    $("#msgimgfile").val("");
  }
  // send string data
  if($("#msgbox").val() !== ""){
    if($("#msgbox").val().length > 100){
      alert("100글자 이내로 작성해 주세요.")
      $("#msgbox").val("");
      return;
    }
    sendMessage(name, $("#msgbox"));
    appendMessageOnRight($("#msgbox"));
    $("#msgbox").val("");
  }
}

// send data to socket
// username : user nickname
// type : "image" or "string"
// msg : image data or string data
function sendMessage(username, usermsg) {
  let type;
  let msg;
  if(usermsg.img){
    type = "image";
    msg = usermsg.img;
  }else{
    type = "string";
    msg = usermsg.val();
  }
  socket.emit("fromclient", {
    username: username,
    type: type,
    msg: msg,
  });
}

// recieve data from socket
// data.from.name : user nickname
// data.type : "image" or "string"
// data.msg : image data or string data
function appendMessageOnLeft(data) {
  if(data.type == "image"){
    // in progress!!!!!!!!!!
    $("#msgs").append(`<li class="chattinglist"><img src="file:///"+${data.msg}></li>`);
  }else{
    $("#msgs").append(`<li class="chattinglist"><span class="chattingbox">${data.from.name} : ${data.msg} </span></li>`);
  }
  $("#msgcontainer").scrollTop($("#msgcontainer")[0].scrollHeight);
}

// usermsg : image path or string data
function appendMessageOnRight(usermsg) {
  if(usermsg.img){
    // in progress!!!!!!!!!!
    $("#msgs").append(`<li class="my-chattinglist"><img src="file:///"+${usermsg.img}></li>`);
  }else{
    let msg = usermsg.val();
    $("#msgs").append(`<li class="my-chattinglist"><span class="chattingbox">${msg}</span></li>`);
  }
  $("#msgcontainer").scrollTop($("#msgcontainer")[0].scrollHeight);
}

function messageCounter(e) {
  let ct = parseInt(e.text());
  let chattingContainer = $("#chatting-btn");
  if(chattingContainer.val() == "off"){
    if(ct>99){
      e.text("99+");
    }else{
      e.text(ct+1);  
    }
    e.removeClass("d-none");
  }
}