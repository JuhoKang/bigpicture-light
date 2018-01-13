/* global
  $:true
  socket:true*/

const name = $('#namebox').val();
let type = 'all';
let id;
let uid = $('#uid').val();

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

// send Message
$('#msgbox').keyup((event) => {
  if (event.keyCode == 13) {
    const usermsg = $('#msgbox');
    const mymsg = $('#msgbox').val();
    sendMessage(name, usermsg);
    $('#msgs').append(`<li class="my-chattinglist"><span class="chattingbox">${mymsg}</span></li>`);
    $('#msgcontainer').animate({
      scrollTop: $('.footer').offset().top,
    }, 0);
  }
});
$('#msgenter').click((event) => {
  const usermsg = $('#msgbox');
  const mymsg = $('#msgbox').val();
  sendMessage(name, usermsg);
  $('#msgs').append(`<li class="my-chattinglist"><span class="chattingbox">${mymsg}</span></li>`);
  $('#msgcontainer').animate({
    scrollTop: $('.footer').offset().top,
  }, 0);
})

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