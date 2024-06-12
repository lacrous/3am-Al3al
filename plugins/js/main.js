const formValidation = {
    validation : {
        email : function (str){
            return formValidation.formats.emailFormat.test(String(str).toLowerCase());
        },
        double : function (str){
            return !formValidation.validation.empty(str) && !isNaN(str) && ($.isNumeric(str) ||
                formValidation.formats.doubleFormat.test(str));
        },
        number : function (str){
            return !formValidation.validation.empty(str) && !isNaN(str) && $.isNumeric(str);
        },
        phone : function (str){
            return str.length > 9 && !isNaN(str) && $.isNumeric(str);
        },
        empty : function (str) {
            return (!str || str.length === 0 );
        }
    },
    formats : {
        emailFormat : /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
        doubleFormat : /^[0-9]{0,3}(\.[0-9]{0,2})?$/
    }
}

let validated_elem = [];

function form_validate(elem = $("body")) {
    if(validated_elem.includes(elem)){
        elem.find(".validated").unbind();
        elem.find("select.validated").unbind();
        elem.find("input.validated").each(function () {
            $(this).unbind();
        });
        elem.find(".master-delete-btn").unbind();
        elem.find("img.zoom").unbind();
        elem.find(".select-data-effect").unbind();
    }
    elem.find(".validated").bind("validate", function () {
        switch($(this).attr("type")){
            case "checkbox":
            case "radio":
                if($("input[name='" + $(this).attr("name") + "']:checked").length){
                    $(this).removeClass("form-error");
                }else{
                    $(this).addClass("form-error");
                }
                break;
            case "text":
                if($(this).attr("validate-type") !== undefined){
                    switch($(this).attr("validate-type")){
                        case "phone":
                            if(formValidation.validation.phone($(this).val())){
                                $(this).removeClass("form-error");
                            }else{
                                $(this).addClass("form-error");
                            }
                            break;
                        case "double":
                            if(formValidation.validation.double($(this).val())){
                                $(this).removeClass("form-error");
                            }else{
                                $(this).addClass("form-error");
                            }
                            break;
                    }
                    break;
                }
                if(formValidation.validation.empty($(this).val())){
                    $(this).addClass("form-error");
                }else{
                    $(this).removeClass("form-error");
                }
                break;
            case "email":
                if(formValidation.validation.email($(this).val())){
                    $(this).removeClass("form-error");
                }else{
                    $(this).addClass("form-error");
                }
                break;
            default:
                if(formValidation.validation.empty($(this).val())){
                    $(this).addClass("form-error");
                }else{
                    $(this).removeClass("form-error");
                }
        }
        if($(this).closest("form").find(".form-error:not(.nice-select)").length){
            $(this).closest("form").find(".submit-in").find("button").attr("disabled", true);
        }else{
            $(this).closest("form").find(".submit-in").find("button").attr("disabled", false);
        }
    }).trigger("validate");

    elem.find("select.validated").change(function () {
        $(this).trigger("validate");
    });
    elem.find("input.validated, textarea.validated").each(function () {
        switch($(this).attr("type")) {
            case "checkbox":
            case "radio":
                $(this).click(function () {
                    $(this).trigger("validate");
                });
                break;
            default:
                $(this).on("input" ,function () {
                    $(this).trigger("validate");
                });
        }
    });

    elem.find(".system-data-form").each(function () {
        let form = $(this);
        let button = $(this).find(".submit-in").find("button");
        if(button.length){
            button.click(function () {
                form_submit(form, button);
            });
        }
        $(this).unbind("keypress");
        $(this).keypress(function(e) {
            if(e.which === 13) {
                if(!e.shiftKey){
                    if(button.length){
                        if(button.is(":disabled")){
                            return;
                        }
                    }else button = form;
                    form_submit(form, button);
                    e.preventDefault();
                }
            }
        });
    });
    elem.find(".master-delete-btn").bind("activate", function (){
        $(this).click(function (e){
            e.preventDefault();
            let afterLoad = function () {
                window.location.reload();
            };
            try{
                let item = $(this);
                let id = item.attr("data-id");
                let type = item.attr("data-type");
                askDelete(item, id, type, afterLoad);
            }catch (ex){
                if(!confirm("delete item")) return;
                let dom = $(this);
                dom.attr("disabled", true);
                let URL = systemInfo.API_URL + "delete";
                $.ajax({
                    type: "POST",
                    url: URL,
                    data: {
                        id : dom.attr("data-id"),
                        type : dom.attr("data-type"),
                        API_KEY : systemInfo.API_KEY
                    },
                    success: function (msg) {
                        let data = null;
                        try {
                            data = JSON.parse(msg);
                        } catch (err) {
                            dom.attr("disabled", false);
                            fireError('response error');
                            return;
                        }
                        if(data.message === undefined || data.error === undefined){
                            dom.attr("disabled", false);
                            fireError('undefined');
                            return;
                        }
                        if(!data.error){
                            dom.attr("disabled", false);
                            fireError(data.message);
                            return;
                        }
                        if(data.redirect !== undefined){
                            window.location = data.redirect;
                            return;
                        }
                        if(data.reload !== undefined){
                            window.location.reload();
                            return;
                        }
                        if(data.trigger !== undefined){
                            Object.keys(data.trigger).forEach(function(key) {
                                $(key).trigger(data.trigger[key]);
                            });
                        }
                        if(data.html !== undefined){
                            Object.keys(data.html).forEach(function(key) {
                                $(key).html(data.html[key]);
                            });
                        }
                        if(data.attr !== undefined){
                            for (const [dom, value] of Object.entries(data.attr)) {
                                for (const [attribute, newValue] of Object.entries(value)) {
                                    $(dom).attr(attribute, newValue);
                                }
                            }
                        }
                        if(data.enabled === undefined){
                            $(".delete-effects").attr("disabled", true).attr("href", "#").addClass("disabled");
                        }else{
                            dom.attr("disabled", false);
                        }
                        if(afterLoad !== null) afterLoad();
                        dom.attr("disabled", false);
                    },error: function(){
                        dom.attr("disabled", false);
                        fireError('internal error');
                    }
                });
            }
        });
    }).trigger("activate");
    elem.find("img.zoom").click(function () {
        let modalImage = $(".theme-image-modal");
        if(!modalImage.length){
            let modal = '\n' +
                '<div class="modal fade theme-image-modal" tabindex="-1">\n' +
                '    <div class="modal-dialog image-modal modal-lg">\n' +
                '        <div class="modal-content">\n' +
                '            <div class="modal-body">\n' +
                '             <button type="button" class="image-modal-close" data-bs-dismiss="modal" aria-label="Close">\n' +
                '             <span aria-hidden="true">&times;</span>\n' +
                '             </button>\n' +
                '                <img src="" />\n' +
                '           </div>\n' +
                '        </div>\n' +
                '    </div>\n' +
                '</div>';
            $("body").append(modal);
            modalImage = $(".theme-image-modal");
        }
        modalImage.find("img").attr("src", $(this).attr("src"));
        modalImage.modal("show");
    });
    let effectors = "";
    elem.find(".select-data-effect").each(function (){
        if(!$(this).hasClass("click-function-activated")) {
            $(this).change(function () {
                if($(this).hasClass("validated")){
                    $(this).trigger("validate");
                }
                $($(this).attr("data-effects")).attr($(this).attr("data-attr"),
                    $(this).val()).trigger("reload_select");
                effectors += effectors === "" ? $(this).attr("data-effects") : " ," + $(this).attr("data-effects");
            });
            if(!$(this).hasClass("deactivate-trigger")){
                $(this).trigger("change");
            }
            $(this).addClass("click-function-activated");
        }
    });
    elem.find(effectors).each(function (){
        if(!$(this).hasClass("click-function-activated")){
            $(this).bind("reload_select", function () {
                let target = $(this);
                target.text("loading.....");
                target.attr("disabled", true);
                let id = target.attr("data-id");
                let type = target.attr("data-type");
                let selected = target.attr("data-selected") === undefined ? 0 : target.attr("data-selected");
                $.ajax({
                    type: "POST",
                    url: systemInfo.API_URL + "select-loader?API_KEY=" + systemInfo.API_KEY
                        + "&type="+type+"&id="+id+"&selected="+selected,
                    data: {},
                    processData: false,
                    contentType: false,
                    success: function (msg) {
                        target.html(msg);
                        target.attr("disabled", false);
                    }, error: function () {
                        target.attr("disabled", false);
                    }
                });
            }).trigger("reload_select");
            $(this).addClass("click-function-activated");
        }
    });
    validated_elem.push(elem);
}

