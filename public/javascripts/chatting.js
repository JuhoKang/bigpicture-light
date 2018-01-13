/* global
  $:true
  socket:true*/

let name = '비회원';
let type = 'all';
let id;
let uid = $('#uid').val();

$('#play').click(function() {
  if($('#nickname').val() !== ''){
    name = $('#nickname').val();
    if(name.length > 8){
      alert("닉네임은 최대 7글자까지 가능합니다.")
      return;
    }
    $('.my-nick-name').text(name);
    $('#init-modal').modal('hide');
  }
});

function sendMessage(username, usermsg) {
  socket.emit('fromclient', {
    username: username,
    msg: usermsg.val(),
    id: null,
  });
  usermsg.val('');
  return false;
}

function receiveMessage(data) {
  if(data.id == null){
    $('#msgs').append(`<li class="chattinglist"><span class="chattingbox">${data.from.name} : ${data.msg} </span></li>`);
  }
  $('#msgcontainer').animate({
    scrollTop: $('.footer').offset().top,
  }, 0);
}

function showMessage(usermsg) {
  let msg = usermsg.val();
  sendMessage(name, usermsg);
  $('#msgs').append(`<li class="my-chattinglist"><span class="chattingbox">${msg}</span></li>`);
  $('#msgcontainer').animate({
    scrollTop: $('.footer').offset().top,
  }, 0);
}

// send Message
$('#msgbox').keyup((event) => {
  if (event.keyCode == 13 && $('#msgbox').val() !== '') {
    showMessage($('#msgbox'));
  }
});
$('#msgenter').click((event) => {
  if($('#msgbox').val() !== ''){
    showMessage($('#msgbox'));
  }
});

// receiveMessage
socket.on('toclient', function (data) {
  receiveMessage(data);
});

socket.on('login', function (data) {
  $('#msgsname').append(`${data} <br>`);
  $('#msgs').append("join" + '<BR>');
});

$('.all-chatting').click(function (event) {
  type = 'all';
  $('#msgs').empty();
})