// 有关“拆分”模板的简介，请参阅以下文档:
// http://go.microsoft.com/fwlink/?LinkID=232447
(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;
    
    app.addEventListener("activated", function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {

            if (args.detail.arguments !== "") {
                var activationArguments = args.detail.arguments;
                var ID = parseInt(activationArguments.slice(3, activationArguments.length));
                WinJS.UI.processAll().then(function () {
                    Data.init()
                        .then(function () {
                            return Data.GetById(ID, "notes");
                        })
                        .then(function (data) {
                            if (data == undefined) return;
                            nav.history.current = { location: Application.navigator.home, initialState: {} };
                            nav.navigate("/Pages/Note/Note.html", { item: data });
                        });
                });

            }

            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: 此应用程序刚刚启动。在此处初始化
                //您的应用程序。
            } else {
                // TODO: 此应用程序已从挂起状态重新激活。
                // 在此处恢复应用程序状态。
            }
            
            if (app.sessionState.history) {
                nav.history = app.sessionState.history;
            }
            args.setPromise(WinJS.UI.processAll().then(function () {
                if (nav.location) {
                    nav.history.current.initialPlaceholder = true;
                    return nav.navigate(nav.location, nav.state);
                } else {
                    return nav.navigate(Application.navigator.home);
                }
            }));

        }else if(args.detail.kind === activation.ActivationKind.search) {
            args.setPromise(WinJS.UI.processAll().then(function () {
                if (!nav.location) {
                    nav.history.current = { location: Application.navigator.home, initialState: {} };
                }
                return nav.navigate("/pages/search/searchResults.html", { queryText: args.detail.queryText });
            }));
        }
    });

    app.oncheckpoint = function (args) {
        // TODO: 即将挂起此应用程序。在此处保存
        //需要持续挂起的任何状态。如果您需要
        //在应用程序挂起之前完成异步操作
        //，请调用 args.setPromise()。
        app.sessionState.history = nav.history;
    };

    app.onsettings = function (e) {
        e.detail.applicationcommands = {
            "privacyDiv": { title: "Privacy Policy", href: "/Pages/Setting/privacyplicy.html" },
            "backup": { title: "Import / Export", href: "/Pages/Setting/Backup/Backup.html" }
        };
        WinJS.UI.SettingsFlyout.populateSettings(e);
    }

    app.start();
})();