function askDelete(item, id, type, afterLoad = null, head = "delete item"){
    if(typeof Swal === 'undefined'){
        if(confirm('delete?')){
            doDelete(id, type, afterLoad);
        }
        return;
    }
    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#96bb26",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
    }).then((result) => {
        if (result.isConfirmed) {
            doDelete(id, type, afterLoad);
        }
    });
}

function doDelete(id, type, afterLoad){
    let URL = systemInfo.API_URL + "delete";
    $.ajax({
        type: "POST",
        url: URL,
        data: {
            id : id,
            type : type,
            API_KEY : systemInfo.API_KEY
        },
        success: function (msg) {
            let data = null;
            try {
                data = JSON.parse(msg);
            } catch (err) {
                fireError('response error');
                return;
            }
            if(data.message === undefined || data.error === undefined){
                fireError('undefined');
                return;
            }
            if(!data.error){
                fireError(data.message);
                return;
            }
            if(data.redirect !== undefined){
                window.location = data.redirect;
                return;
            }
            if(data.reload !== undefined){
                window.location.reload();
                return;
            }
            if(data.trigger !== undefined){
                Object.keys(data.trigger).forEach(function(key) {
                    $(key).trigger(data.trigger[key]);
                });
            }
            if(data.html !== undefined){
                Object.keys(data.html).forEach(function(key) {
                    $(key).html(data.html[key]);
                });
            }
            if(data.attr !== undefined){
                for (const [dom, value] of Object.entries(data.attr)) {
                    for (const [attribute, newValue] of Object.entries(value)) {
                        $(dom).attr(attribute, newValue);
                    }
                }
            }
            if(data.enabled === undefined){
                $(".delete-effects").attr("disabled", true).attr("href", "#").addClass("disabled");
            }
            if(afterLoad !== null) afterLoad();
        },error: function(){
            fireError('internal error');
        }
    });
}

