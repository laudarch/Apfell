// ############# PAYLOADS SECTION ###############################33
var payloads = []; //all services data
var show_autogenerated = false;
var payloads_table = new Vue({
    el: '#payloads_table',
    data: {
        payloads,
        show_autogenerated
    },
    methods: {
        delete_button: function(p){
            $( '#payloadDeleteModal' ).modal('show');
            $( '#payloadDeleteSubmit' ).unbind('click').click(function(){
                if ($( '#payloadDeleteFile' ).is(":checked")){
                    httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/payloads/" + p.uuid + "/1", delete_callback, "DELETE", null);
                }
                else{
                    httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/payloads/" + p.uuid + "/0", delete_callback, "DELETE", null);
                }
            });
        },
        show_uuid_button: function(p){
            alert(p.uuid);
        }
    },
    delimiters: ['[[',']]']
});
function delete_callback(response){
	data = JSON.parse(response);
	if(data['status'] == 'success'){
		var i = 0;
		for( i = 0; i < payloads.length; i++){
		    if(payloads[i].uuid == data['uuid']){
		        break;
		    }
		}
		payloads.splice(i, 1);
	}
	else{
		//there was an error, so we should tell the user
		alert("Error: " + data['error']);
	}
}
function startwebsocket_payloads(){
	var ws = new WebSocket('{{ws}}://{{links.server_ip}}:{{links.server_port}}/ws/payloads/current_operation');
	ws.onmessage = function(event){
		if(event.data != ""){
			pdata = JSON.parse(event.data);
			payloads.push(pdata);
			
		}
	}
	ws.onclose = function(){
		//console.log("payloads socket closed");
	}
	ws.onerror = function(){
		//console.log("payloads socket errored");
	}
	ws.onopen = function(){
		//console.log("payloads socket opened");
	}
}
startwebsocket_payloads();
function toggle_all_button(){
    payloads_table.show_autogenerated = !payloads_table.show_autogenerated;
}

