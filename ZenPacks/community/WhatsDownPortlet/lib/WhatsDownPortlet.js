var WhatsDownDatasource = Class.create();

WhatsDownDatasource.prototype = {
    __class__ : "YAHOO.zenoss.portlet.WhatsDownDatasource",
    __init__: function(settings) {
        this.baseLoc = settings.baseLoc;
    },
    fill: function(contents) {
        var columnDefs = contents.columnDefs;
        var dataSource = contents.dataSource;
        var oConfigs = {};
        if (this.dataTable) {
            oRequest = {'results':dataSource.liveData}
            this.dataTable.onDataReturnInitializeTable(null, oRequest);
        } else {
            addElementClass(this.body, 'yui-skin-sam');
            this.dataTable = new YAHOO.widget.DataTable(
                this.body.id, columnDefs, dataSource, oConfigs);
        }
    },
	render: function() {
        if (this.isDirty) {
            this.body = DIV({'class':'portlet-body','id':this.id+'_body'},
                            "Portlet Content");
            this.resizehandle = DIV(
                {'class':'resize-handle','id':this.id+'_resizer'}, null);
            this.titlecont = SPAN({'class':'nodrag'}, null);
            this.settingsToggle = DIV({'class':'portlet-settings-toggle'}, null);
            connect(this.settingsToggle, 'onclick', this.toggleSettings);
            this.refreshRateInput = INPUT({'value':this.refreshTime}, null);
            this.titleInput = INPUT({'value':this.title}, null);
            this.settingsSlot = DIV({'id':this.id+'_customsettings',
                'class':'settings-controls'},
               [
                DIV({'class':'portlet-settings-control'}, [
                DIV({'class':'control-label'}, 'Title'),
                 this.titleInput
               ]),
               DIV({'class':'portlet-settings-control'}, [
                DIV({'class':'control-label'}, 'Refresh Rate'),
                 this.refreshRateInput
               ])]);
            this.destroybutton = A(
                {'class':'portlet-settings-control'}, 'Remove Portlet');
            this.savesettingsbutton = BUTTON(
                {'class':'portlet-settings-control'}, 'Save Settings');
            connect(this.savesettingsbutton, 'onclick', this.submitSettings);
            connect(this.destroybutton, 'onclick', this.destroy);
            this.buttonsSlot = DIV({'id':this.id+'_buttonslot',
                'class':'settings-controls buttonslot'},
                    [this.destroybutton, this.savesettingsbutton]);
            this.settingsPane = DIV({'id':this.id+'_settings',
                'class':'portlet-settings'},
                [DIV({'class':'settings-controls'},
                    [this.settingsSlot, this.buttonsSlot]),
                    DIV({'style':'clear:both'}, '')]);
            this.container = DIV({'class':'zenoss-portlet','id':this.id},
               DIV({'class':'zenportlet'},
                [
                 DIV({'class':'portlet-header'},
                  DIV({'class':'tabletitle-container','id':this.handleid},
                   DIV({'class':'tabletitle-left'},
                    DIV({'class':'tabletitle-right'},
                     DIV({'class':'tabletitle-center'},
                     [this.titlecont,this.settingsToggle]
                 ))))),
                DIV(null, this.settingsPane),
                DIV({'class':'portlet-body-outer'},
                    [this.body,this.resizehandle])
                ]));
            this.isDirty = false;
            setStyle(this.body, {'height':this.bodyHeight+'px'});
            hideElement(this.settingsPane);
        }
        return this.container;
    }

}

YAHOO.zenoss.portlet.WhatsDownDatasource = WhatsDownDatasource;

var WhatsDownPortlet = Subclass.create(YAHOO.zenoss.portlet.Portlet);
WhatsDownPortlet.prototype = {
    __class__:"YAHOO.zenoss.portlet.WhatsDownPortlet",
    __init__: function(args) {
        args = args || {};
        id = 'id' in args? args.id : getUID('WhatsDown');
        title = 'title' in args? args.title:"Whats Down";
        bodyHeight = 'bodyHeight' in args? args.bodyHeight : 200;
        refreshTime = 'refreshTime' in args? args.refreshTime : 60;
        datasource = 'datasource' in args? args.datasource :
            new YAHOO.zenoss.portlet.WhatsDownDatasource({

                            // Query string will never be that long, so GET
                            // is appropriate here
                            method:'GET',

                            // Here's where you call the back end method
                            url:'/zport/getJSONDownDevices',

                            // Set up the path argument and set a default ReportClass
                            queryArguments: {'path':'/Devices'}
                        });



        this.superclass.__init__(
            {id:id, title:title, 
             datasource:datasource, 
             refreshTime: refreshTime,
             bodyHeight:bodyHeight}
        );
        this.buildSettingsPane();
    },
    buildSettingsPane: function() {
        s = this.settingsSlot;
        
         // Make a function that, given a string, creates an option
         // element that is either selected or not based on the
         // settings you've already got.
        var getopt = method(this, function(x) {
             opts = {'value':x};
             path = this.datasource.queryArguments.path;
             if (path==x) opts['selected']=true;
             return OPTION(opts, x); });
             
        var getopt_prodstate = method(this, function(x) {
             opts = {'value':x[1]};
             prodstate = this.datasource.queryArguments.prodstate;
             if (prodstate==x[1]) opts['selected']=true;
             return OPTION(opts, x[0]); });

         // Create the select element
         this.pathselect = SELECT(null, null);
         this.prodselect = SELECT(null, null);

         // A function to create the option elements from a list of
         // strings
         var createOptions = method(this, function(jsondoc) {
             forEach(jsondoc, method(this, function(x) {
                 opt = getopt(x);
                 appendChildNodes(this.pathselect, opt);
             }));
         });
                 
         var createOptions_prodstate = method(this, function(jsondoc) {
             forEach(jsondoc, method(this, function(x) {
                 opt = getopt_prodstate(x);
                 appendChildNodes(this.prodselect, opt);
             }));
         });

         // Wrap these elements in a DIV with the right CSS class,
         // and give it a label, so it looks pretty
         mycontrol = DIV({'class':'portlet-settings-control'}, 
         	[ DIV({'class':'control-label'}, 'Zenoss Device Class'), this.pathselect ],
	        [ DIV({'class':'control-label'}, 'Minimum Production State'), this.prodselect ] );

         // Put the thing in the settings pane
         appendChildNodes(s, mycontrol);

         // Go get the strings that will populate your select element.
         d = loadJSONDoc('/zport/dmd/Devices/getOrganizerNames');
         d.addCallback(method(this, createOptions));
         d1 = loadJSONDoc('/zport/dmd/getProdStateConversions');
         d1.addCallback(method(this,createOptions_prodstate));
    },
     // submitSettings puts the current values of the elements in
     // the settingsPane into their proper places.
     submitSettings: function(e, settings) {

         // Get your ReportClass value and put it in the datasource
         var mypath = this.pathselect.value;
         var prodstate = this.prodselect.value;
         this.datasource.queryArguments.path = mypath;
         this.datasource.queryArguments.prodstate = prodstate;

         // Call Portlet's submitSettings
         this.superclass.submitSettings(e, {'queryArguments':
             {'path': mypath, 'prodstate': prodstate}
         });
     }
 }
YAHOO.zenoss.portlet.WhatsDownPortlet = WhatsDownPortlet;