form_validate();

function form_submit(form, btn, URL = null, afterSuccess = null){
    let formData = new FormData(), hasFiles = false;
    btn.attr("disabled", true);
    formData.append("current_page", systemInfo.CURRENT_URL);
    form.find("input:not(.select-data-search), select, textarea").each(function (e, t) {
        if($(this).attr("type") === "file"){
            if($(this).get(0).files.length !== 0){
                formData.append($(this).attr("name"), $(this).get(0).files[0]);
                hasFiles = true;
            }
        }else if($(this).attr("type") === "checkbox" || $(this).attr("type") === "radio"){
            if($(this).is(":checked")){
                formData.append($(this).attr("name"), $(this).val());
            }
        }else formData.append($(this).attr("name"), $(this).val());
    });
    URL = URL === null ? systemInfo.API_URL + "form" : URL;
    form_pass(hasFiles, btn, formData, URL, $(".form-message"), form, afterSuccess)
}

function form_pass(hasFiles, btn, formData, URL, message, form = $("body"), after_success = null){
    if(hasFiles){
        $.ajax({
            type: "POST",
            url: URL,
            data: formData,
            async: true,
            success: function(msg){
                let data = null;
                try {
                    data = JSON.parse(msg);
                }catch(err) {
                    btn.attr("disabled", false);
                    fireError('response error');
                    if(form !== null) $('html, body').animate({scrollTop: form.offset().top - 120}, 'fast');
                    return;
                }
                if(data.message === undefined || data.error === undefined){
                    btn.attr("disabled", false);
                    fireError('undefined');
                    if(form !== null) $('html, body').animate({scrollTop: form.offset().top - 120}, 'fast');
                    return;
                }
                if(!data.error){
                    btn.attr("disabled", false);
                    fireError(data.message);
                    if(form !== null) $('html, body').animate({scrollTop: form.offset().top - 120}, 'fast');
                    return;
                }
                if(data.reload !== undefined){
                    window.location.reload();
                    return;
                }
                if(data.redirect !== undefined){
                    window.location = data.redirect;
                    return;
                }
                if(data.fill !== undefined){
                    Object.keys(data.fill).forEach(function(key) {
                        $("." + key).attr("src", data.fill[key]);
                    });
                }
                if(data.trigger !== undefined){
                    Object.keys(data.trigger).forEach(function(key) {
                        $(key).trigger(data.trigger[key]);
                    });
                }
                if(data.html !== undefined){
                    Object.keys(data.html).forEach(function(key) {
                        $(key).html(data.html[key]);
                    });
                }
                if(data.attr !== undefined){
                    for (const [elem, value] of Object.entries(data.attr)) {
                        for (const [attribute, newValue] of Object.entries(value)) {
                            $(elem).attr(attribute, newValue);
                        }
                    }
                }
                let emptyForm = $("input[name='empty-form-check']");
                if(emptyForm.length){
                    if(emptyForm.is(":checked")){
                        form.find("input[type='text'], input[type='email'], select, input[type='number'], textarea").val("");
                    }
                }
                btn.attr("disabled", false);
                fireSuccess(data.message);
                if(after_success !== null){
                    after_success();
                }
                if(form !== null) $('html, body').animate({scrollTop: form.offset().top - 120}, 'fast');
            },error: function(){
                btn.attr("disabled", false);
                fireError('response error');
            },
            cache: false,
            contentType: false,
            processData: false
        });
    }else{
        $.ajax({
            type: "POST",
            url: URL,
            data: formData,
            processData: false,
            contentType: false,
            success: function(msg){
                let data = null;
                try {
                    data = JSON.parse(msg);
                }catch(err) {
                    btn.attr("disabled", false);
                    fireError('response error');
                    if(form !== null) $('html, body').animate({scrollTop: form.offset().top - 120}, 'fast');
                    return;
                }
                if(data.message === undefined || data.error === undefined){
                    btn.attr("disabled", false);
                    fireError('undefined');
                    if(form !== null) $('html, body').animate({scrollTop: form.offset().top - 120}, 'fast');
                    return;
                }
                if(!data.error){
                    btn.attr("disabled", false);
                    fireError(data.message);
                    if(form !== null) $('html, body').animate({scrollTop: form.offset().top - 120}, 'fast');
                    return;
                }
                if(data.reload !== undefined){
                    window.location.reload();
                    return;
                }
                if(data.redirect !== undefined){
                    window.location = data.redirect;
                    return;
                }
                if(data.fill !== undefined){
                    Object.keys(data.fill).forEach(function(key) {
                        $("." + key).attr("src", data.fill[key]);
                    });
                }
                if(data.trigger !== undefined){
                    Object.keys(data.trigger).forEach(function(key) {
                        $(key).trigger(data.trigger[key]);
                    });
                }
                if(data.html !== undefined){
                    Object.keys(data.html).forEach(function(key) {
                        $(key).html(data.html[key]);
                    });
                }
                if(data.attr !== undefined){
                    for (const [elem, value] of Object.entries(data.attr)) {
                        for (const [attribute, newValue] of Object.entries(value)) {
                            $(elem).attr(attribute, newValue);
                        }
                    }
                }
                let emptyForm = $("input[name='empty-form-check']");
                if(emptyForm.length){
                    if(emptyForm.is(":checked")){
                        form.find("input[type='text'], input[type='email'], select, input[type='number'], textarea").val("");
                    }
                }
                btn.attr("disabled", false);
                fireSuccess(data.message);
                if(after_success !== null){
                    after_success();
                }
                if(form !== null) $('html, body').animate({scrollTop: form.offset().top - 120}, 'fast');
            },
            error: function(){
                btn.attr("disabled", false);
                fireError('response error');
            },
        });
    }

}

