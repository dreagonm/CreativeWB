/**
 *                        WHITEBOPHIR
 *********************************************************
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2020  Ophir LOJKINE
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

 (function bg() { //Code isolation

    var index = 0; //grid off by default
    var pic_url = [
        "",
        "https://gss0.baidu.com/-4o3dSag_xI4khGko9WTAnF6hhy/zhidao/pic/item/a71ea8d3fd1f4134533dc03b251f95cad1c85e69.jpg",
        "https://pic.ntimg.cn/file/20200102/30870395_151038715247_2.jpg"
    ];

    function togglebg(evt) {
        index = (index + 1) % pic_url.length;
        refresh();
    }

    function refresh(){
        var elem = document.getElementById("background");
        var image=document.createElementNS('http://www.w3.org/2000/svg','image');

        image.setAttribute("x","0");

        image.setAttribute("y","0");

        image.setAttribute("width","100%");

        image.setAttribute("height","100%");

        image.href.baseVal = pic_url[index];
        var tmp = elem.lastChild;
        if(tmp==null){
            elem.appendChild(image);
        }
        else{
            elem.appendChild(image);
            elem.removeChild(tmp);
        }
        
    }

    var gridContainer = (function init() {

        var svgDemo= document.createElementNS('http://www.w3.org/2000/svg','svg');
        svgDemo.setAttribute("id","background");
        svgDemo.style.width = "100%";

        svgDemo.style.height = "100%";

        document.body.appendChild(svgDemo);

        Tools.svg.insertBefore(svgDemo, Tools.drawingArea);
        return svgDemo;
    })();

    Tools.add({ //The new tool
        "name": "BackGround",
        "shortcut": "bg",
        "listeners": {},
        "icon": "tools/bg/icon.svg",
        "oneTouch": true,
        "onstart": togglebg,
        "mouseCursor": "crosshair",
    });

})(); //End of code isolation