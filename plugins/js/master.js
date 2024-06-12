/*
 *	www.recycle.com
 *******************************************************/

/* HTML document is loaded. DOM is ready. 
-----------------------------------------*/
$(document).ready(function(){

	/* Mobile menu */
	$('.mobile-menu-icon').click(function(){
		$('.master-left-nav').slideToggle();				
	});

	/* Close the widget when clicked on close button */
	$('.master-content-widget .fa-times').click(function(){
		$(this).parent().slideUp(function(){
			$(this).hide();
		});
	});
	$(".master-action-buttons .insert-block").click(function () {
		let formData = new FormData();
		formData.append("page", $(".master-action-buttons").attr("data-id"));
		formData.append("type", "insert-page-block");
		form_pass(false, $(this), formData, systemInfo.API_URL + "dialogs", $(".alert-message"),
			null, function () {
				$(".page-preview").trigger("reload");
		});
	});
	$(".master-action-buttons .refresh").click(function () {
		$(".page-preview").trigger("reload");
	});
});

$(document).ready(function (){
	$(".page-preview").bind("reload", function () {
		let div = $(this);
		div[0].src = div[0].src;
	}).trigger("reload");
});

let loadedPart = null;

function activatePageControls(){
	let content = $('.page-preview').contents();
	if(loadedPart !== null){
		content.find(".master-preview-part[data-block='" + loadedPart + "']").addClass("selected");
	}
	$(".master-action-controls").bind("reload", function () {
		$(".master-action-buttons").addClass("hide");
		$(".master-action-controls").removeClass("hide").html(systemInfo.LOADER_GIF)
			.load(systemInfo.API_URL + "/block-controls?block="+loadedPart, function () {
				activate_list();
			}).addClass("selected");
	});
	content.find(".master-preview-part").click(function () {
		let activeBlock = $(this).attr("data-block");
		if(activeBlock === loadedPart){
			return false;
		}
		content.find(".master-preview-part").removeClass("selected");
		$(this).addClass("selected");
		loadedPart = activeBlock;
		$(".master-action-buttons").addClass("hide");
		$(".master-action-controls").removeClass("hide").html(systemInfo.LOADER_GIF)
			.load(systemInfo.API_URL + "/block-controls?block="+loadedPart, function () {
				activate_list();
				form_validate($(".master-action-controls"));
			}).addClass("selected");
		return false;
	});
}

function activate_list(){
	$(".form-data-list").each(function (){
		function list_item(id, name, input, checked = false){
			return '\n' +
				'<li class="client bill-list-item bill-search-item '
				+ (checked ? "selected" : "") + '">\n' +
				'<div class="info" data-id="' + id + '">\n' +
				'<span class="name search-action" data-search="' + name + '">' + name + '</span>\n' +
				'</div>\n' +
				'<input type="checkbox" value="' + id + '" name="' + input + '" class="list-checkbox form-input" '
				+ (checked ? "checked" : "") + '>\n' +
				'</li>';
		}
		if(!$(this).hasClass("click-function-activated")){
			let elm = $(this);
			let selected = 0;
			if(elm.attr("data-selected") !== undefined){
				selected = parseInt(elm.attr("data-selected"));
			}
			let input_name = elm.attr("data-name") !== undefined ? elm.attr("data-name") : "client";
			elm.bind("reload", function () {
				$.ajax({
					type: "POST",
					url: systemInfo.API_URL + "JSON",
					data: {
						"type" : elm.attr("data-type"),
						"search" : elm.find(".data-search").val(),
						"key" : systemInfo.API_KEY
					},
					success: function (msg) {
						let data = null;
						try {
							data = JSON.parse(msg);
							if(data.error == "true" && data.error != "false" ||
								(data.data === undefined && data.number === undefined)){
								console.log(data.message);
								return;
							}
							let html = "";
							Object.entries(data.data).forEach(entry => {
								const [key, value] = entry;
								html += list_item(value["id"], value["name"], input_name, selected === parseInt(value["id"]));
							});
							elm.find(".list-data-in").html(html);
							let multipleSelect = elm.attr("data-multiple") == "true";
							let listItem = elm.find(".bill-list-item");
							listItem.unbind("click");
							listItem.click(function () {
								let checkbox = $(this).find(".list-checkbox");
								if(checkbox.is(":checked")){
									checkbox.prop("checked", false);
									checkbox.trigger("value-change");
									$(this).removeClass("selected");
								}else{
									if(!multipleSelect){
										listItem.removeClass("selected");
										listItem.find(".list-checkbox").prop("checked", false);
										elm.attr("data-selected", listItem.val());
									}
									checkbox.prop("checked", true);
									checkbox.trigger("value-change");
									$(this).addClass("selected");
								}
							});
						} catch (err) {
						}
					},error: function(){
					}
				});
			}).trigger("reload");
			elm.addClass("click-function-activated");
			let lastSearch = "";
			elm.find(".data-search").on("input", function (){
				elm.trigger("reload");
			});
		}
	});
}

function closePageBlock() {
	loadedPart = null;
	$(".master-action-buttons").removeClass("hide");
	$(".master-action-controls").html("").addClass("hide");
	$(".master-preview-part").removeClass("selected");
}

$(".edit-menu-item").click(function () {
	let parent_td = $(this).parent();
	let id = parent_td.find(".master-delete-btn").attr("data-id");
	let parent_tr = parent_td.parent();
	let name = parent_tr.find("td:first").text();
	let page = parent_tr.find("td:nth-child(2)").text();
	let link = parent_tr.find("td:nth-child(3)").text();
	let form = $("form.add-data-type-menu");
	form.find("input[name='item']").val(id);
	form.find("input[name='name']").val(name).trigger("input");
	form.find("select[name='page'] option").filter(function() {
		return $(this).text() == page;
	}).attr('selected', true).trigger("change");
	if(link != "#") form.find("input[name='link']").val(link).trigger("input");
	$("#add-data-type-menu").modal("show");
	return false;
});

$(".add-menu").click(function () {
	$("form.add-data-type-menu").find("input[name='item']").val(0);
});
$(".move-menu-item-up").click(function () {
	let formData = new FormData();
	formData.append("item", $(this).attr("data-id"));
	formData.append("type", "move-menu-item-up");
	form_pass(false, $(this), formData, systemInfo.API_URL + "dialogs", $(".alert-message"), null);
	return false;
});
$(".move-menu-item-down").click(function () {
	let formData = new FormData();
	formData.append("item", $(this).attr("data-id"));
	formData.append("type", "move-menu-item-down");
	form_pass(false, $(this), formData, systemInfo.API_URL + "dialogs", $(".alert-message"), null);
	return false;
});