function html_dialog(html, head = "", afterLoad = null){
    let alert_modal = $(".dialog-modal");
    if(!alert_modal.length){
        let modal = '\n' +
            '<div class="modal fade dialog-modal" tabindex="-1">\n' +
            '    <div class="modal-dialog">\n' +
            '        <div class="modal-content">\n' +
            '            <div class="modal-header">\n' +
            '                <h5 class="modal-title">' + head + '</h5>\n' +
            '                <button type="button" class="btn-close me-auto" data-bs-dismiss="modal" aria-label="Close"></button>\n' +
            '            </div>\n' +
            '            <div class="modal-body">\n' +
            '                <div class="container-fluid data-html">\n' +
            '                </div>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</div>';
        $("body").append(modal);
        alert_modal = $(".dialog-modal");
    }
    alert_modal.find(".modal-title").html(head);
    alert_modal.find(".data-html").html(html);
    form_validate(alert_modal);
    alert_modal.modal("show");
}

function form_dialog(form_inputs, head = "", afterLoad = null){
    let alert_modal = $(".form-modal");
    let input = "";
    form_inputs.forEach(function (val){
        input += '<input type="' + val.type + '" class="form-input dialog-value" name="' + val.name
            + '" value="' + val.val + '" placeholder="' + val.placeholder + '">\n';

    });
    input += '<input type="hidden" class="form-input dialog-value" value="' + systemInfo.API_KEY + '" name="API_KEY">\n';

    if(!alert_modal.length){
        let modal = '\n' +
            '<div class="modal fade form-modal" tabindex="-1">\n' +
            '    <div class="modal-dialog">\n' +
            '        <div class="modal-content">\n' +
            '            <div class="modal-header">\n' +
            '                <h5 class="modal-title">' + head + '</h5>\n' +
            '                <button type="button" class="btn-close me-auto" data-bs-dismiss="modal" aria-label="Close"></button>\n' +
            '            </div>\n' +
            '            <div class="modal-body">\n' +
            '                <div class="container-fluid">\n' +
            '                    <div class="row">\n' +
            '                        <div class="col-12 alert-message"></div>\n' +
            '                        <div class="col-12">\n' +
            '                        <div class="dialog-msg"></div>\n' +
            '                        <div class="dialog-form"><form class="dialog-form-data">\n' + input  + ' </form></div>\n' +
            '                        <button type="button" class="btn btn-primary dialog-save">save</button>\n' +
            '                        </div>\n' +
            '                    </div>\n' +
            '                </div>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</div>';
        $("body").append(modal);
        alert_modal = $(".form-modal");
    }
    alert_modal.find(".modal-title").html(head);
    alert_modal.find(".dialog-form-data").html(input);
    alert_modal.find(".dialog-save").unbind("click");
    alert_modal.find(".dialog-save").click(function () {

        let formData = new FormData(), hasFiles = false;
        $(this).attr("disabled", true);
        alert_modal.find(".dialog-form-data").find("input:not(.select-data-search), select, textarea").each(function (e, t) {
            if($(this).attr("name") != "empty-form-check"){
                if($(this).attr("type") === "file"){
                    if($(this).get(0).files.length !== 0){
                        formData.append($(this).attr("name"), $(this).get(0).files[0]);
                        hasFiles = true;
                    }
                }else if($(this).attr("type") === "checkbox" || $(this).attr("type") === "radio"){
                    if($(this).is(":checked")){
                        formData.append($(this).attr("name"), $(this).val());
                    }
                }else formData.append($(this).attr("name"), $(this).val());
            }
        });
        form_pass(hasFiles, $(this), formData, systemInfo.API_URL + "/dialogs", alert_modal.find(".alert-message"), null, afterLoad);
    });
    alert_modal.keypress(function(e) {
        if(e.which === 13) {
            if(!e.shiftKey){
                alert_modal.find(".dialog-save").trigger("click");
            }
        }
    });
    alert_modal.modal("show");
}

