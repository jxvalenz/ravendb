/// <reference path="../../Scripts/typings/bootstrap/bootstrap.d.ts" />
define(["require", "exports", "plugins/router", "durandal/app", "durandal/system", "models/database", "common/raven", "models/document"], function(require, exports, __router__, __app__, __sys__, __database__, __raven__, __document__) {
    var router = __router__;
    var app = __app__;
    var sys = __sys__;

    var database = __database__;
    var raven = __raven__;
    var document = __document__;

    var shell = (function () {
        function shell() {
            var _this = this;
            this.router = router;
            this.databases = ko.observableArray();
            this.activeDatabase = ko.observable().subscribeTo("ActivateDatabase");
            this.itemsToDelete = ko.observableArray();
            this.ravenDb = new raven();
            ko.postbox.subscribe("EditDocument", function (args) {
                return _this.launchDocEditor(args.doc.getId());
            });
            ko.postbox.subscribe("DeleteDocuments", function (args) {
                return _this.showDeletePrompt(args);
            });
        }
        shell.prototype.databasesLoaded = function (databases) {
            var systemDatabase = new database("<system>");
            systemDatabase.isSystem = true;
            this.databases(databases.concat([systemDatabase]));
            this.databases()[0].activate();
        };

        shell.prototype.launchDocEditor = function (docId) {
            router.navigate("#edit?id=" + encodeURIComponent(docId));
        };

        shell.prototype.activate = function () {
            var _this = this;
            router.map([
                { route: '', title: 'Documents', moduleId: 'viewmodels/documents', nav: true },
                { route: 'indexes', title: 'Indexes', moduleId: 'viewmodels/indexes', nav: true },
                { route: 'query', title: 'Query', moduleId: 'viewmodels/query', nav: true },
                { route: 'tasks', title: 'Tasks', moduleId: 'viewmodels/tasks', nav: true },
                { route: 'settings', title: 'Settings', moduleId: 'viewmodels/settings', nav: true },
                { route: 'status', title: 'Status', moduleId: 'viewmodels/status', nav: true },
                { route: 'edit', title: 'Edit Document', moduleId: 'viewmodels/editDocument', nav: false }
            ]).buildNavigationModel();

            // Activate the first page only after we've connected to Raven
            // and selected the first database.
            return this.ravenDb.databases().fail(function (result) {
                sys.log("Unable to connect to Raven.", result);
                app.showMessage("Couldn't connect to Raven. Details in the browser console.", ":-(", ['Dismiss']);
                $('.splash').hide();
            }).then(function (results) {
                return _this.databasesLoaded(results);
            }).then(function () {
                return router.activate();
            });

            return router.activate();
        };

        shell.prototype.showDeletePrompt = function (args) {
            this.deleteCallback = args.callback;
            this.itemsToDelete(args.items);
            $('#DeleteDocumentsConfirmation').modal({
                backdrop: true,
                show: true
            });
        };

        shell.prototype.confirmDelete = function () {
            var _this = this;
            if (this.deleteCallback && this.itemsToDelete().length > 0) {
                var deletedItemIds = this.itemsToDelete().map(function (i) {
                    return i.__metadata.id;
                });
                var deleteTask = this.ravenDb.deleteDocuments(deletedItemIds);
                deleteTask.done(function () {
                    _this.deleteCallback();
                });
                deleteTask.fail(function (response) {
                    sys.log("Failed to delete items", response);
                    app.showMessage("An error occurred deleting the item(s). Details in the browser console.", ":-(");
                });
            }
        };
        return shell;
    })();

    
    return shell;
});
//# sourceMappingURL=shell.js.map
