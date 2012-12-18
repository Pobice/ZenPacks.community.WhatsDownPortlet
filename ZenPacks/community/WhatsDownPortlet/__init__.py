import Globals
import os.path
import re

skinsDir = os.path.join(os.path.dirname(__file__), 'skins')
from Products.CMFCore.DirectoryView import registerDirectory
if os.path.isdir(skinsDir):
    registerDirectory(skinsDir, globals())

from Products.ZenModel.ZenossSecurity import ZEN_COMMON
from Products.ZenUtils.Utils import zenPath
from Products.ZenModel.ZenPack import ZenPackBase
#for finding device and events
from Products.Zuul import getFacade
#from Products.ZenUtils.ZenScriptBase import ZenScriptBase

class ZenPack(ZenPackBase):
		def _registerWhatsDownPortlet(self, app):
                    zpm = app.zport.ZenPortletManager
		    portletsrc=os.path.join(os.path.dirname(__file__),'lib','WhatsDownPortlet.js')
		    #Its a dirty hack - register_portlet will add ZenPath one more time
		    #and we don't want to hardcode path explicitly here like in other ZenPacks
		    p=re.compile(zenPath(''))
		    portletsrc=p.sub('',portletsrc)
                    zpm.register_portlet(
                        sourcepath=portletsrc,
                        id='WhatsDownPortlet',
                        title='Whats Down',
                        permission=ZEN_COMMON)

		def install(self, app):
                    ZenPackBase.install(self, app)
                    self._registerWhatsDownPortlet(app)
    
                def upgrade(self, app):
                    ZenPackBase.upgrade(self, app)
                    self._registerWhatsDownPortlet(app)
        
                def remove(self, app, leaveObjects=False):
                    ZenPackBase.remove(self, app, leaveObjects)
                    zpm = app.zport.ZenPortletManager
                    zpm.unregister_portlet('WhatsDownPortlet')

import json
def getJSONDownDevices(self, path='', prodstate=''):
            """
            Given a report class path, returns a list of links to child
            reports in a format suitable for a TableDatasource.
            """
            # This function will be monkey-patched onto zport, so
            # references to self should be taken as referring to zport

            # Add the base path to the path given
            path = '/zport/dmd/Devices/' + path.strip('/')
            if prodstate=='':
            	prodstate='1000'
            	
            # Create the empty structure of the response object
            response = { 'columns': ['Device','Failed Pings'], 'data': [] }

            # Retrieve the ReportClass object for the path given. If
            # nothing can be found, return an empty response
            try:
                deviceClass = self.dmd.unrestrictedTraverse(path)
            except KeyError:
                return json.dumps(response)

            zep_facade = getFacade('zep')
            #dmd = ZenScriptBase(connect=True, noopts=True).dmd
            issues = zep_facade.getDevicePingIssues()
            for x in issues:
            	#[0]=devicename,[2]=failed ping count
            	#d=dmd.Devices.findDevice(x[0])
            	#if d.getPingStatus()>0 and d.productionState>=int(prodstate) :			
            	row = { 'Device': x[0], 'Failed Pings': x[2] }
            	response['data'].append(row)			
	   
            # Get the list of devices - old way
            #devices = deviceClass.getSubDevices()
            #for d in devices:
            #    if d.getPingStatus()>0 and d.productionState>=int(prodstate) :
	    	#		row = { 'Device': d.getPrettyLink(), 'Failed Pings': d.getPingStatusNumber() }
            #    	response['data'].append(row)   
            # Serialize the response and return it
            return json.dumps(response)

# Monkey-patch onto zport
from Products.ZenModel.ZentinelPortal import ZentinelPortal
ZentinelPortal.getJSONDownDevices = getJSONDownDevices