function alert_msg(msg, head = "تنبية"){
    let alert_modal = $(".alert-modal");
    if(!alert_modal.length){
        let modal = '\n' +
            '<div class="modal fade alert-modal" tabindex="-1">\n' +
            '    <div class="modal-dialog">\n' +
            '        <div class="modal-content">\n' +
            '            <div class="modal-header">\n' +
            '                <h5 class="modal-title">' + head + '</h5>\n' +
            '                <button type="button" class="btn-close me-auto" data-bs-dismiss="modal" aria-label="Close"></button>\n' +
            '            </div>\n' +
            '            <div class="modal-body">\n' +
            '                <div class="container-fluid">\n' +
            '                    <div class="row">\n' +
            '                        <div class="col-12 alert-message">\n' +
            '                        </div>\n' +
            '                    </div>\n' +
            '                </div>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</div>';
        $("body").append(modal);
        alert_modal = $(".alert-modal");
    }
    alert_modal.modal("show").find(".alert-message").html(msg);
}

$(".m-add-to-cart").click(function () {
    let form = "";
    if($(this).hasClass("ask-quantity")){
        form += "<input type='number' class='form-control' min='1' name='order_quantity' placeholder='quantity' required/><hr>";
    }
    if($(this).hasClass("ask-size")){
        form += "<input type='text' class='form-control' name='order_size' placeholder='size' required/><hr>";
    }
    if($(this).hasClass("ask-payment")){
        form += "<input type='text' pattern='\\d*' class='form-control' name='c_number' placeholder='card number' maxlength='16' required/><hr>";
        form += "<input type='text' class='form-control' name='c_number' placeholder='name on card' required/><hr>";
        form += "<input type='text' pattern='\\d*' class='form-control' name='c_number' placeholder='pin' maxlength='3' required/><hr>";
        form += "<input type='text' class='form-control' name='c_number' placeholder='expiry' maxlength='5' required/><hr>";
    }
    if(!$("#order_modal").length){
        let html = '<div class="modal fade dialog-modal" id="order_modal" tabindex="-1">' +
            '    <div class="modal-dialog">' +
            '        <div class="modal-content">' +
            '            <div class="modal-header">' +
            '                <button type="button" class="btn-close me-auto" data-bs-dismiss="modal" aria-label="Close"></button>' +
            '            </div>' +
            '            <div class="modal-body">' +
            '                <div class="container-fluid data-html">' +
            '<form method="post" class="order-form" action=""><div class="order_elems">' + form + '</div> ' +
                '<button name="activate_order" class="' + $(".m-add-to-cart").attr("class") + '" type="submit">' + $(".m-add-to-cart").text() + '</button></form>' +
            '                </div>' +
            '            </div>' +
            '        </div>' +
            '    </div>' +
            '</div>';

        try{
            $("body").append(html);
            if($(this).hasClass("ask-quantity") || $(this).hasClass("ask-payment") || $(this).hasClass("ask-size")){
                $("#order_modal").modal("show");
            }else{
                $("#order_modal").find('button[name="activate_order"]').trigger('click');
            }
        }catch(ex){
            $(".m-add-to-cart").parent().append('<form method="post" class="order-form" action=""><div class="order_elems">' + form + '</div> ' +
                '<button name="activate_order" class="' + $(".m-add-to-cart").attr("class") + '" type="submit">' + $(".m-add-to-cart").text() + '</button></form>');
            $(".m-add-to-cart:not([name='activate_order'])").addClass("hide");
        }
    }
    else{
        try{
            $("#order_modal").find("order_elem").html(form);
            if($(this).hasClass("ask-quantity") || $(this).hasClass("ask-payment") || $(this).hasClass("ask-size")){
                $("#order_modal").modal("show");
            }else{
                $("#order_modal").find('button[name="activate_order"]').trigger('click');
            }
        }catch(ex){
        }
    }
});

