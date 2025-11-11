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
                                selectPushHTML += '<option value="' + item.id + '"' + (inArguments[0].Msg_Push_Element == item.id ? ' selected' : '') + '>' + item.name + '</option>';
                            } else {
                                selectPushHTML += '<option value="' + item.id + '">' + item.name + '</option>';
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

    function validateForm(){
        let forms = document.querySelectorAll('.needs-validation');
        let isValid = true;

        Array.prototype.slice.call(forms)
            .forEach(function (form) {

                if (!form.checkValidity()) {
                    form.classList.add('was-validated');
                    isValid = false;
                }


                var Title = form.querySelector('#Msg_Title');
                var TitleFeedback = form.querySelector('#Msg_Title + .invalid-feedback');
                if (Title.value.length > 150) {
                    TitleFeedback.textContent = 'Name must be no longer than 150 characters.';
                    Title.classList.add('is-invalid');
                    isValid = false;
                } else if (Title.value.length === 0) {
                    TitleFeedback.textContent = 'This field is required.';
                    Title.classList.add('is-invalid');
                    isValid = false;
                } else {
                    TitleFeedback.textContent = '';
                    Title.classList.remove('is-invalid');
                }

                var Short = form.querySelector('#Msg_Short');
                var ShortFeedback = form.querySelector('#Msg_Short + .invalid-feedback');
                if (Short.value.length > 200) {
                    ShortFeedback.textContent = 'Short message must be no longer than 200 characters.';
                    Short.classList.add('is-invalid');
                    isValid = false;
                } else if (Short.value.length === 0) {
                    ShortFeedback.textContent = 'This field is required.';
                    Short.classList.add('is-invalid');
                    isValid = false;
                } else {
                    ShortFeedback.textContent = '';
                    Short.classList.remove('is-invalid');
                }

                var Long = form.querySelector('#Msg_Long');
                var LongFeedback = form.querySelector('#Msg_Long + .invalid-feedback');
                if (Long.value.length > 1000) {
                    LongFeedback.textContent = 'Long message must be no longer than 1000 characters.';
                    Long.classList.add('is-invalid');
                    isValid = false;
                } else if (Long.value.length === 0) {
                    LongFeedback.textContent = 'This field is required.';
                    Long.classList.add('is-invalid');
                    isValid = false;
                } else {
                    LongFeedback.textContent = '';
                    Long.classList.remove('is-invalid');
                }

                var Name = form.querySelector('#Msg_Name');
                var NameFeedback = form.querySelector('#Msg_Name + .invalid-feedback');
                if (Name.value.length > 100) {
                    NameFeedback.textContent = 'Message name must be no longer than 100 characters.';
                    Name.classList.add('is-invalid');
                    isValid = false;
                } else if (Name.value.length === 0) {
                    NameFeedback.textContent = 'This field is required.';
                    Name.classList.add('is-invalid');
                    isValid = false;
                } else {
                    NameFeedback.textContent = '';
                    Name.classList.remove('is-invalid');
                }

                var MsgID = form.querySelector('#Msg_ID');
                var MsgIDFeedback = form.querySelector('#Msg_ID + .invalid-feedback');
                if (MsgID.value.length > 100) {
                    MsgIDFeedback.textContent = 'Message ID must be no longer than 100 characters.';
                    MsgID.classList.add('is-invalid');
                    isValid = false;
                } else if (MsgID.value.length === 0) {
                    MsgIDFeedback.textContent = 'This field is required.';
                    MsgID.classList.add('is-invalid');
                    isValid = false;
                } else {
                    MsgIDFeedback.textContent = '';
                    MsgID.classList.remove('is-invalid');
                }

                var URL = form.querySelector('#Msg_URL');
                var URLFeedback = form.querySelector('#Msg_URL + .invalid-feedback');
                if (URL.value.length > 1000) {
                    URLFeedback.textContent = 'Message URL must be no longer than 1000 characters.';
                    URL.classList.add('is-invalid');
                    isValid = false;
                } else {
                    URLFeedback.textContent = '';
                    URL.classList.remove('is-invalid');
                }

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
            });
            return isValid;
    }

    
    function save() {

        if (!validateForm()) {
            connection.trigger('ready');
        }else{
            let pushInfo = new FormData($('#push-info')[0]);

            payload['arguments'].execute.inArguments[0] = {
                Msg_Title: pushInfo.get('Msg_Title'),
                Msg_Short: pushInfo.get('Msg_Short'),
                Msg_Long: pushInfo.get('Msg_Long'),
                Msg_Push_Element: pushInfo.get('Msg_Push_Element'),
                Msg_Name: pushInfo.get('Msg_Name'),
                Msg_ID: pushInfo.get('Msg_ID'),
                Msg_URL: pushInfo.get('Msg_URL'),
                Switch: pushInfo.get('wordpress-postbin')
            };
    
            //payload['arguments'].execute.inArguments[2] = { tokens: authTokens };
    
            payload['metaData'].isConfigured = true;
    
            connection.trigger('updateActivity', payload);
        }

    }


});
