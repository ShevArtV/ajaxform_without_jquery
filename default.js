const AjaxForm = {

    initialize: function (afConfig) {
        let forms = document.querySelectorAll(afConfig['formSelector']);


        forms.forEach(function (el) {
            el.addEventListener('submit', function (e) {
                e.preventDefault();
                if (beforeSubmit(e.target)) {
                    beforeSerialize(e.target, e.submitter);
                    let params = new FormData(e.target);
                    params.append('pageId', afConfig['pageId']);
                    sendAjax(afConfig['actionUrl'], params, success, e.target);
                }
            });
            el.addEventListener('reset', function (e) {
                if (AjaxForm.Message != 'undefined') {
                    AjaxForm.Message.close();
                }
                let currentErrors = el.querySelectorAll('.error');
                if (currentErrors.length) {
                    currentErrors.forEach(resetErrors);
                }
            });
        });

        // сбрасываем ошибки
        function resetErrors(e) {
            let elem = e.target || e;
            elem.classList.remove('error');
            if (elem.name) {
                document.querySelector('.error_' + elem.name).innerHTML = '';
            }
        }

        // функция переписанная на чистом js из оригинального файла
        // для чего она не знаю
        function beforeSerialize(form, submitter) {
            let submitVarInput = form.querySelector('input[type="hidden"][name="' + submitter.name + '"]');
            if (!submitVarInput) {
                submitVarInput = document.createElement('input');
                submitVarInput.setAttribute('type', 'hidden');
                submitVarInput.setAttribute('name', submitter.name);
                submitVarInput.setAttribute('value', submitter.value);
                form.appendChild(submitVarInput);
            }
        }

        // функция выполняемая перед отправкой
        function beforeSubmit(form) {
            if (typeof (afValidated) != 'undefined' && afValidated == false) {
                return false;
            }
            let currentErrors = form.querySelectorAll('.error');
            if(currentErrors.length) currentErrors.forEach(resetErrors);
            return true;
        }

        // функция успешной отправки
        function success(response, status, xhr, form) {
            let event = new CustomEvent('af_complete', {
                cancelable: true,
                bubbles: true,
                detail: {response: response, status: status, xhr: xhr, form: form},
            });
            let cancelled = document.dispatchEvent(event);
            if(cancelled){
                if (!response.success) {
                    if (AjaxForm.Message != 'undefined') {
                        AjaxForm.Message.error(response.message);
                    }

                    if (response.data) {
                        let key, value, focused;
                        for (key in response.data) {
                            let span = form.querySelector('.error_' + key);
                            if (response.data.hasOwnProperty(key)) {
                                if (!focused) {
                                    form.querySelector('[name="' + key + '"]').focus();
                                    focused = true;
                                }
                                value = response.data[key];
                                if (span) {
                                    span.innerHTML = value;
                                    span.classList.add('error');
                                }

                                form.querySelector('[name="' + key + '"]').classList.add('error');
                            }
                        }

                        form.querySelectorAll('.error').forEach(el => {
                            if (el.name) {
                                el.addEventListener('keydown', resetErrors);
                            }
                        });
                    }
                }
                else {
                    if (AjaxForm.Message != 'undefined') {
                        AjaxForm.Message.success(response.message);
                    }

                    form.querySelectorAll('.error').forEach(el => {
                        if (el.name) {
                            el.removeEventListener('keydown', resetErrors);
                        }
                    });
                    if (afConfig['clearFieldsOnSuccess']) {
                        form.reset();
                    }
                    //noinspection JSUnresolvedVariable
                    if (typeof (grecaptcha) != 'undefined') {
                        //noinspection JSUnresolvedVariable
                        grecaptcha.reset();
                    }
                }
            }
        }

        // функция отправки ajax
        function sendAjax(path, params, callback, form) {
            const request = new XMLHttpRequest();
            const url = path || document.location.href;
            request.open('POST', url, true);
            request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            request.responseType = 'json';
            request.addEventListener('readystatechange', function () {
                if (request.readyState === 4 && request.status === 200) {
                    form.querySelectorAll('input,textarea,select,button').forEach(el => el.disabled = false);
                    callback(request.response, request.response.success, request, form);
                } else {
                    form.querySelectorAll('input,textarea,select,button').forEach(el => el.disabled = true);
                }
            });
            request.send(params);
        }
    }
}