var imgType = "";
var imgBase64 = "";
function upload(files) {
	imgType = "";
	imgBase64 = "";
	console.log('ready to upload:',files);
	Tools.socket.emit("upload", files[0], (response) => {
		console.log("response: ",response);
		imgType = files[0].type;
		imgBase64 = response;
	});
}
(function image() {
    var imageTool = {
		"name": "image",
		"listeners": {
			"press": press,
			"move": move,
			"release": release,
		},
		"draw": draw,
		"onstart": onstart,
		"onquit": onquit,
		"mouseCursor": "auto",
		"icon": "tools/image/image.svg",
	};
    Tools.add(imageTool);

    function press(x,y,evt) {
 		evt.preventDefault();
		console.log("press:image");
        let curId = Tools.generateUID("image");

		Tools.drawAndSend({
			'type': 'image',
			'id': curId,
			'x': x,
			'y': y,
			'width':100,
			'height':100,
			'href':'data:' + imgType + ';base64,' + imgBase64
		});

	}
    function move() {
		console.log("move:image");

	}
    function release() {
		console.log("release:image");

	}
    function draw(data){
		console.log("draw:image");
		Tools.drawingEvent = true;
        var elem = Tools.createSVGElement("image");
		elem.id = data.id;
		elem.setAttribute("x", data.x);
		elem.setAttribute("y", data.y);
		elem.setAttribute("width", data.width);
		elem.setAttribute("height", data.height);
		elem.setAttribute("href", data.href);
		Tools.drawingArea.appendChild(elem);
		return elem;
    }

    function onstart(){
		imgBase64 = "";
		var myInput = document.createElement('input');
		myInput.setAttribute("type","file");
		myInput.setAttribute("onchange","upload(this.files)");
		document.body.appendChild(myInput);
		myInput.click();
		document.body.removeChild(myInput);
    }
    function onquit(){
        console.log("onquit:image");

    }
})();