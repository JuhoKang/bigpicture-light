/* global
  $:true
  socket:true*/

let name = "비회원";

$("#chatting-btn").click(function(){
  if($(this).val()=="off"){
    $(this).val("on");
    var fullWidth = window.innerWidth;
    var w;
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

// send Message
$("#msgbox").keyup((event) => {
  if (event.keyCode == 13 && $("#msgbox").val() !== "") {
    if($("#msgbox").val().length > 100){
      alert("100글자 이내로 작성해 주세요.")
      $("#msgbox").val("");
      return;
    }
    sendMessage(name, $("#msgbox"));
    showMessage($("#msgbox"));
    $("#msgbox").val("");
  }
});
$("#msgenter").click((event) => {
  if($("#msgbox").val() !== ""){
    if($("#msgbox").val().length > 100){
      alert("100글자 이내로 작성해 주세요.")
      $("#msgbox").val("");
      return;
    }
    sendMessage(name, $("#msgbox"));
    showMessage($("#msgbox"));
    $("#msgbox").val("");
  }
});

// receiveMessage
socket.on("toclient", function (data) {
  chattingCounter($(".chatting-count"));
  receiveMessage(data);
});

$(".all-chatting").click(function (event) {
  $("#msgs").empty();
});

// function
function sendMessage(username, usermsg) {
  socket.emit("fromclient", {
    username: username,
    msg: usermsg.val(),
  });
}

function receiveMessage(data) {
  $("#msgs").append(`<li class="chattinglist"><span class="chattingbox">${data.from.name} : ${data.msg} </span></li>`);
  $("#msgcontainer").scrollTop($("#msgcontainer")[0].scrollHeight);
}

function showMessage(usermsg) {
  let msg = usermsg.val();
  $("#msgs").append(`<li class="my-chattinglist"><span class="chattingbox">${msg}</span></li>`);
  $("#msgcontainer").scrollTop($("#msgcontainer")[0].scrollHeight);
}

function chattingCounter(e) {
  var ct = parseInt(e.text());
  var chattingContainer = $("#chatting-btn");
  if(chattingContainer.val() == "off"){
    if(ct>99){
      e.text("99+");
    }else{
      e.text(ct+1);  
    }
    e.removeClass("d-none");
  }
}