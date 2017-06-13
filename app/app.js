import data from './components/data-factory';
import data1 from './components/abc';

class menuComponent {

    constructor() {
        this.menuShowList = [];
    }

    init() {
        this.listParents();
        this.renderParents();
        this.bindClickEvent();
    }

    listParents() {
        for (let i = 0; i < data.length; i++) {
            this.menuShowList.push(data[i]);
        }
    }

    renderParents() {
        let _template = "", classList;
        for (let i = 0; i < this.menuShowList.length; i++) {
            if(this.menuShowList[i].title == 'About') {
                classList = "menu-item main collapsed selected";
            } else {
                classList = "menu-item main collapsed";
            }
            _template = _template + `<div class="${classList}">
                            <div>
                                <span>${this.menuShowList[i].title}</span>
                            </div>`;
            if (this.menuShowList[i].child && this.menuShowList[i].child.length > 0) {
                _template = _template + this.renderChild(this.menuShowList[i].child) + `</div>`;
            } else {
                _template = _template + `</div>`;
            }
        }
        let _doc = document.getElementById('menu-list');
        _doc.innerHTML = _template;
    }

    renderChild(iChild) {
        let _template = "";
        for (let i = 0; i < iChild.length; i++) {
            _template = _template + `<div class="menu-item sub" >
                            <div>
                                <span>${iChild[i].title}</span>
                            </div>
                        </div>`;
        }
        return _template;
    }

    bindClickEvent() {
        let self = this;
        self.children = document.querySelectorAll(".menu-item.sub");
        self.parent = document.querySelectorAll(".menu-item.main");
        for (let i = 0; i < self.children.length; i++) {
            self.children[i].onclick = function (event) {
                var val = document.getElementById("headerContent");
                val.innerText = event.currentTarget.innerText;
                self.highlightSelected(event);
            };
        }
        for (let i = 0; i < self.parent.length; i++) {
            self.parent[i].onclick = function (event) {
                debugger;
                self.addClass('.menu-item.main', 'collapsed');
                self.removeClass(event.currentTarget, 'collapsed');
                var val = document.getElementById("headerContent");
                if(event.currentTarget.children.length == 1) {
                    self.highlightSelected(event);
                    val.innerText = event.currentTarget.innerText
                }
                console.error(val)
            };
        }
    }
    addClass(elements, myClass) {
        if (typeof (elements) === 'string') {
            elements = document.querySelectorAll(elements);
        }
        
        for (var i = 0; i < elements.length; i++) {
            if ((' ' + elements[i].className + ' ').indexOf(' ' + myClass + ' ') < 0) {
                elements[i].className += ' ' + myClass;
            }
        }
    }

    removeClass(elements, myClass) {
        var reg = new RegExp('(^| )' + myClass + '($| )', 'g');
        elements.className = elements.className.replace(reg, ' ');
    }

    highlightSelected (iEvent) {
        let elements = document.querySelectorAll('.selected');
        for(let i=0;i<elements.length;i++) {
            this.removeClass(elements[i],'selected')
        }
        this.addClass([iEvent.currentTarget],'selected')
    }
}

var _menuInstance = new menuComponent();
_menuInstance.init();