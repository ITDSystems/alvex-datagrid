/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 * Copyright (C) 2012 ITD Systems.
 *
 * This file is part of Alvex
 *
 * Alvex is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alvex is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alvex. If not, see <http://www.gnu.org/licenses/>.
 */

// Ensure root object exists
if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};
}
 
/**
 * SimpleDialog module.
 * 
 * @namespace Alvex
 * @class Alvex.SimpleDialog
 */
(function()
{
   var Dom = YAHOO.util.Dom,
      Selector = YAHOO.util.Selector,
      KeyListener = YAHOO.util.KeyListener;
   
   Alvex.SimpleDialog = function(htmlId, components)
   {
      components = YAHOO.lang.isArray(components) ? components : [];
      
      this.isFormOwner = false;

      if (htmlId !== "null")
      {
         /* Defer showing dialog when in Forms Service mode */
         this.formsServiceDeferred = new Alfresco.util.Deferred(["onTemplateLoaded", "onBeforeFormRuntimeInit"],
         {
            fn: this._showDialog,
            scope: this
         });

         YAHOO.Bubbling.on("beforeFormRuntimeInit", this.onBeforeFormRuntimeInit, this);
      }
      
      return Alvex.SimpleDialog.superclass.constructor.call(
         this,
         "Alvex.SimpleDialog",
         htmlId,
         ["button", "container", "connection", "json", "selector"].concat(components));
   };

   YAHOO.extend(Alvex.SimpleDialog, Alfresco.component.Base,
   {
      /**
       * Dialog instance.
       * 
       * @property dialog
       * @type YAHOO.widget.Dialog
       */
      dialog: null,

      /**
       * Form instance.
       * 
       * @property form
       * @type Alfresco.forms.Form
       */
      form: null,
      
      /**
       * Whether form instance is our own, or created from FormUI component
       *
       * @property isFormOwner
       * @type Boolean
       */
      isFormOwner: null,

       /**
        * Object container for initialization options
        */
       options:
       {
          /**
           * URL which will return template body HTML
           *
           * @property templateUrl
           * @type string
           * @default null
           */
          templateUrl: null,

          /**
           * URL of the form action
           *
           * @property actionUrl
           * @type string
           * @default null
           */
          actionUrl: null,

          /**
           * ID of form element to receive focus on show
           *
           * @property firstFocus
           * @type string
           * @default null
           */
          firstFocus: null,

          /**
           * Object literal representing callback upon successful operation.
           *   fn: function, // The handler to call when the event fires.
           *   obj: object, // An object to pass back to the handler.
           *   scope: object // The object to use for the scope of the handler.
           *
           * @property onSuccess
           * @type object
           * @default null
           */
          onSuccess:
          {
             fn: null,
             obj: null,
             scope: window
          },

          /**
           * Message to display on successful operation
           *
           * @property onSuccessMessage
           * @type string
           * @default ""
           */
          onSuccessMessage: "",
          
          /**
           * Object literal representing callback upon failed operation.
           *   fn: function, // The handler to call when the event fires.
           *   obj: object, // An object to pass back to the handler.
           *   scope: object // The object to use for the scope of the handler.
           *
           * @property onFailure
           * @type object
           * @default null
           */
          onFailure:
          {
             fn: null,
             obj: null,
             scope: window
          },

          /**
           * Message to display on failed operation
           *
           * @property onFailureMessage
           * @type string
           * @default ""
           */
          onFailureMessage: "",
          
          /**
           * Object literal representing function to intercept dialog just before shown.
           *   fn: function(formsRuntime, Alvex.SimpleDialog), // The handler to call when the event fires.
           *   obj: object, // An object to pass back to the handler.
           *   scope: object // The object to use for the scope of the handler. SimpleDialog instance if unset.
           *
           * @property doBeforeDialogShow
           * @type object
           * @default null
           */
          doBeforeDialogShow:
          {
             fn: null,
             obj: null,
             scope: null
          },
          
          /**
           * Object literal representing function to set forms validation.
           *   fn: function, // The handler to call when the event fires.
           *   obj: object, // An object to pass back to the handler.
           *   scope: object // The object to use for the scope of the handler. SimpleDialog instance if unset.
           *
           * @property doSetupFormsValidation
           * @type object
           * @default null
           */
          doSetupFormsValidation:
          {
             fn: null,
             obj: null,
             scope: null
          },
          
          /**
           * Object literal representing function to intercept form before submit.
           *   fn: function, // The override function.
           *   obj: object, // An object to pass back to the function.
           *   scope: object // The object to use for the scope of the function.
           *
           * @property doBeforeFormSubmit
           * @type object
           * @default null
           */
          doBeforeFormSubmit:
          {
             fn: null,
             obj: null,
             scope: window
          },
          
          /**
           * Object literal containing the abstract function for intercepting AJAX form submission.
           *   fn: function, // The override function.
           *   obj: object, // An object to pass back to the function.
           *   scope: object // The object to use for the scope of the function.
           * 
           * @property doBeforeAjaxRequest
           * @type object
           * @default null
           */
          doBeforeAjaxRequest:
          {
             fn: null,
             obj: null,
             scope: window
          },
          
          /**
           * Width for the dialog
           *
           * @property width
           * @type integer
           * @default 30em
           */
          width: "30em",
          
          /**
           * Clear the form before showing it?
           *
           * @property: clearForm
           * @type: boolean
           * @default: false
           */
          clearForm: false,
          
          /**
           * Destroy the dialog instead of hiding it?
           *
           * @property destroyOnHide
           * @type boolean
           * @default false
           */
          destroyOnHide: false,

          /**
           * Should we wait for Forms Service or just act on our own?
           *
           * @property formsServiceAvailable
           * @type boolean
           * @default true
           */
          formsServiceAvailable: true,

          /**
           * Special flag if we behave as usual or ignore hide events partially - used to workaroud #163
           *
           * @property requireHideACK
           * @type boolean
           * @default false
           */
          requireHideACK: false
       },

      /**
       * Main entrypoint to show the dialog
       *
       * @method show
       */
      show: function AmSD_show()
      {
         if (this.dialog)
         {
            this._showDialog();
         }
         else
         {
            var data =
            {
               htmlid: this.id
            };
            if (this.options.templateRequestParams)
            {
                data = YAHOO.lang.merge(this.options.templateRequestParams, data);
            }
            Alfresco.util.Ajax.request(
            {
               url: this.options.templateUrl,
               dataObj:data,
               successCallback:
               {
                  fn: this.onTemplateLoaded,
                  scope: this
               },
               failureMessage: "Could not load dialog template from '" + this.options.templateUrl + "'.",
               scope: this,
               execScripts: true
            });
         }
         return this;
      },
      
      /**
       * Show the dialog and set focus to the first text field
       *
       * @method _showDialog
       * @private
       */
      _showDialog: function AmSD__showDialog()
      {
         Dom.removeClass(this.id + '-dialogTitle',"hidden");
		 
		 var form = Dom.get(this.id + "-form");
         
         // Make sure forms without Share-specific templates render roughly ok
         Dom.addClass(form, "bd");

         // Custom forms validation setup interest registered?
         var doSetupFormsValidation = this.options.doSetupFormsValidation;
         if (typeof doSetupFormsValidation.fn == "function")
         {
            doSetupFormsValidation.fn.call(doSetupFormsValidation.scope || this, this.form, doSetupFormsValidation.obj);
         }
         
         // Custom forms before-submit interest registered?
         var doBeforeFormSubmit = this.options.doBeforeFormSubmit;
         if (typeof doBeforeFormSubmit.fn == "function")
         {
            this.form.doBeforeFormSubmit = doBeforeFormSubmit;
         }
         else
         {
            // If no specific handler disable buttons before submit to avoid double submits
            this.form.doBeforeFormSubmit =
            {
               fn: function AmSD__defaultDoBeforeSubmit()
               {
                  this.widgets.okButton.set("disabled", true);
                  this.widgets.cancelButton.set("disabled", true);
               },
               scope: this
            };
         }

         // Custom ajax before-request interest registered?
         var doBeforeAjaxRequest = this.options.doBeforeAjaxRequest;
         if (typeof doBeforeAjaxRequest.fn == "function")
         {
            this.form.doBeforeAjaxRequest = doBeforeAjaxRequest;
         }

         if (this.options.actionUrl !== null)
         {
            form.attributes.action.nodeValue = this.options.actionUrl;
         }
         
         if (this.options.clearForm)
         {
            var inputs = Selector.query("input", form),
                  input;
            inputs = inputs.concat(Selector.query("textarea", form));
            for (var i = 0, j = inputs.length; i < j; i++)
            {
               input = inputs[i];
               if(input.getAttribute("type") != "radio" && input.getAttribute("type") != "checkbox" && input.getAttribute("type") != "hidden")
               {
                  input.value = "";                  
               }
            }
         }
         // Custom before show event interest registered?
         var doBeforeDialogShow = this.options.doBeforeDialogShow;
         if (doBeforeDialogShow && typeof doBeforeDialogShow.fn == "function")
         {
             doBeforeDialogShow.fn.call(doBeforeDialogShow.scope || this, this.form, this, doBeforeDialogShow.obj);
         }
         
         // Make sure ok button is in the correct state if dialog is reused  
         if (this.isFormOwner)
         {
            this.widgets.okButton.set("disabled", false);
            this.widgets.cancelButton.set("disabled", false);
         }
         this.form.updateSubmitElements();

         this.dialog.show();

         // Fix Firefox caret issue
         Alfresco.util.caretFix(form);
         
         // We're in a popup, so need the tabbing fix
         this.form.applyTabFix();
         
         // Register the ESC key to close the dialog
         this.widgets.escapeListener = new KeyListener(document,
         {
            keys: KeyListener.KEY.ESCAPE
         },
         {
            fn: function(id, keyEvent)
            {
               this.hide();
            },
            scope: this,
            correctScope: true
         });
         this.widgets.escapeListener.enable();

         // Set focus if required
         if (this.options.firstFocus !== null)
         {
            Dom.get(this.options.firstFocus).focus();
         }
      },

      /**
       * Show the view dialog without any form-related operations
       *
       * @method _showViewDialog
       * @private
       */
      _showViewDialog: function AmSVD__showViewDialog()
      {
         Dom.removeClass(this.id + '-dialogTitle',"hidden");
		 
         // Custom before show event interest registered?
         var doBeforeDialogShow = this.options.doBeforeDialogShow;
         if (doBeforeDialogShow && typeof doBeforeDialogShow.fn == "function")
         {
             doBeforeDialogShow.fn.call(doBeforeDialogShow.scope || this, this.form, this, doBeforeDialogShow.obj);
         }        

         this.dialog.show();
         
         // Register the ESC key to close the dialog
         this.widgets.escapeListener = new KeyListener(document,
         {
            keys: KeyListener.KEY.ESCAPE
         },
         {
            fn: function(id, keyEvent)
            {
               this.options.requireHideACK = false;
               this._hideDialog();
            },
            scope: this,
            correctScope: true
         });
         this.widgets.escapeListener.enable();

      },

      /**
       * Hide the dialog
       *
       * @method hide
       */
      hide: function AmSD_hide()
      {
         this.widgets.escapeListener.disable();
         if (this.dialog)
         {
            this.dialog.hide();
            this.options.requireHideACK = false;
            this._hideDialog();
         }
      },

      /**
       * Hide the dialog, removing the caret-fix patch
       *
       * @method _hideDialog
       * @private
       */
      _hideDialog: function AmSD__hideDialog()
      {
         if( this.options.requireHideACK ) {
            this.dialog.hide();
            return;
         }
         // Unhook close button
         this.dialog.hideEvent.unsubscribe(this.onHideEvent, null, this);

         if (this.widgets.escapeListener)
         {
            this.widgets.escapeListener.disable();
         }
         var form = Dom.get(this.id + "-form");

         // Undo Firefox caret issue
         Alfresco.util.undoCaretFix(form);

         if (this.options.destroyOnHide)
         {
            YAHOO.Bubbling.fire("formContainerDestroyed");
            YAHOO.Bubbling.unsubscribe("beforeFormRuntimeInit", this.onBeforeFormRuntimeInit, this);
            this.dialog.destroy();
            delete this.dialog;
            delete this.widgets;
            if (this.isFormOwner)
            {
               delete this.form;
            }
         }
      },
      
      /**
       * Event handler for container "hide" event.
       * Defer until the dialog itself has processed the hide event so we can safely destroy it later.
       *
       * @method onHideEvent
       * @param e {object} Event type
       * @param obj {object} Object passed back from subscribe method
       */
      onHideEvent: function AmSD_onHideEvent(e, obj)
      {
         //YAHOO.lang.later(0, this, this._hideDialog);
      },
      
      /**
       * Event callback when dialog template has been loaded
       *
       * @method onTemplateLoaded
       * @param response {object} Server response from load template XHR request
       */
      onTemplateLoaded: function AmSD_onTemplateLoaded(response)
      {
         // Inject the template from the XHR request into a new DIV element
         var containerDiv = document.createElement("div");
         containerDiv.innerHTML = response.serverResponse.responseText;

         // The panel is created from the HTML returned in the XHR request, not the container
         var dialogDiv = Dom.getFirstChild(containerDiv);
         while (dialogDiv && dialogDiv.tagName.toLowerCase() != "div")
         {
            dialogDiv = Dom.getNextSibling(dialogDiv);
         }

         // Create and render the YUI dialog
         this.dialog = Alfresco.util.createYUIPanel(dialogDiv,
         {
            width: this.options.width
         });

         // Hook close button
         this.dialog.hideEvent.subscribe(this.onHideEvent, null, this);

         // Are we controlling a Forms Service-supplied form?
         if (Dom.get(this.id + "-form-submit") && this.options.formsServiceAvailable)
         {
            this.isFormOwner = false;
            // FormUI component will initialise form, so we'll continue processing later
            this.formsServiceDeferred.fulfil("onTemplateLoaded");
         }
         else if (!this.options.formsServiceAvailable)
         {
            Dom.addClass(dialogDiv, "bd");

            var form = document.getElementById(this.id + '-form');
            for( var i = 0; i < form.children.length; i++ )
               if( Dom.hasClass(form.children[i], "bdft") )
                  form.children[i].style.display = "none";

            this._showViewDialog();
            YAHOO.Bubbling.fire("formContentReady");
         }
         else
         {
            // OK button needs to be "submit" type
            this.widgets.okButton = Alfresco.util.createYUIButton(this, "ok", null,
            {
               type: "submit"
            });

            // Cancel button
            this.widgets.cancelButton = Alfresco.util.createYUIButton(this, "cancel", this.onCancel);

            // Form definition
            this.isFormOwner = true;
            this.form = new Alfresco.forms.Form(this.id + "-form");
            this.form.setSubmitElements(this.widgets.okButton);
            this.form.setAJAXSubmit(true,
            {
               successCallback:
               {
                  fn: this.onSuccess,
                  scope: this
               },
               failureCallback:
               {
                  fn: this.onFailure,
                  scope: this
               }
            });
            this.form.setSubmitAsJSON(true);
            this.form.setShowSubmitStateDynamically(true, false);

            // Initialise the form
            this.form.init();

            this._showDialog();
         }
      },

      /**
       * Event handler called when the "beforeFormRuntimeInit" event is received.
       *
       * @method onBeforeFormRuntimeInit
       * @param layer {String} Event type
       * @param args {Object} Event arguments
       * <pre>
       *    args.[1].component: Alfresco.FormUI component instance,
       *    args.[1].runtime: Alfresco.forms.Form instance
       * </pre>
       */
      onBeforeFormRuntimeInit: function AmSD_onBeforeFormRuntimeInit(layer, args)
      {
		  if (!this.options.formsServiceAvailable)
			  return;
         var formUI = args[1].component,
            formsRuntime = args[1].runtime;

         this.widgets.okButton = formUI.buttons.submit;
         this.widgets.okButton.set("label", this.msg("button.save"));
         this.widgets.cancelButton = formUI.buttons.cancel;
         this.widgets.cancelButton.set("onclick",
         {
            fn: this.onCancel,
            scope: this
         });
         
         this.form = formsRuntime;
         this.form.setAJAXSubmit(true,
         {
            successCallback:
            {
               fn: this.onSuccess,
               scope: this
            },
            failureCallback:
            {
               fn: this.onFailure,
               scope: this
            }
         });
         
         this.formsServiceDeferred.fulfil("onBeforeFormRuntimeInit");
      },

      /**
       * Cancel button event handler
       *
       * @method onCancel
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onCancel: function AmSD_onCancel(e, p_obj)
      {
         this.hide();
      },

      /**
       * Successful data webscript call event handler
       *
       * @method onSuccess
       * @param response {object} Server response object
       */
      onSuccess: function AmSD_onSuccess(response)
      {
         this.hide();

         if (!response)
         {
            // Invoke the callback if one was supplied
            if (this.options.onFailure && typeof this.options.onFailure.fn == "function")
            {
               this.options.onFailure.fn.call(this.options.onFailure.scope, null, this.options.onFailure.obj);
            }
            else
            {
               Alfresco.util.PopupManager.displayMessage(
               {
                  text: this.options.failureMessage || "Operation failed."
               });
            }
         }
         else
         {
            // Invoke the callback if one was supplied
            if (this.options.onSuccess && typeof this.options.onSuccess.fn == "function")
            {
               this.options.onSuccess.fn.call(this.options.onSuccess.scope, response, this.options.onSuccess.obj);
            }
            else
            {
               Alfresco.util.PopupManager.displayMessage(
               {
                  text: this.options.successMessage || "Operation succeeded."
               });
            }
         }
      },

      /**
       * Failed data webscript call event handler
       *
       * @method onFailure
       * @param response {object} Server response object
       */
      onFailure: function AmSD_onFailure(response)
      {
         // Make sure ok button is in the correct state if dialog is reused
         if (this.isFormOwner)
         {
            this.widgets.okButton.set("disabled", false);
            this.widgets.cancelButton.set("disabled", false);
         }
         this.form.updateSubmitElements();

         // Invoke the callback if one was supplied
         if (typeof this.options.onFailure.fn == "function")
         {
            this.options.onFailure.fn.call(this.options.onFailure.scope, response, this.options.onFailure.obj);
         }
         else
         {
            if (response.json && response.json.message && response.json.status.name)
            {
               Alfresco.util.PopupManager.displayPrompt(
               {
                  title: response.json.status.name,
                  text: response.json.message
               });
            }
            else
            {
               Alfresco.util.PopupManager.displayPrompt(
               {
                  title: this.msg("message.failure"),
                  text: response.serverResponse
               });
            }
         }
      }
   });

   /**
    * Dummy instance to load optional YUI components early.
    * Use fake "null" id, which is tested later in onComponentsLoaded()
   */
   var dummyInstance = new Alvex.SimpleDialog("null");
})();