// #################### PAYLOADTYPE AND COMMAND SECTION ###############################
var payloadtypes = [];
var payloadtypeCreateWrapperSelected = false;
var payloadtypes_table = new Vue({
    el: '#payloadtypes_table',
    data:{
        payloadtypes,
    },
    methods: {
        delete_payloadtype_button: function(p){
            $( '#payloadtypeDeleteModal' ).modal('show');
            $( '#payloadtypeDeleteSubmit' ).unbind('click').click(function(){
            var fromDisk = 0;
                if( $('#payloadtypeDeleteFromDisk').is(":checked")){
                    fromDisk = 1;
                }
                httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/payloadtypes/" + p.ptype + "/" + fromDisk, delete_payloadtype_callback, "DELETE", null);
            });
        },
        edit_payloadtype_button: function(p){
            $('#payloadtypeEditPtype').val(p['ptype']);
            $('#payloadtypeEditPtype').prop("disabled", true); //don't want this to be edited
            $('#payloadtypeEditFileExtension').val(p['file_extension']);
            $('#payloadtypeEditCompileCommand').val(p['compile_command']);
            if(p['wrapper']){
                $('#payloadtypeEditWrapper').prop('checked', true);
                $('#payloadtypeEditWrappedEncodingType').val(p['wrapped_encoding_type']);
                $('#payloadtypeEditWrappedPayloadType').val(p['wrapped_payload_type']);
                $('#payloadtypeEditWrappedEncodingTypeRow').attr("hidden", false);
                $('#payloadtypeEditWrappedPayloadTypeRow').attr("hidden", false);
            }
            else{
                $('#payloadtypeEditWrapper').prop('checked', false);
                $('#payloadtypeEditWrappedEncodingTypeRow').attr("hidden", true);
                $('#payloadtypeEditWrappedPayloadTypeRow').attr("hidden", true);
            }
            $( '#payloadtypeEditWrapper').unbind('click').click(function(){
                if( $('#payloadtypeEditWrapper').is(":checked")){
                    $('#payloadtypeEditWrappedEncodingTypeRow').attr("hidden", false);
                    $('#payloadtypeEditWrappedPayloadTypeRow').attr("hidden", false);
                }
                else{
                    $('#payloadtypeEditWrappedEncodingTypeRow').attr("hidden", true);
                    $('#payloadtypeEditWrappedPayloadTypeRow').attr("hidden", true);
                }
            });
            $('#payloadtypeEditModal').modal('show');
            $( '#payloadtypeEditSubmit' ).unbind('click').click(function(){
                var data = {"file_extension": $( '#payloadtypeEditFileExtension').val(),
                "compile_command": $( '#payloadtypeEditCompileCommand').val()};
                data["wrapper"]= $('#payloadtypeEditWrapper').is(":checked");
                if($('#payloadtypeEditWrapper').is(":checked")){
                    data["wrapped_encoding_type"]= $('#payloadtypeEditWrappedEncodingType').val();
                    data["wrapped_payload_type"]= $('#payloadtypeEditWrappedPayloadType').val();
                }
                var file = document.getElementById('payloadtypeEditUploadFiles');
                if(file.files.length > 0){
                    var filedata = file.files;
                    uploadFileAndJSON("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/payloadtypes/" + p['ptype'], edit_payloadtype_callback, filedata, data, "PUT");
                    file.value = file.defaultValue;
                }
                else{
                    httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/payloadtypes/" + p['ptype'], edit_payloadtype_callback, "PUT", data);
                }
            });
        },
        add_commands_button: function(p){
            $( '#commandAddModal' ).modal('show');
            $( '#commandAddSubmit' ).unbind('click').click(function(){
                //base64 encode the code before submitting it or base64 encode the file
                var file = document.getElementById('commandAddFile');
                var code = "";
                var data = {'cmd': $('#commandAddCmd').val(), 'help_cmd': $('#commandAddHelpCmd').val(),
                'description': $('#commandAddDescription').val(), 'payload_type': p.ptype, 'code': ""};

                data['needs_admin'] = $('#commandAddNeedsAdmin').is(":checked");
                if(file.files.length > 0){
                    var filedata = file.files[0];
                    uploadFileAndJSON("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/", add_command_callback, filedata, data, "POST");
                    file.value = file.defaultValue;
                }
                else{
                    code = btoa( $( '#commandAddCode' ).val() );
                    data['code'] = code;
                    httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/", add_command_callback, "POST", data);
                }
                // now clear all the boxes
                $('#commandAddDescription').val("");
                $('#commandAddHelpCmd').val("");
                $('#commandAddNeedsAdmin').prop('checked', false);
                $('#commandAddCode').val("");
                $('#commandAddCmd').val("");

            });
            $( '#commandAddCancel' ).unbind('click').click(function(){
                var file = document.getElementById('commandAddFile');
                file.value = file.defaultValue;
            });
            $( '#commandAddCheckCmd' ).unbind('click').click(function(){
                // make a request out to see if the command exists already or if the file exists (and command was deleted)?
                var data = httpGetSync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/" + p.ptype + "/check/" + $('#commandAddCmd').val());
                data_json = JSON.parse(data);
                if(data_json.hasOwnProperty("cmd")){
                    $('#commandAddDescription').val(data_json['description']);
                    $('#commandAddDescription').prop('disabled', true);
                    $('#commandAddHelpCmd').val(data_json['help_cmd']);
                    $('#commandAddHelpCmd').prop('disabled', true);
                    $('#commandAddNeedsAdmin').prop('checked', data['needs_admin']);
                    $('#commandAddNeedsAdmin').prop('disabled', true);
                }
                else{
                    //be sure to make everything editable and clear it all
                    $('#commandAddDescription').val("");
                    $('#commandAddDescription').prop('disabled', false);
                    $('#commandAddHelpCmd').val("");
                    $('#commandAddHelpCmd').prop('disabled', false);
                    $('#commandAddNeedsAdmin').prop('checked', false);
                    $('#commandAddNeedsAdmin').prop('disabled', false);
                }
                if(data_json.hasOwnProperty("code")){
                    $('#commandAddCode').val(atob(data_json['code']));
                    //$('#commandAddCode').attr('disabled', true);
                }
                else{
                    $('#commandAddCode').val("");
                    $('#commandAddCode').attr('disabled', false);
                }
                if(data_json.hasOwnProperty("params")){
                    add_command_parameters_table.add_command_parameters = data_json['params'];
                }
                else{
                    add_command_parameters_table.add_command_parameters = [];
                }
            });

        },
        edit_commands_button: function(p){
            var types = "";
            for(var i = 0; i < p.commands.length; i++){
                types = types + '<option value="' + p.commands[i]['cmd'] + '">' + p.commands[i]['cmd'] + '</option>';
            };
            $( '#commandEditCmd' ).html(types);
            set_edit_command_params( $('#commandEditCmd').val(), p );
            $( '#commandEditModal' ).modal('show');
            $( '#commandEditCmd' ).unbind('change').change(function(){
                // Populate the various parts of the modal on select changes
                cmd = $(this).find("option:selected").attr('value');
                set_edit_command_params(cmd, p);

            });
            $( '#commandEditSubmit' ).unbind('click').click(function(){
                //check for changes between what we have and what's in the fields, only submit those differences
                //an uploaded file takes precidence over text in the text block
                var cmd = $('#commandEditCmd').val();
                data = {'help_cmd': $('#commandEditHelpCmd').val(), 'description': $('#commandEditDescription').val(),
                'needs_admin': $('#commandEditNeedsAdmin').is(":checked")};
                for(var i = 0; i < payloadtypes_table.payloadtypes.length; i++){
                    if(payloadtypes_table.payloadtypes[i]['ptype'] == p['ptype']){
                        payloadtypes_table.payloadtypes[i]['commands_set'].forEach(function(command){
                          if (command.cmd == cmd) {
                            var file = document.getElementById('commandEditFile');
                            if(file.files.length > 0){
                                var filedata = file.files[0];
                                uploadFileAndJSON("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/" + command.id, null, filedata, data, "PUT");
                                file.value = file.defaultValue;
                            }
                            else{
                                code = btoa( $( '#commandEditCode' ).val() );
                                data['code'] = code;
                                httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/" + command.id, null, "PUT", data);
                            }
                            //Now handle sending updates for the command parameters at the bottom
                            for(var j = 0; j < command_parameters_table.command_parameters.length; j++){
                                data = command_parameters_table.command_parameters[j];
                                if(data.hasOwnProperty('id')){
                                    //this means it's a parameter we had before, so send an update
                                    httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/" + command.id + "/parameters/" + data['id'], null, "PUT", data);
                                }
                                else if(data['name'] != ""){
                                    //make sure they entered something for the name, and send a POST to create the parameter
                                    httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/" + command.id + "/parameters", null, "POST", data);
                                }
                            }
                          }
                        });
                    }
                }
            });
            $( '#commandEditCancel' ).unbind('click').click(function(){
                var file = document.getElementById('commandEditFile');
                file.value = file.defaultValue;
            });
        },
        remove_commands_button: function(p){
            var types = "";
            for(var i = 0; i < p.commands.length; i++){
                types = types + '<option value="' + p.commands[i]['cmd'] + '">' + p.commands[i]['cmd'] + '</option>';
            };
            $( '#commandRemoveList' ).html(types);
            $( '#commandRemoveModal' ).modal('show');
            $( '#commandRemoveSubmit' ).unbind('click').click(function(){
                commands_to_remove = $( '#commandRemoveList' ).val();
                for(var i = 0; i < commands_to_remove.length; i++){
                    for(var j = 0; j < p.commands.length; j++){
                        if(p.commands[j]['cmd'] == commands_to_remove[i]){
                            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/" + p.commands[j]['id'], remove_commands_callback, "DELETE", null);
                        }
                    }
                }
            });
        },
        export_commands_button: function(p){
            window.open("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/" + p.ptype + "/export", '_blank').focus();
        },
        import_commands_button: function(p){

            $( '#commandImportModal' ).modal('show');
            $( '#commandImportSubmit' ).unbind('click').click(function(){
                var file = document.getElementById('commandImportFile');
                var filedata = file.files[0];
                uploadFile("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/import", import_commands_button_callback, filedata);
            });
        }
    },
    delimiters: ['[[', ']]']
});
function set_edit_command_params(command, curr_payload){
    for(var i = 0; i < payloadtypes_table.payloadtypes.length; i++){
        if(payloadtypes_table.payloadtypes[i]['ptype'] == curr_payload['ptype']){
            payloadtypes_table.payloadtypes[i]['commands_set'].forEach(function(cmd){
              if (cmd.cmd == command) {
                //found the right command to use to populate
                $( '#commandEditDescription' ).val(cmd.description);
                $( '#commandEditHelpCmd' ).val(cmd.help_cmd);
                $( '#commandEditNeedsAdmin' ).prop('checked', cmd.needs_admin);
                httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/" + cmd.id + "/code/string", set_edit_code_callback, "GET", null);
                // Get the associated command parameters for this command
                httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/" + cmd.id + "/parameters/", set_edit_command_parameters, "GET", null);
              }
            });
        }
    }
}
function set_edit_code_callback(response){
    $( '#commandEditCode' ).val(atob(response));
}
var command_parameters = [];
var command_parameters_table = new Vue({
    el: '#edit_command_parameters_table',
    data: {
        command_parameters
    },
    methods: {
        remove_parameter_button: function(i, p){
            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/" + i.command + "/parameters/" + i.id, edit_remove_parameter, "DELETE", null);
        },
        add_parameter_button: function(){
            this.command_parameters.push({"name": "", "isString": false, "isCredential": false, "hint": "", "required": false});
        }
    },
    delimiters: ['[[',']]']
});
function set_edit_command_parameters(response){
    data = JSON.parse(response);
    if(data.hasOwnProperty('status')){
        alert(data['error']);
    }
    else{
        command_parameters_table.command_parameters = data;
    }
}
function edit_remove_parameter(response){
    data = JSON.parse(response);
    if(data['status'] == "success"){
        //now find the parameter and remove it from our array
        for(var i = 0; i < command_parameters_table.command_parameters.length; i++){
            if(command_parameters_table.command_parameters[i]['id'] == data['id']){
                command_parameters_table.command_parameters.splice(i,1);
            }
        }
    }
    else{
        alert(data['error']);
    }
}
var add_command_parameters = [];
var add_command_parameters_table = new Vue({
    el: '#add_command_parameters_table',
    data: {
        add_command_parameters
    },
    methods: {
        remove_parameter_button: function(i, p){
            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/" + i.command + "/parameters/" + i.id, edit_remove_parameter, "DELETE", null);
        },
        add_parameter_button: function(){
            this.add_command_parameters.push({"name": "", "isString": false, "isCredential": false, "hint": "", "required": false});
        }
    },
    delimiters: ['[[',']]']
});
function add_command_callback(response){
    cdata = JSON.parse(response);
    if(cdata['status'] != "success"){
        alert(cdata['error']);
    }
    //Now handle sending updates for the command parameters at the bottom
    for(var j = 0; j < add_command_parameters_table.add_command_parameters.length; j++){
        var data = add_command_parameters_table.add_command_parameters[j];
        if(data['name'] != ""){
            //make sure they entered something for the name, and send a POST to create the parameter
            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/commands/" + cdata['id'] + "/parameters", null, "POST", data);
        }
    }
    add_command_parameters_table.add_command_parameters = [];
}
function remove_commands_callback(response){
    var data = JSON.parse(response);
    if(data['status'] == "success"){
        // remove the command from the appropriate payload_type commands listing
        for(var i = 0; i < payloadtypes_table.payloadtypes.length; i++){
            if(payloadtypes_table.payloadtypes[i]['ptype'] == data['payload_type']){
                payloadtypes_table.payloadtypes[i]['commands_set'].forEach(function(cmd){
                  if (cmd.cmd == data['cmd']) {
                    payloadtypes_table.payloadtypes[i]['commands_set'].delete(cmd);
                    Vue.set(payloadtypes_table.payloadtypes[i], 'commands', Array.from(payloadtypes_table.payloadtypes[i]['commands_set']));
                  }
                });

            }
        }
    }
    else{
        alert(data['error']);
    }
};
function import_commands_button_callback(response){
    var new_window = window.open("", "_blank");
    new_window.document.write(response);
    new_window.focus();
};
function delete_payloadtype_callback(response){
    data = JSON.parse(response);
    if(data['status'] == 'success'){
        // we need to remove the corresponding payload type from the UI
        for(var i = 0; i < payloadtypes_table.payloadtypes.length; i++){
            if(payloadtypes_table.payloadtypes[i]['ptype'] == data['ptype']){
                payloadtypes_table.payloadtypes.splice(i, 1);
                return;
            }
        }
    }
    else{
        alert("Error: " + data['error']);
    }
}
function edit_payloadtype_callback(response){
    data = JSON.parse(response);
    if(data['status'] == "success"){
        for(var i = 0; i < payloadtypes_table.payloadtypes.length; i++){
            if(payloadtypes_table.payloadtypes[i]['ptype'] == data['ptype']){
                Vue.set(payloadtypes_table.payloadtypes, i, data);
                //payloadtypes_table.payloadtypes[i] = data;
                return;
            }
        }
    }
    else{
        alert("Error: " + data['error']);
    }
};
var gotCommandData = false;
function startwebsocket_payloadtypes(){
	var ws = new WebSocket('{{ws}}://{{links.server_ip}}:{{links.server_port}}/ws/payloadtypes');
	ws.onmessage = function(event){
		if(event.data != ""){
			pdata = JSON.parse(event.data);
			payloadtypes_table.payloadtypes.push(pdata);
		}
		else{
		    if(!gotCommandData){
		        gotCommandData = true;
		        startwebsocket_commands();
		    }
		}
	}
	ws.onclose = function(){
		//console.log("payloads socket closed");
	}
	ws.onerror = function(){
		//console.log("payloads socket errored");
	}
	ws.onopen = function(){
		//console.log("payloads socket opened");
	}
};
startwebsocket_payloadtypes();