$(".add-to-my-fav").click(function () {
    window.location = window.location + "&addToMyWishList";
});

$(".search-list").each(function () {
    let list = $(this);
    let inputName = list.attr("data-name");
    let multi = list.attr("data-multi") === "true";
    list.bind("dismiss", function () {
        list.find("input[type='hidden']").remove();
        list.find("a").removeClass("hide");
        list.find("input[name='search']").val("");
        list.find("a:not(.selected)").removeClass("active");
    });
    list.find("input[name='search']").on('input', function () {
        let search = $(this).val();
        if(search === ""){
            list.find("a").removeClass("hide");
            return;
        }
        list.find("a").each(function () {
            if($(this).text().includes(search)){
                $(this).removeClass("hide");
            }else{
                $(this).addClass("hide");
            }
        });
    });
    list.find("a").click(function () {
        if($(this).hasClass("active")){
            let id = "select-";
            if(multi){
                id += inputName + "-" + $(this).attr("data-id");
                $("#" + id).remove();
            }else{
                id += inputName;
                $("#" + id).val("");
            }
            $(this).removeClass("active");
        }else{
            let input = $("input[name='" + inputName + "']");
            if(input.length){
                if(multi){
                    input = input.clone();
                    input.val($(this).attr("data-id"));
                    list.append(input);
                    $(this).addClass("active");
                }else{
                    input.val($(this).attr("data-id"));
                    list.find("a").removeClass("active");
                    $(this).addClass("active");
                }
                return false;
            }
            let html = "", id = "select-";
            if(multi){
                id += inputName + "-" + $(this).attr("data-id");
                html = "<input id='" + id +
                    "' type='hidden' name='" + inputName + "[]' value='" + $(this).attr("data-id") + "'>";
            }else{
                id += inputName;
                html = "<input id='" + id + "' type='hidden' name='" + inputName + "' value='" + $(this).attr("data-id") + "'>";
            }
            list.append(html);
            $(this).addClass("active")
        }
        return false;
    });
    list.find(".selected").trigger("click");
});

