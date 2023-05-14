/**
 *                        WHITEBOPHIR
 *********************************************************
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2013  Ophir LOJKINE
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend
 */
 var stack = Array(20);
 var len = 0;
 (function undo() { //Code isolation
    var svg = Tools.svg;

    var msg = {
      "type":"undo",
      "id":"",
      "delete_id":""
    };

    function withdraw_step() {
         var target_id  = Tools.drawingArea.lastChild.id;
         msg.id = Tools.generateUID("U")
         msg.delete_id = target_id;
         Tools.drawAndSend(msg, Tools.list["Undo"]);
    }
	
    function  draw(data) {
      var elem;
      switch (data.type) {
			case "undo":
				elem = svg.getElementById(data.delete_id);
        // console.log(elem)
				if (elem === null) console.error("Undo: nothing had been done.");
				else {
          if(len+1<20){
            stack[len] = elem;
            len++;
          }
          Tools.drawingArea.removeChild(elem);
        }
				break;
			default:
				console.error("Undo: 'Undo' instruction with unknown type. ", data);
				break;
		}
    }
	var undoTool = {
        "name": "Undo",
        "shortcut": "u",
        "listener":{},
        "icon": "tools/undo/icon_1.svg",
        "draw":draw,
        "oneTouch":true,
        "onstart": withdraw_step,
        "mouseCursor": "crosshair",
	};
	Tools.add(undoTool);

})(); //End of code isolation

(function redo() { //Code isolation
  var svg = Tools.svg;

  var msg = {
    "type":"redo",
    "id":"",
    "redo_id":""
  };

  function redo() {
      if(len>=1 & len<20){
      var target_index  = len -1;
      len--;
       msg.id = Tools.generateUID("R")
       msg.redo_id = target_index;
       console.log(msg);
       Tools.drawAndSend(msg, Tools.list["redo"]);
      }
  }

  function  draw(data) {
    var elem;
    switch (data.type) {
    case "redo":
      elem = stack[data.redo_id];
      console.log(elem)
      if (elem === null) console.error("redo: nothing is undo.");
      else Tools.drawingArea.appendChild(elem);
      break;
    default:
      console.error("redo: 'redo' an unknown type. ", data);
      break;
  }
  }
var redoTool = {
      "name": "redo",
      "shortcut": "r",
      "listener":{},
      "icon": "tools/undo/icon_2.svg",
      "draw":draw,
      "oneTouch":true,
      "onstart": redo,
      "mouseCursor": "crosshair",
};
Tools.add(redoTool);
})(); //End of code isolation