function startwebsocket_commands(){
	var ws = new WebSocket('{{ws}}://{{links.server_ip}}:{{links.server_port}}/ws/commands');
	ws.onmessage = function(event){
		if(event.data != ""){
			cdata = JSON.parse(event.data);
			// now add the command data to the appropriate payload type
			for(var i = 0; i < payloadtypes_table.payloadtypes.length; i++){
			    if(payloadtypes_table.payloadtypes[i]['ptype'] == cdata['payload_type']){
			        // now that you have the right payloadtype, see if it has a commands set already created
			        if(!payloadtypes_table.payloadtypes[i]['commands_set']){
			            // it doesn't have a set yet, so create one
			            payloadtypes_table.payloadtypes[i]['commands_set'] = new Set();
			        }
			        payloadtypes_table.payloadtypes[i]['commands_set'].add(cdata);
			        Vue.set(payloadtypes_table.payloadtypes[i], 'commands', Array.from(payloadtypes_table.payloadtypes[i]['commands_set']));
			        //payloadtypes_table.payloadtypes[i]['commands'] = Array.from(payloadtypes_table.payloadtypes[i]['commands_set']);
			    }
			}
			//payloadtypes_table.payloadtypes.push(pdata);
		}
	}
	ws.onclose = function(){
		//console.log("payloads socket closed");
	}
	ws.onerror = function(){
		//console.log("payloads socket errored");
	}
	ws.onopen = function(){
		//console.log("payloads socket opened");
	}
};
function create_payloadtype_callback(response){
    data = JSON.parse(response);
    if(data['status'] == 'error'){
        alert(data['error']);
    }
}