function fireError(error){
    try {
        switch(alertType){
            case "sweetalert":
                Swal.fire({icon: "error",title: "Error",text: error});
                break;
            case "toastr":
                toastr.options = {
                    "closeButton": true,
                    "newestOnTop": true,
                    "progressBar": true,
                    "positionClass": "toast-top-right",
                    "preventDuplicates": false,
                    "onclick": null,
                    "showDuration": "300",
                    "hideDuration": "1000",
                    "timeOut": "5000",
                    "extendedTimeOut": "1000",
                    "showEasing": "swing",
                    "hideEasing": "linear",
                    "showMethod": "fadeIn",
                    "hideMethod": "fadeOut"
                }
                toastr.error(error);
                break;
            default:
                alert(error);
        }
    }catch (ex){
        console.log(ex);
        alert(error);
    }
}

function fireSuccess(success){
    try {
        switch(alertType){
            case "sweetalert":
                Swal.fire({icon: "success",title: "Success",text: success});
                break;
            case "toastr":
                toastr.options = {
                    "closeButton": true,
                    "newestOnTop": true,
                    "progressBar": true,
                    "positionClass": "toast-top-right",
                    "preventDuplicates": false,
                    "onclick": null,
                    "showDuration": "300",
                    "hideDuration": "1000",
                    "timeOut": "5000",
                    "extendedTimeOut": "1000",
                    "showEasing": "swing",
                    "hideEasing": "linear",
                    "showMethod": "fadeIn",
                    "hideMethod": "fadeOut"
                }
                toastr.success(success);
                break;
            default:
                alert(success);
        }
    }catch (ex){
        console.log(ex);
        alert(success);
    }
}