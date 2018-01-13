

$(document).keyup(function(event) {
	if (document.activeElement.id == "msgbox")
		return;
	// console.log(document.activeElement.id);
	// console.log(event.keyCode);
	//색상선택 Q W
  if (event.keyCode === 81){
    $('#drawing-color').click();
	}

	if (event.keyCode === 87){
		$('#drawing-shadow-color').click();
	}
	
	//리모콘 R
  if (event.keyCode === 82){
    $('#remote-control-btn').click();
	}
	
	//채팅창 C
	if (event.keyCode === 67){
    $('#chatting-btn').click();
	}

	//지도 M
	if (event.keyCode === 77){
    $('#map-toggle.btn-dark').click();
	}

	//드로잉&이동 전환 D -> drawing, s-> moving,  
	if (event.keyCode === 83){
    $('#changeMode').click();
	}
	
	if (event.keyCode === 68){
    $('#pencilStyle').click();
	}

	if (event.keyCode === 70){
    $('#brushStyle').click();
	}

	//키패드 위에 있는 버튼 확대 +, 축소 - (가운데 기준)) 
	if (event.keyCode === 107 || event.keyCode === 109){
		const centerX = (canvas.vptCoords.tr.x + canvas.vptCoords.tl.x) / 2;
		const centerY = (canvas.vptCoords.bl.y + canvas.vptCoords.tl.y) / 2;
		if (event.keyCode === 107) {
			updateCanvasMove();
			$('#infotext').text('줌 인');
			$('#infotext').attr('class', 'col-6 col-md-9 alert alert-primary btn-block');
			$('#infotext').animateCss('fadeIn');

			if (canvas.getZoom() < 5) {
				canvas.absolutePan(new fabric.Point(canvas.getZoom() * centerX, canvas.getZoom() * centerY));
				canvas.setZoom(canvas.getZoom() * 1.1);
				canvas.relativePan(new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2));
			} else {
				console.log('no zoom any more');
				canvas.setZoom(5);
				canvas.renderAll();
			}
	
		} else {
			updateCanvasMove();
			$('#infotext').text('줌 아웃');
			$('#infotext').attr('class', 'col-6 col-md-9 alert alert-primary btn-block');
			$('#infotext').animateCss('fadeIn');

			if (canvas.getZoom() > 0.04) {
				canvas.absolutePan(new fabric.Point(canvas.getZoom() * centerX, canvas.getZoom() * centerY));
				canvas.setZoom(canvas.getZoom() * 0.9);
				canvas.relativePan(new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2));
			} else {
				console.log('no zoom any more');
				canvas.setZoom(0.04);
			}
			canvas.renderAll();
		}
	}
});