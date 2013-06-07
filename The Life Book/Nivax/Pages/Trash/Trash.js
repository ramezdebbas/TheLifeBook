// 有关“页面控制”模板的简介，请参阅以下文档:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";
    var ListData;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    WinJS.UI.Pages.define("/Pages/Trash/Trash.html", {
        // 每当用户导航至此页面时都要调用此功能。它
        // 使用应用程序的数据填充页面元素。
        ready: function (element, options) {
            var listView = element.querySelector("#TrashList").winControl;
            var z = this;
            Data.init()
                .then(function () {
                    Util.info("init database successful");
                    return Data.getTrashNotesDes();
                })
                .then(function (data) {
                    ListData = data;
                    listView.itemTemplate = element.querySelector(".notetemplate");
                    listView.onselectionchanged = z._itemSelected.bind(z);
                    z._initializeLayout(Windows.UI.ViewManagement.ApplicationView.value);
                    z._initializeUI(element);
                }); 
        },

        unload: function () {
            // TODO: 响应导航到其他页。
        },

        /*UI init*/

        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            var listView = document.querySelector("#TrashList").winControl;
            if (lastViewState !== viewState) {
                if (lastViewState === appViewState.snapped || viewState === appViewState.snapped) {
                    var handler = function (e) {
                        listView.removeEventListener("contentanimating", handler, false);
                        e.preventDefault();
                    }
                    listView.addEventListener("contentanimating", handler, false);
                

                    this._initializeLayout(viewState);
                }
            }
        },

        _initializeLayout: function (viewState) {
            var listView = document.querySelector("#TrashList").winControl;
            if (viewState == appViewState.snapped) {
                listView.itemDataSource = ListData.dataSource;
                listView.layout = new WinJS.UI.ListLayout();
            } else {
                listView.itemDataSource = ListData.dataSource;
                listView.layout = new WinJS.UI.GridLayout();
            }
        },

        _initializeUI: function (element) {
            this._bindAppBarCmd();
        },

        /*listview event*/
        
        _itemSelected: function (args) {
            if (document.querySelector("#NavBar")) {
                var NavBar = document.querySelector("#NavBar").winControl;
                NavBar.disabled = true;
            }
            if (document.querySelector("#AppBar")) {
                var AppBar = document.querySelector("#AppBar").winControl;
            }
            var listView = document.querySelector("#TrashList").winControl;
            var selectionCount = listView.selection.count();
            if (selectionCount > 0) {
                AppBar.showCommands([cmdRestore]);
                AppBar.sticky = true;
                AppBar.show();
            } else {
                AppBar.hideCommands([cmdRestore]);
                AppBar.sticky = false;
                AppBar.hide();
                NavBar && (NavBar.disabled = false);
            }
    
        },

        /*App bar event*/
        _bindAppBarCmd: function () {
            var AppBar = document.querySelector("#AppBar").winControl;
            AppBar.addEventListener("beforehide", this.beforehideappbar.bind(this));
            AppBar.hideCommands([cmdRestore]);
            document.getElementById("cmdRestore").addEventListener("click", this.doClickRestore.bind(this), false);
            document.getElementById("cmdClear").addEventListener("click", this.doClickClear.bind(this), false);
            document.getElementById("Homebutton").addEventListener("click", this.doClickHome.bind(this), false);
        },

        doClickHome: function () {
            WinJS.Navigation.back();
        },
        beforehideappbar: function () {
            var ListView = document.querySelector("#TrashList").winControl;
            ListView.selection.clear();
        },
        
        doClickRestore: function () {
            var ListView = document.querySelector("#TrashList").winControl;
            var selectionCount = ListView.selection.count();
            if (selectionCount > 0) {
                ListView.selection.getItems().then(function (currentSelection) {
                    Util.debug(currentSelection.length);
                    var ids = [];
                    for (var i = 0, len = currentSelection.length; i < len; i++) {
                        ids.push(currentSelection[i].data.id);
                    }
                    Data.MoveNotesToList(ids, "").then(function () {
                        for (var i = currentSelection.length - 1; i >= 0; i--) {
                            ListData.splice(currentSelection[i].index, 1);
                        }
                    });
                });
            }
        },
        doClickClear: function () {
            var msg = new Windows.UI.Popups.MessageDialog("Delete all notes in the trash?");
            msg.commands.append(new Windows.UI.Popups.UICommand("Delete all", function (command) {
                Data.ClearTrash().done(function () {
                    ListData.splice(0, ListData._currentKey);
                });
            }));
            msg.commands.append(new Windows.UI.Popups.UICommand("Cancel", function (command) { }));
            msg.showAsync();
        }

    });
})();