function create_payloadtype_button(){
    $( '#payloadtypeCreatePtype' ).val('');
    $( '#payloadtypeCreateFileExtension' ).val('');
    $( '#payloadtypeCreateCompileCommand' ).val('');
    if( $('#payloadtypeCreateWrapper').is(":checked")){
        $( '#payloadtypeCreateWrapper' ).click();
    }
    $( '#payloadtypeCreateModal' ).modal('show');
    $( '#payloadtypeCreateWrapper').unbind('click').click(function(){
        if( $('#payloadtypeCreateWrapper').is(":checked")){
            $('#payloadtypeCreateWrappedEncodingTypeRow').prop("hidden", false);
            $('#payloadtypeCreateWrappedPayloadTypeRow').prop("hidden", false);
        }
        else{
            $('#payloadtypeCreateWrappedEncodingTypeRow').prop("hidden", true);
            $('#payloadtypeCreateWrappedPayloadTypeRow').prop("hidden", true);
        }
    });
    $( '#payloadtypeCreateSubmit' ).unbind('click').click(function(){
        var data = {"ptype": $( '#payloadtypeCreatePtype' ).val(),
        "file_extension": $( '#payloadtypeCreateFileExtension').val(),
        "compile_command": $( '#payloadtypeCreateCompileCommand').val()};
        data["wrapper"]= $('#payloadtypeCreateWrapper').is(":checked");
        if($('#payloadtypeCreateWrapper').is(":checked")){
            data["wrapped_encoding_type"]= $('#payloadtypeCreateWrappedEncodingType').val();
            data["wrapped_payload_type"]= $('#payloadtypeCreateWrappedPayloadType').val();
        }
        var file = document.getElementById('payloadtypeCreateUploadFiles');
        if(file.files.length > 0){
            var filedata = file.files;
            uploadFileAndJSON("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/payloadtypes/", null, filedata, data, "POST");
            file.value = file.defaultValue;
        }
        else{
            httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/payloadtypes/", create_payloadtype_callback, "POST", data);
        }
    });
};
function set_wrapped_payload_type_options(response){
    var types = JSON.parse(response);
    var option_string = "";
    for(var i = 0; i < types.length; i++){
        option_string = option_string + "<option name='" + types[i]['ptype'] + "'>" + types[i]['ptype'] + "</option>";
    }
    $('#payloadtypeCreateWrappedPayloadType').html(option_string);
    $('#payloadtypeEditWrappedPayloadType').html(option_string);
};
httpGetAsync("{{http}}://{{links.server_ip}}:{{links.server_port}}{{links.api_base}}/payloadtypes/", set_wrapped_payload_type_options, "GET", null);