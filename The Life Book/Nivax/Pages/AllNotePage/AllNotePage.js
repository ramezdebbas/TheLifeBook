
; (function () {
    "use strict";
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var ui = WinJS.UI;
    var GroupedData;
    var datainitpromise;
    var ALLNOTEPAGE = WinJS.UI.Pages.define("/Pages/AllNotePage/AllNotePage.html", {
        // 每当用户导航至此页面时都要调用此功能。它
        // 使用应用程序的数据填充页面元素。
        ready: function (element, options) {
            var listView = element.querySelector("#zoomedInListView").winControl;
            var keyView = element.querySelector("#zoomedOutListView").winControl;
            var z = this;
            datainitpromise = Data.init()
                .then(function () {
                    Util.info("init database successful");
                    return Data.getAllNotesDes();
                })
                .then(function (groupdata) {
                    GroupedData = groupdata
                    listView.oniteminvoked = z._itemInvoked.bind(z);
                    listView.onselectionchanging = z._itemSelecting.bind(z);
                    listView.onselectionchanged = z._itemSelected.bind(z);
                    listView.itemTemplate = element.querySelector(".notetemplate");
                    listView.groupHeaderTemplate = element.querySelector(".headerTemplate");
                    keyView.itemTemplate = element.querySelector(".semanticZoomTemplate");
                    z._initializeLayout(Windows.UI.ViewManagement.ApplicationView.value);
                    z._initializeUI(element);
                });
        },

        unload: function () {
            // TODO: 响应导航到其他页。
            datainitpromise.cancel();
        },

        /*UI init*/
        _initializeUI:function(element){
            this._bindAppBarCmd();
        },


        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />
            var listView = document.querySelector("#zoomedInListView").winControl;
            var keyView = document.querySelector("#zoomedOutListView").winControl;
            if (lastViewState !== viewState) {
                if (lastViewState === appViewState.snapped || viewState === appViewState.snapped) {
                    var handler1 = function (e) {
                        listView.removeEventListener("contentanimating", handler1, false);
                        e.preventDefault();
                    }
                    var handler2 = function (e) {
                        keyView.removeEventListener("contentanimating", handler2, false);
                        e.preventDefault();
                    }
                    listView.addEventListener("contentanimating", handler1, false);
                    keyView.addEventListener("contentanimating", handler2, false);

                    this._initializeLayout(viewState);
                }
            }
            
        },

        _initializeLayout: function (viewState) {
            var listView = document.querySelector("#zoomedInListView").winControl;
            var keyView = document.querySelector("#zoomedOutListView").winControl;
            if (viewState == appViewState.snapped) {
                listView.itemDataSource = GroupedData.dataSource;
                listView.groupDataSource = GroupedData.groups.dataSource;
                listView.itemTemplate = this.ItemTemplateRenderer;
                listView.groupHeaderTemplate = this.HeaderTemplateRenderer;
                listView.layout = new ui.ListLayout({ groupHeaderPosition: "top" });
                //listView.layout = new ui.GridLayout({ groupHeaderPosition: "top" });

                keyView.itemDataSource = GroupedData.groups.dataSource;
                keyView.itemTemplate = this.keyTemplateRenderer;
                keyView.layout = new ui.ListLayout();
            } else {
                listView.itemDataSource = GroupedData.dataSource;
                listView.groupDataSource = GroupedData.groups.dataSource;
                listView.itemTemplate = this.ItemTemplateRenderer;
                listView.groupHeaderTemplate = this.HeaderTemplateRenderer;
                listView.layout = new ui.GridLayout({ groupHeaderPosition: "top" });
       
                keyView.itemDataSource = GroupedData.groups.dataSource;
                keyView.itemTemplate = this.keyTemplateRenderer;
                keyView.layout = new ui.GridLayout();
                
            }


        },

        /*ItemTemplateRender*/

        keyTemplateRenderer:function(itemPromise){
            return itemPromise.then(function (currentItem) {
                var content;
                content = document.querySelector(".semanticZoomTemplate");
                var result = content.cloneNode(true);
                result.attributes.removeNamedItem("data-win-control");
                result.attributes.removeNamedItem("style");
                result.style.overflow = "hidden";
                result.querySelector(".semanticZoomItem-Text").textContent = currentItem.key;
                if (currentItem.key == "Today") {
                    result.querySelector(".semanticZoomItem-count").textContent = currentItem.groupSize - 1 + " Notes";
                } else {
                    result.querySelector(".semanticZoomItem-count").textContent = currentItem.groupSize + " Notes";
                }

                return result;
            });
        },

        HeaderTemplateRenderer: function (itemPromise) {
            return itemPromise.then(function (currentItem) {
                var content;
                content = document.querySelector(".headerTemplate");
                var result = content.cloneNode(true);
                result.attributes.removeNamedItem("data-win-control");
                result.attributes.removeNamedItem("style");
                result.style.overflow = "hidden";
                Util.debug(currentItem);
                result.querySelector(".group-title").textContent = currentItem.key + " /";
                if (currentItem.key == "Today") {
                    result.querySelector(".group-count").textContent = currentItem.groupSize-1  + " Notes";
                } else {
                    result.querySelector(".group-count").textContent = currentItem.groupSize + " Notes";
                }
                

                return result;
                

            });

        },


        ItemTemplateRenderer:function(itemPromise){
            var z = this;
            return itemPromise.then(function (currentItem) {
                var content;
                content = document.querySelector(".notetemplate");
                var result = content.cloneNode(true);

                
                result.attributes.removeNamedItem("data-win-control");
                result.attributes.removeNamedItem("style");
                result.style.overflow = "hidden";
                if (currentItem.index < 1) {
                    result.className = "newnote notes";
                    result.querySelector(".note").innerHTML = window.toStaticHTML("<div class='newnote-overlay'>New Note</div>");
                } else {
                    result.className = "othernote notes";
                    result.querySelector(".note").style.backgroundColor = currentItem.data.color;
                    result.querySelector(".item-title").textContent = currentItem.data.title;
                    result.querySelector(".item-content").textContent =Util.FormatToCleanText(currentItem.data.content);
                    result.querySelector(".item-date").textContent = currentItem.data.updated;
                }

                return result;

            });

        },
        snapViewItemTemplateRenderer:function(itemPromise){

        },


        /*listview event*/
        _itemSelecting: function (args) {
            var indexes = args.detail.newSelection.getIndices();
            for (var i = 0, len = indexes.length; i < len; i++) {
                if (indexes[i] < 1) {
                    args.preventDefault();
                    break;
                }
            }
        },
        _itemSelected: function (args) {
            if (document.querySelector("#AppBar")) {
                var AppBar = document.querySelector("#AppBar").winControl;
                AppBar.disabled = false;
            }
            if (document.querySelector("#NavBar")) {
                var NavBar = document.querySelector("#NavBar").winControl;
                NavBar.disabled = true;
            }
            var ListView = document.querySelector("#zoomedInListView").winControl;
            var selectionCount = ListView.selection.count();
            var indices = ListView.selection.getIndices();
            if (selectionCount == 1) {
                AppBar.showCommands([cmdEdit, cmdDelete, cmdPin]);
                AppBar.sticky = true;
                AppBar.show();
            } else if (selectionCount == 0) {
                AppBar.hideCommands([cmdEdit, cmdDelete, cmdPin]);
                AppBar.sticky = false;
                AppBar.hide();
                if (NavBar) NavBar.disabled = false;
                AppBar.disabled = true;
            } else {
                AppBar.hideCommands([cmdEdit, cmdPin]);
                AppBar.sticky = true;
                AppBar.show();
            }


        },
        _itemInvoked: function (args) {
            //var AppBar = document.querySelector("#AppBar").winControl;
            //AppBar.showCommands([cmdEdit, cmdDelete, cmdPin]);
            //AppBar.hide();
            //var ListView = document.querySelector("#zoomedInListView").winControl;
            //ListView.selection.clear();
            if (args.detail.itemIndex == 0) {
                this.doClickAdd();
            } else {
                args.detail.itemPromise.then(function (item) {
                    WinJS.Navigation.navigate("/Pages/Note/Note.html", { item: item.data, index: args.detail.itemIndex });
                });
            }
        },

        /*Appbar event*/

        _bindAppBarCmd: function () {
            var AppBar = document.querySelector("#AppBar").winControl;
            AppBar.addEventListener("beforehide", this.beforehideappbar);
            document.getElementById("cmdDelete").addEventListener("click", this.doClickDelete, false);
            document.getElementById("recylebutton").addEventListener("click", this.doClickTrash, false);
            document.getElementById("cmdEdit").addEventListener("click", this.doClickEdit.bind(this), false);
            document.getElementById("cmdPin").addEventListener("click", this.doClickPin.bind(this), false);
        },

        beforehideappbar: function () {
            var ListView = document.querySelector("#zoomedInListView").winControl;
            ListView.selection.clear();
        },
        
        doClickPin: function () {
            var listView = document.querySelector("#zoomedInListView").winControl;
            listView.selection.getItems().then(function (currentSelection) {
                Util.PinByDescription(currentSelection[0].data, document.getElementById("cmdPin").getBoundingClientRect());
            });
        },
        doClickEdit:function(){
            var listView = document.querySelector("#zoomedInListView").winControl;
            listView.selection.getItems().then(function (currentSelection) {
                WinJS.Navigation.navigate("/Pages/Note/Note.html", { item: currentSelection[0].data, index: currentSelection[0].index });
            });
        },
        doClickTrash: function () {
            WinJS.Navigation.navigate("/Pages/Trash/Trash.html");
        },

        doClickAdd: function () {
            Util.info("Add a new note.");
            Data.addNote({ title: "New Note" }).then(function (id) {
                var note = {
                    id: id,
                    type:'newnote'
                }
                WinJS.Navigation.navigate("/Pages/Note/Note.html", { item: note, index: 0 });
            });
        },
        
        doClickDelete: function () {
            var listView = document.querySelector("#zoomedInListView").winControl;
            var selectionCount = listView.selection.count();
            if (selectionCount > 0) {
                listView.selection.getItems().then(function (currentSelection) {
                    Util.debug(currentSelection);
                    var ids = [];
                    for (var i = 0, len = currentSelection.length; i < len; i++) {
                        ids.push(currentSelection[i].data.id);
                    } 
                    Data.MoveNotesToList(ids, "trash").then(function () {
                        for(var i=currentSelection.length-1;i>=0;i--){
                            GroupedData.splice(currentSelection[i].index, 1);
                        }
                    });

                });
            }
        }

    });

    Windows.Storage.ApplicationData.current.addEventListener("datachanged",newfromshare.bind(this));

    function newfromshare(){
        if(WinJS.Navigation.location == "/Pages/AllNotePage/AllNotePage.html"){
            document.querySelector(".pagecontrol").winControl.updateLayout(document, Windows.UI.ViewManagement.ApplicationView.value);
        } else if (WinJS.Navigation.location == "/Pages/Note/Note.html") {
            document.querySelector(".pagecontrol").winControl.updateLayout(document, Windows.UI.ViewManagement.ApplicationView.value);
        }
    }


})();
