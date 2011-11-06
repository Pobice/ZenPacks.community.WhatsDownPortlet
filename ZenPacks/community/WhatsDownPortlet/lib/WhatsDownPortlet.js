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
            new YAHOO.zenoss.portlet.TableDatasource({

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
	        [ DIV({'class':'control-label'}, 'Minimum Production State'), this.prodselect ]
         	);

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
