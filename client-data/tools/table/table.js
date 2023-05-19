
(function table() {
    let tableTool = {
		"name": "table",
		// "shortcut": "shortcut_key",
		"listeners": {
			"press": press,
			"move": move,
			"release": release,
		},
		"draw": draw,
		// "secondary": {
		// 	"name": "tool_name_2",
		// 	"icon": "tools/tool_folder/file_name.svg",
		// 	"active": false,
		// },
		"onstart": onstart,
		"onquit": onquit,
		"mouseCursor": "crosshair",//auto,pointer,crosshair,move,text,wait,help
		"icon": "tools/table/tableIcon.svg",
		"stylesheet": "tools/table/table.css",
	};
    Tools.add(tableTool);

    //Triggered when you press the mouse
    function press(x,y,evt) {
        //Prevent the press from being interpreted by the browser
		evt.preventDefault();
		console.log("press:tableTool");
		//Determine whether a table already exists here?
		let target = evt.target;
		if(target.id.includes("table") && target.tagName == "text" ) {
			createTextInput(x,y,target);
			return ;
		}
		
		let curId = Tools.generateUID("table");
		let data = {
			'type': 'table',
			'id': curId,
			'x': x,
			'y': y,
			'rows':3,
			'columns':3,
			'cellWidth':100,
			'cellHeight':50
		}
		// Create a dialog box with two buttons: Create New table and Insert table
		const dialog = document.createElement("div");
		dialog.style.position = "absolute";
		dialog.style.top = "50%";
		dialog.style.left = "50%";
		dialog.style.transform = "translate(-50%, -50%)";
		dialog.style.background = "#fff";
		dialog.style.padding = "10px";
		dialog.style.border = "1px solid #ccc";
		dialog.style.boxShadow = "2px 2px 5px rgba(0,0,0,0.3)";
		
		const title = document.createElement("h2");
		title.textContent = "请选择：";
		dialog.appendChild(title);
		
		const createButton = document.createElement("button");
		createButton.textContent = "创建新表格";
		createButton.addEventListener("click", () => {
			createNew(data);
		  	document.body.removeChild(dialog);
		});
		dialog.appendChild(createButton);
		
		// const insertButton = document.createElement("button");
		// insertButton.textContent = "插入表格";
		// insertButton.addEventListener("click", () => {
		// 	insert();
		// 	document.body.removeChild(dialog);
		// });
		// dialog.appendChild(insertButton);

		const cancelButton = document.createElement("button");
		cancelButton.textContent = "取消";
		cancelButton.addEventListener("click",() => {
			document.body.removeChild(dialog);
		})
		dialog.appendChild(cancelButton);
		
		// Add the dialog box to the web page
		document.body.appendChild(dialog);
	}

	function createTextInput(x, y, elem) {
		var input = document.createElement("input");
		input.type = "text";
		input.style.position = "absolute";
		input.style.left = "50%" ;
		input.style.top = "50%" ;
		document.body.appendChild(input);
		input.focus();
		input.addEventListener("keyup", function(evt) {
			if (evt.keyCode === 13) {
				elem.textContent = input.value;
				document.body.removeChild(input);
			}
		});
	  }
	  
	function createNew(data) {
		// Start by creating a dialog box
		let dialogElem = document.createElement("div");
		dialogElem.style.position = "absolute";
		dialogElem.style.top = "50%";
		dialogElem.style.left = "50%";
		dialogElem.style.transform = "translate(-50%, -50%)";
		dialogElem.style.padding = "16px";
		dialogElem.style.backgroundColor = "#fff";
		dialogElem.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";
		dialogElem.style.zIndex = "999";
		
		// Add input boxes and buttons to the dialog box
		let labelElem = document.createElement("label");
		labelElem.textContent = "输入行数和列数,例如“3,5”";
		dialogElem.appendChild(labelElem);
		
		let inputElem = document.createElement("input");
		inputElem.type = "text";
		inputElem.style.display = "block";
		inputElem.style.marginBottom = "8px";
		dialogElem.appendChild(inputElem);
		
		let buttonElem = document.createElement("button");
		buttonElem.textContent = "确认";
		dialogElem.appendChild(buttonElem);
		
		// Add the dialog box to the page
		document.body.appendChild(dialogElem);
		
		// Button click event handler
		buttonElem.onclick = function() {
		  let value = inputElem.value;
		  let parts = value.split(",");
		  
		  if (parts.length === 2) {
			data.rows = parseInt(parts[0]);
			data.columns = parseInt(parts[1]);		
			// Cancel the Render dialog
			document.body.removeChild(dialogElem);
			Tools.drawAndSend(data);
		  } else {
			alert("请按照格式输入行数和列数，例如: 3,4");
		  }
		}
	}

	function insert() {
		console.log("insert table:tableTool");

	}
    //Triggered when you move the mouse
    function move() {
		console.log("move:tableTool");

	}
    //Triggered when you release the mouse
    function release() {
		console.log("release:tableTool");

	}
    function draw(data){
        console.log("draw:tableTool");
		let tableElem = Tools.createSVGElement("g");
		tableElem.id = data.id;
		tableElem.setAttribute("transform", "translate(" + data.x + "," + data.y + ")");
		for (let i = 0; i < data.rows; i++) {
			for (let j = 0; j < data.columns; j++) {
			let isAlternate = i % 2 === 0;
			let content = "text"; //TODO:change content with file data
			let cellElem = createCell(data.id, data.cellWidth, data.cellHeight, isAlternate, content);
			cellElem.setAttribute("transform", "translate(" + j * data.cellWidth + "," + i * data.cellHeight + ")");
			tableElem.appendChild(cellElem);
			}
		}
		Tools.drawingArea.appendChild(tableElem);
		return tableElem;
    }

	function createCell(id,cellWidth, cellHeight, isAlternate, content) {
		let cellElem = Tools.createSVGElement("g");
		cellElem.classList.add("cell");
		if (isAlternate) {
			cellElem.classList.add("alternate");
		}
		
		let rect = Tools.createSVGElement("rect");
		rect.setAttribute("width", cellWidth);
		rect.setAttribute("height", cellHeight);
		rect.setAttribute("id",id);
		
		let text = Tools.createSVGElement("text");
		text.setAttribute("font-size", "16");
		text.setAttribute("x", cellWidth / 2);
		text.setAttribute("y", cellHeight / 2);
		text.setAttribute("id",id);
		text.textContent = content;
		
		cellElem.appendChild(rect);
		cellElem.appendChild(text);
		
		return cellElem;
	}
    //Triggered when you first select this tool
    function onstart(){
        console.log("onstart:tableTool");

    }
    //Triggered when you select other tool
    function onquit(){
        console.log("onquit:tableTool");

    }

	
})();
