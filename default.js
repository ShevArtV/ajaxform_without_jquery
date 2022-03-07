class AjaxForm {
    constructor(afConfig) {
        this.forms = document.querySelectorAll(afConfig['formSelector']);
        this.clearFieldsOnSuccess = afConfig['clearFieldsOnSuccess'];

        // adding the necessary handlers
        this.forms.forEach(el => {
            el.addEventListener('submit', e => {
                e.preventDefault();
                if (this.beforeSubmit(e.target)) {
                    this.beforeSerialize(e.target, e.submitter);
                    let params = new FormData(e.target);
                    params.append('pageId', afConfig['pageId']);
                    this.sendAjax(afConfig['actionUrl'], params, this.success.bind(this), e.target);
                }
            });
            el.addEventListener('reset', e => {
                if (AjaxForm.Message != 'undefined') {
                    AjaxForm.Message.close();
                }
                let currentErrors = el.querySelectorAll('.error');
                if (currentErrors.length) {
                    currentErrors.forEach(this.resetErrors);
                }
            });
        });
    }

    resetErrors(e) {
        let elem = e.target || e;
        elem.classList.remove('error');
        if (elem.name) {
            document.querySelector('.error_' + elem.name).innerHTML = '';
        }
    }

    // function rewritten in pure js from the original file
    // i don't know what this function is for
    beforeSerialize(form, submitter) {
        let submitVarInput = form.querySelector('input[type="hidden"][name="' + submitter.name + '"]');
        if (!submitVarInput) {
            submitVarInput = document.createElement('input');
            submitVarInput.setAttribute('type', 'hidden');
            submitVarInput.setAttribute('name', submitter.name);
            submitVarInput.setAttribute('value', submitter.value);
            form.appendChild(submitVarInput);
        }
    }

    beforeSubmit(form) {
        let currentErrors = form.querySelectorAll('.error');
        if (currentErrors.length) currentErrors.forEach(this.resetErrors);
        return true;
    }

    // handler server response
    success(response, status, xhr, form) {
        let event = new CustomEvent('af_complete', {
            cancelable: true,
            bubbles: true,
            detail: {response: response, status: status, xhr: xhr, form: form},
        });
        let cancelled = document.dispatchEvent(event);
        if (cancelled) {
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
                            el.addEventListener('keydown', this.resetErrors);
                        }
                    });
                }
            } else {
                if (AjaxForm.Message != 'undefined') {
                    AjaxForm.Message.success(response.message);
                }

                form.querySelectorAll('.error').forEach(el => {
                    if (el.name) {
                        el.removeEventListener('keydown', this.resetErrors);
                    }
                });
                if (this.clearFieldsOnSuccess) {
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

    sendAjax(path, params, callback, form) {
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