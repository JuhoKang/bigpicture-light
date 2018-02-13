$(document).keyup(function(event) {
	if (document.activeElement.id == "msgbox" || document.activeElement.id == "init-modal" || document.activeElement.id == "nickname")
		return;
	// console.log(document.activeElement.id);
	// console.log(event.keyCode);
	//색상선택 Q W
  if (event.keyCode === 81){
    $("#drawing-color").click();
	}

	if (event.keyCode === 87){
		$("#drawing-shadow-color").click();
	}
	
	//chat room R
  if (event.keyCode === 82){
    $("#chatting-btn").click();
	}
	
	//cropper C
	if (event.keyCode === 67){
    $("#cropper").click();
	}

	//지도 M
	if (event.keyCode === 77){
    $("#map-toggle.btn-dark").click();
	}

	//드로잉&이동 전환 D -> drawing, s-> moving,  
	if (event.keyCode === 83){
    $("#changeMode").click();
	}
	
	if (event.keyCode === 68){
    $("#pencilStyle").click();
	}

	if (event.keyCode === 70){
    $("#brushStyle").click();
	}

	// keypad +, keypad -, =, -
	// in order
	if (event.keyCode === 107 || event.keyCode === 109 || event.keyCode === 61 || eventCode === 173){
		if (event.keyCode === 107 || event.keyCode === 61) {
			zoomToCenter(true);
		} else {
			zoomToCenter(false);
		}
	}
});
