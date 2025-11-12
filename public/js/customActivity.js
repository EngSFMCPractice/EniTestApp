define([
    'postmonger'
], function (
    Postmonger
) {
    'use strict';

    var connection = new Postmonger.Session();
    //var authTokens = {};
    var payload = {};
    $(window).ready(onRender);

    connection.on('initActivity', initialize);
    //connection.on('requestedTokens', onGetTokens);
    connection.on('clickedNext', save);
   
    function onRender() {
        connection.trigger('ready');
        //connection.trigger('requestTokens');
    }

    function addLoader(target) {
        var loaderOverlay = document.createElement('div');
        loaderOverlay.id = 'loader-overlay';
        var loader = document.createElement('div');
        loader.id = 'loader';

        var targetBox = document.querySelector(target);

        targetBox.appendChild(loaderOverlay);
        targetBox.appendChild(loader);
    }

    function removeLoader(target) {
        var targetBox = document.querySelector(target);

        var loaderOverlay = targetBox.querySelector('#loader-overlay');
        var loader = targetBox.querySelector('#loader');

        if (loader && loaderOverlay) {
            loaderOverlay.parentNode.removeChild(loaderOverlay);
            loader.parentNode.removeChild(loader);
        }
    }
    

    function initialize(data) {
        
        addLoader('#loader-wrap');

        if (data) {
            payload = data;
        }
        
        var hasInArguments = Boolean(
            payload['arguments'] &&
            payload['arguments'].execute &&
            payload['arguments'].execute.inArguments &&
            payload['arguments'].execute.inArguments.length > 0
        );

        var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};

        console.log('*** initialize inArguments ***');
        console.log(inArguments);

        $.each(inArguments, function (index, inArgument) {
            $.each(inArgument, function (key, value) {
                if(key == 'Switch'){
                    if(value == 'on'){
                        $('#wordpress-postbin').prop("checked", true);
                    } else {
                        $('#wordpress-postbin').prop("checked", false);
                    }
                }else{
                    $('#' + key).val(value);
                }

            });
        });

        connection.trigger('requestTokens');
        connection.on('requestedTokens', function(tokens) {

            if (tokens) {
                axios.post(window.location.origin + '/jb/getPush', {token: tokens.fuel2token}, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(function(res) {

                    let payloadPush = res.data;
                    let selectPushHTML = '';
                    
                    if(payloadPush.length > 0){
                        payloadPush.forEach(item => {
                        if (inArguments && inArguments[0]) {
                               selectPushHTML += '<option value="' + item.id + '" data-message="' + item.views.push.meta.options.customBlockData["display:message"] + '"' + 
                             (inArguments[0].Msg_Push_Element == item.id ? ' selected' : '') + '>' + item.name + '</option>';
                        } else {
                                selectPushHTML += '<option value="' + item.id + '" data-message="' + item.views.push.meta.options.customBlockData["display:message"] + '">' + item.name + '</option>';
             }
                        });

                        $('#Msg_Push_Element').html(selectPushHTML);
                        removeLoader('#loader-wrap');

                    }else{
                        $('#Msg_Push_Element').prop('disabled', true);
                        $('#no-push-found').html('Add at least one push to proceed with the configuration.');
                        removeLoader('#loader-wrap');
                    }

                })
                .catch(function(e) {
                    console.error('Errore nella chiamata API:', e);
                });
            }
        });

        connection.trigger('requestSchema');
        connection.on('requestedSchema', function (data) {
            const schema = data['schema'];
            let entrySource = {};
            let placeholders = '';

            for (let i = 0, l = schema.length; i < l; i++) {
                entrySource[schema[i].name] = '{{' + schema[i].key + '}}';
                placeholders += '<option value="'+schema[i].name+'" >'+schema[i].name+'</option>';
            }

            if(Object.values(entrySource).length == 0){
                $('#placeholder-text').prop('disabled', true);
                $('#insert-placeholder').addClass('disabled');
                $('#no-de-selected').html('(Set an entry source to see data fields)');
            }else{
                if(placeholders){
                    $('#placeholder-text').html(placeholders);
                }
            }


            payload['arguments'].execute.inArguments[1] = entrySource;
        });

        connection.trigger('updateButton', {
            button: 'next',
            text: 'Done',
            visible: true
        });

    }
/*
    function onGetTokens(tokens) {
        if(tokens){
            authTokens = tokens;
        }
    }
*/

   function validateForm() {
    let form = document.querySelector('#push-info');
    let isValid = true;

    var PushElement = form.querySelector('#Msg_Push_Element');
    var PushElementFeedback = form.querySelector('#Msg_Push_Element + .invalid-feedback');

    if (PushElement.value.length === 0) {
        PushElementFeedback.textContent = 'This field is required.';
        PushElement.classList.add('is-invalid');
        isValid = false;
    } else {
        PushElementFeedback.textContent = '';
        PushElement.classList.remove('is-invalid');
    }

    return isValid;
}

    
    function save() {

        if (!validateForm()) {
            connection.trigger('ready');
        }else{
            let pushInfo = new FormData($('#push-info')[0]);

            payload['arguments'].execute.inArguments[0] = {
                Msg_Push_Element: pushInfo.get('Msg_Push_Element'),
                Push_Name: $('#Msg_Push_Element option:selected').text(),
                Push_Message: $('#Msg_Push_Element option:selected').data('message'),
                Switch: pushInfo.get('wordpress-postbin')
            };
    
            //payload['arguments'].execute.inArguments[2] = { tokens: authTokens };
    
            payload['metaData'].isConfigured = true;
    
            connection.trigger('updateActivity', payload);
        }

    }


});
